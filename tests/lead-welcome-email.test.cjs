const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText
  vm.runInNewContext(code, { exports, require: name => {
    if (!(name in dependencies)) throw Error(`Unexpected dependency: ${name}`)
    return dependencies[name]
  }, process: { env: {} }, console: { error() {} } })
  return exports
}
const i18n = load('lib/i18n/leadWelcomeEmail.ts')
const sanitizer = load('lib/sanitizeWelcomeHtml.ts', { 'isomorphic-dompurify': require('isomorphic-dompurify') })
const composer = load('lib/leadWelcomeEmail.ts', { './i18n/leadWelcomeEmail': i18n, './sanitizeWelcomeHtml': sanitizer })
const { JSDOM } = require('jsdom')
function documentOf(html) { return new JSDOM(html).window.document }
const vars = { nome: 'Alice', email: 'alice@example.invalid', cardTitle: 'Example' }
for (const language of ['en', 'pt', 'pt-br', 'es', 'fr', 'de', 'it', 'ar']) {
  test(`complete default and confirmation in ${language}`, () => {
    const result = composer.composeLeadWelcomeEmail({ language, variables: vars, confirmUrl: 'https://example.invalid/confirm?token=synthetic' })
    const tr = i18n.welcomeTranslations[language]
    assert.equal(result.subject, tr.subject.replace('{cardTitle}', 'Example'))
    for (const key of ['confirmation', 'button', 'instructions', 'notice']) assert.ok(result.html.includes(tr[key]), key)
    assert.ok(result.html.includes(`lang="${language}"`))
    assert.ok(result.html.includes(`dir="${language === 'ar' ? 'rtl' : 'ltr'}"`))
    assert.ok(result.html.includes('font-size:16px;font-weight:400;line-height:1.5'))
    assert.equal(result.html.includes('{nome}'), false)
    assert.equal(result.html.includes('{cardTitle}'), false)
  })
}
test('server validation and legacy English fallback', () => {
  for (const value of [undefined, null, '', 'xx', {}, ['fr'], 3, 'fr-FR']) assert.equal(i18n.resolveWelcomeLanguage(value), 'en')
  assert.equal(i18n.resolveWelcomeLanguage(' FR '), 'fr')
  assert.equal(i18n.resolveWelcomeLanguage('PT-BR'), 'pt-br')
})
test('existing custom HTML, inline styles, variables and newline behavior preserved', () => {
  const body = '<h2 style="font-size:24px;font-weight:900">Bonjour {nome}</h2>\n<p>{email} — {cardTitle}</p>\\n'
  const result = composer.composeLeadWelcomeEmail({ language: 'ar', subject: 'Mon sujet {nome}', body, variables: vars })
  assert.equal(result.subject, 'Mon sujet Alice')
  const doc = documentOf(result.html)
  assert.equal(doc.querySelector('h2').textContent, 'Bonjour Alice')
  assert.equal(doc.querySelector('h2').style.fontSize, '24px')
  assert.equal(doc.querySelector('h2').style.fontWeight, '900')
  assert.ok(doc.body.textContent.includes('alice@example.invalid — Example'))
  assert.ok(result.html.includes('<div dir="auto">'))
  assert.equal(result.html.includes('border-top:'), false)
})
test('confirmation links are attribute-escaped; custom text survives sanitization', () => {
  const result = composer.composeLeadWelcomeEmail({ variables: vars, body: '<span data-custom="yes">Text</span>', confirmUrl: 'https://example.invalid/?a=1&b="two"' })
  assert.ok(result.html.includes('href="https://example.invalid/?a=1&amp;b=&quot;two&quot;"'))
  assert.equal(documentOf(result.html).querySelector('span').textContent, 'Text')
})
async function submit(options = {}) {
  const sent = []; const writes = []
  const client = { from(table) {
    let operation = 'read'; let payload; let selection
    const value = () => {
      if (operation !== 'read') {
        writes.push({ table, operation, payload })
        return { data: table === 'leads' && operation === 'insert' ? [{ id: 'lead' }] : null, error: null }
      }
      if (table === 'cards') return { data: { user_id: 'owner', name: options.noName ? null : 'Example', crm_pro_welcome_subject: options.subject, crm_pro_welcome_body: options.body }, error: null }
      if (table === 'profiles') return { data: { email: options.noOwnerEmail ? null : 'owner@example.invalid' }, error: null }
      if (table === 'user_addons') return { data: { crm_pro_active: options.pro !== false }, error: null }
      return { data: { email_confirmed_at: options.confirmed ? '2026-01-01' : null, email_confirm_token: null }, error: null }
    }
    const q = { select(s) { selection = s; return q }, eq() { return q }, insert(p) { operation = 'insert'; payload = p; return q }, update(p) { operation = 'update'; payload = p; return q }, single: async () => value(), maybeSingle: async () => value(), then(resolve, reject) { return Promise.resolve(value()).then(resolve, reject) } }
    return q
  } }
  const route = load('app/api/leads/route.ts', {
    'next/server': { NextResponse: { json: (body, meta) => ({ body, ...meta }) } },
    crypto: { randomBytes: () => ({ toString: () => 'synthetic-token' }) },
    '@supabase/supabase-js': { createClient: () => client },
    '@/lib/email': { sendEmail: async payload => { sent.push(payload); if (options.failWelcome && sent.length === 2) throw Error('mock failure'); return { data: { id: 'mock' } } } },
    '@/lib/leadWelcomeEmail': composer,
    '@/lib/i18n/leadWelcomeEmail': i18n,
  })
  const response = await route.POST({ json: async () => ({ cardId: 'card', name: 'Alice', email: vars.email, marketingOptIn: options.optIn !== false, consentGiven: true, language: options.language }), headers: { get: () => null } })
  return { response, sent, writes }
}
test('route propagates visitor French and preserves custom content', async () => {
  const { response, sent, writes } = await submit({ language: 'fr', subject: 'Sujet privé', body: '<b>Bonjour {nome}</b>' })
  assert.equal(response.status, 200)
  assert.equal(sent.length, 2)
  assert.equal(sent[1].subject, 'Sujet privé')
  assert.equal(documentOf(sent[1].html).querySelector('b').textContent, 'Bonjour Alice')
  assert.ok(sent[1].html.includes('Confirmer mon adresse email'))
  assert.equal(writes.some(w => w.payload && 'email_confirmed_at' in w.payload), false)
  assert.equal(writes.find(w => w.table === 'leads' && w.operation === 'insert').payload[0].marketing_opt_in, true)
})
test('legacy and invalid language use English, including missing card name', async () => {
  for (const language of [undefined, 'invalid']) {
    const { sent } = await submit({ language, noName: true })
    assert.equal(sent[1].subject, 'Welcome to my digital card! 🎉')
    assert.ok(sent[1].html.includes('Confirm email'))
  }
})
test('existing sending gates unchanged: opt-out, no CRM Pro, no owner email', async () => {
  for (const [options, count] of [[{ optIn: false }, 1], [{ pro: false }, 0], [{ noOwnerEmail: true }, 0]]) {
    const { sent, writes } = await submit(options)
    assert.equal(sent.length, count)
    if (options.optIn === false) {
      assert.equal(writes.find(w => w.table === 'leads' && w.operation === 'insert').payload[0].marketing_opt_in, false)
      assert.equal(writes.some(w => w.operation === 'update'), false)
    }
  }
})
test('already confirmed lead receives no confirmation block; failed delivery is logged', async () => {
  const confirmed = await submit({ confirmed: true })
  assert.equal(confirmed.sent[1].html.includes('border-top:'), false)
  const failed = await submit({ failWelcome: true })
  assert.ok(failed.writes.some(w => w.table === 'lead_activities' && w.payload.some(x => x.type === 'welcome_email_failed')))
})
test('form submits active visitor language and confirmation endpoint remains unchanged', () => {
  const source = fs.readFileSync('components/blocks/LeadFormBlock.tsx', 'utf8')
  assert.match(source, /language: lang/)
  const { execFileSync } = require('node:child_process')
  assert.equal(execFileSync('git', ['diff', 'HEAD', '--', 'app/api/confirm-email/route.ts'], { encoding: 'utf8' }), '')
})
test('partial custom templates keep their historical cardTitle fallback', async () => {
  const customBody = await submit({ language: 'fr', noName: true, body: '<i>{cardTitle}</i>' })
  assert.equal(customBody.sent[1].subject, 'Bienvenue chez ma carte numérique ! 🎉')
  assert.equal(documentOf(customBody.sent[1].html).querySelector('i').textContent, 'o meu cartão digital')
  const customSubject = await submit({ language: 'fr', noName: true, subject: 'Custom {cardTitle}' })
  assert.equal(customSubject.sent[1].subject, 'Custom o meu cartão digital')
  assert.ok(customSubject.sent[1].html.includes('ma carte numérique'))
})
test('custom subject and HTML are stable across visitor languages', () => {
  for (const language of i18n.welcomeLanguages) {
    const result = composer.composeLeadWelcomeEmail({ language, variables: vars, subject: 'Mon sujet — {email}', body: '<p style="color:red">Bonjour {nome}</p>\r\nSuite' })
    assert.equal(result.subject, 'Mon sujet — alice@example.invalid')
    const paragraph = documentOf(result.html).querySelector('p')
    assert.equal(paragraph.textContent, 'Bonjour Alice')
    assert.equal(paragraph.style.color, 'red')
    assert.ok(documentOf(result.html).body.textContent.includes('Suite'))
  }
})
