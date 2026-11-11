const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const editorPath = 'app/dashboard/lead-magnets/[id]/LeadMagnetEditor.tsx'
const source = fs.readFileSync(editorPath, 'utf8')
const helpers = { exports: {} }
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/crm/leadMagnetNames.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText, { exports: helpers.exports })
const { getInternalName, webinarUpdatePayload } = helpers.exports
const fixture = () => ({ id: 'existing', user_id: 'owner', magnet_type: 'webinar', title: 'Título público original',
  capture_page_title: 'Título de captura diferente', slug: 'url-original', internal_name: null,
  capture_page_image: null, cover_image_url: 'legacy-cover', views_count: 12, leads_count: 4,
  event_config: { eventType: 'event', startAt: '2026-12-01', capacity: 30 }, form_fields: [{ name: 'email' }] })
const plain = value => JSON.parse(JSON.stringify(value))
function handler(name) {
  const ast = ts.createSourceFile(editorPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  let expression
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(ast) === name) expression = node.initializer.getText(ast)
    ts.forEachChild(node, visit)
  }
  visit(ast)
  assert.ok(expression)
  return ts.transpileModule(`(${expression})`, { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
}
async function run(name, magnet, savedMagnet = fixture(), failure = false) {
  const calls = []; const messages = []; let saved
  const chain = { from: table => { assert.equal(table, 'lead_magnets'); return chain },
    insert: payload => { calls.push(['insert', plain(payload)]); return chain },
    update: payload => { calls.push(['update', plain(payload)]); return chain },
    eq: (...args) => { calls.push(['eq', ...args]); return chain }, select: () => chain,
    single: async () => ({ error: failure ? new Error('mock failure') : null, data: { id: 'new-id' } }) }
  const context = { magnet, savedMagnet, userId: 'owner', supabase: chain,
    getInternalName, webinarUpdatePayload, generateUniqueSlug: async title => { calls.push(['slug', title]); return 'new-unique-url' },
    setIsSaving() {}, setHasChanges() {}, setSavedMagnet(value) { saved = value },
    addToast: (...args) => messages.push(args), setTimeout() {}, console: { error() {} } }
  await vm.runInNewContext(handler(name), context)()
  return { calls, messages, saved }
}
test('legacy/null fallback; empty internal name is not replaced; Checklist ignores internal_name', () => {
  assert.equal(getInternalName(fixture()), fixture().title)
  assert.equal(getInternalName({ ...fixture(), internal_name: undefined }), fixture().title)
  assert.equal(getInternalName({ ...fixture(), internal_name: '' }), '')
  assert.equal(getInternalName({ ...fixture(), magnet_type: 'checklist', internal_name: 'Ignore' }), fixture().title)
})
test('rename existing webinar writes only internal_name and timestamp; preserves all public fields and data', async () => {
  const original = fixture(); const renamed = { ...original, internal_name: 'Nome privado' }
  const { calls } = await run('handleSave', renamed, original)
  const payload = calls[0][1]
  assert.deepEqual(Object.keys(payload).sort(), ['internal_name', 'updated_at'])
  assert.equal(payload.internal_name, 'Nome privado')
  const persisted = { ...original, ...payload }; delete persisted.updated_at
  assert.deepEqual(persisted, renamed)
  assert.deepEqual(calls.slice(1), [['eq', 'id', 'existing'], ['eq', 'user_id', 'owner']])
})
test('saving unrelated edits preserves internal_name, public titles and legacy cover', async () => {
  const original = { ...fixture(), internal_name: 'Nome já guardado' }
  const { calls } = await run('handleSave', { ...original, event_config: { ...original.event_config, capacity: 50 } }, original)
  assert.deepEqual(Object.keys(calls[0][1]).sort(), ['event_config', 'updated_at'])
  assert.equal(({ ...original, ...calls[0][1] }).internal_name, original.internal_name)
})
test('new campaign stores internal name separately and generates URL from unchanged title', async () => {
  const magnet = { ...fixture(), id: 'NEW', internal_name: 'Privado' }
  const { calls } = await run('handleSave', magnet, magnet)
  assert.deepEqual(calls[0], ['slug', magnet.title])
  const payload = calls[1][1]
  assert.equal(payload.internal_name, 'Privado'); assert.equal(payload.title, magnet.title)
  assert.equal(payload.capture_page_title, magnet.capture_page_title)
  assert.equal(payload.slug, 'new-unique-url')
})
test('legacy save does not invent a name; failed save does not advance baseline', async () => {
  const original = fixture(); delete original.internal_name
  const { calls } = await run('handleSave', original, original)
  assert.deepEqual(Object.keys(calls[0][1]), ['updated_at'])
  const failed = await run('handleSave', { ...original, internal_name: 'Renamed' }, original, true)
  assert.equal(failed.saved, undefined)
  assert.equal(failed.messages.at(-1)[1], 'error')
})
test('Checklist creation and editing still persist title', async () => {
  for (const id of ['NEW', 'existing']) {
    const { calls } = await run('handleSave', { ...fixture(), id, magnet_type: 'checklist', title: 'Checklist editada' })
    const payload = calls.find(c => c[0] === (id === 'NEW' ? 'insert' : 'update'))[1]
    assert.equal(payload.title, 'Checklist editada'); assert.equal('internal_name' in payload, false)
  }
})
test('duplication keeps webinar public title and config, suffixes only internal name; Checklist unchanged', async () => {
  for (const internal_name of [null, 'Privado']) {
    const original = { ...fixture(), internal_name }
    const { calls } = await run('handleDuplicate', original)
    const payload = calls.find(c => c[0] === 'insert')[1]
    assert.equal(payload.title, original.title)
    assert.equal(payload.internal_name, `${internal_name ?? original.title} (cópia)`)
    assert.equal(payload.capture_page_title, original.capture_page_title)
    assert.deepEqual(payload.event_config, original.event_config)
    assert.deepEqual(payload.form_fields, original.form_fields)
    assert.equal(payload.cover_image_url, original.cover_image_url)
    assert.equal(payload.is_active, false); assert.notEqual(payload.slug, original.slug)
  }
  const { calls } = await run('handleDuplicate', { ...fixture(), magnet_type: 'checklist' })
  assert.equal(calls.find(c => c[0] === 'insert')[1].title, `${fixture().title} (cópia)`)
})
test('public pages and visitor email handlers remain byte-identical to approved main', () => {
  const { execFileSync } = require('node:child_process')
  const diff = execFileSync('git', ['diff', 'f0aaa90', '--', 'app/lm', 'app/api/lead-magnets'], { encoding: 'utf8' })
  assert.equal(diff, '')
})
test('reopening and saving after a rename keeps the persisted private name', async () => {
  const original = fixture()
  const renamed = { ...original, internal_name: 'Nome novo' }
  const first = await run('handleSave', renamed, original)
  const persisted = { ...original, ...first.calls[0][1] }
  assert.equal(getInternalName(persisted), 'Nome novo')
  const second = await run('handleSave', { ...persisted, welcome_email_subject: 'Confirmação' }, persisted)
  assert.equal('internal_name' in second.calls[0][1], false)
  assert.equal(({ ...persisted, ...second.calls[0][1] }).internal_name, 'Nome novo')
  assert.equal(({ ...persisted, ...second.calls[0][1] }).title, original.title)
})
