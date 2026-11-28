const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const ts = require('typescript')

const base = '921d08985e12624a447a5b034230e07d8808b251'
const adminId = '00000000-0000-4000-8000-000000000001'
const otherId = '00000000-0000-4000-8000-000000000002'
const routes = {
  'users/update': 'POST',
  'users/addons': 'GET',
  'users/subscription': 'GET',
  'users/subscription-update': 'POST',
  'cards/toggle-publish': 'POST',
  'cards/delete': 'POST',
  'cards/save-as-template': 'POST',
  'ambassadors/activate': 'POST',
  'ambassadors/deactivate': 'POST',
}

function load(path, imports = {}, { source, env = {}, fetch } = {}) {
  const result = ts.transpileModule(source ?? readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    reportDiagnostics: true,
    fileName: path,
  })
  assert.deepEqual(result.diagnostics, [])
  const exports = {}
  function isolatedRequire(name) {
    assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`)
    return imports[name]
  }
  const quietConsole = { log() {}, error() {} }
  new Function('exports', 'require', 'process', 'console', 'fetch', result.outputText)(
    exports, isolatedRequire, { env }, quietConsole, fetch,
  )
  return exports
}

function fixture({ allowlist = adminId, authUnavailable = false, guardSource } = {}) {
  const effects = []
  let authCalls = 0
  const client = {
    auth: {
      async getUser(marker) {
        authCalls++
        if (authUnavailable) throw Error('simulated outage')
        if (marker === 'fixture-admin') return { data: { user: { id: adminId } } }
        if (marker === 'fixture-client') return { data: { user: { id: otherId, user_metadata: { role: 'admin' } } } }
        return { data: { user: null }, error: new Error('simulated invalid session') }
      },
    },
    from(table) {
      effects.push(['from', table])
      const row = { id: 'test-row', name: 'Synthetic record', theme: {}, crm_pro_active: true }
      const query = {
        then(resolve) { resolve({ data: row, error: null }) },
      }
      for (const method of ['select', 'eq', 'order', 'insert', 'update', 'upsert', 'delete', 'maybeSingle', 'single']) {
        query[method] = (...args) => {
          effects.push([method, ...args])
          return query
        }
      }
      return query
    },
  }
  const guard = load('lib/security/requireAdmin.ts', {}, { source: guardSource, env: { KARDME_ADMIN_USER_IDS: allowlist } })
  return {
    effects,
    authCalls: () => authCalls,
    imports: {
      '@/lib/security/requireAdmin': guard,
      '@supabase/supabase-js': { createClient: () => client },
      '@/lib/supabaseServer': { supabaseServer: client },
      'next/server': { NextResponse: Response },
    },
  }
}

function request(method, bearer, target = otherId) {
  const url = new URL('https://example.test/admin')
  url.searchParams.set('userId', target)
  const req = new Request(url, {
    method,
    headers: bearer ? { Authorization: bearer } : {},
    body: method === 'GET' ? undefined : JSON.stringify({
      name: 'Synthetic customer', userId: target, cardId: 'synthetic-card',
      ambassadorId: 'synthetic-ambassador', published: true,
      templateName: 'Synthetic template', durationMonths: 1,
      currentPeriodEnd: '2030-01-01', role: 'admin',
    }),
  })
  return Object.assign(req, { nextUrl: url })
}

function stableEffects(effects) {
  return JSON.stringify(effects).replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '<timestamp>')
}

for (const [route, method] of Object.entries(routes)) {
  const path = `app/api/admin/${route}/route.ts`
  const source = execFileSync('git', ['show', `${base}:${path}`], { encoding: 'utf8' })

  for (const [label, bearer, status, options, target] of [
    ['missing bearer', null, 401],
    ['malformed bearer', 'Bearer multiple words', 401],
    ['invalid session', 'Bearer fixture-invalid', 401],
    ['expired session', 'Bearer fixture-expired', 401],
    ['normal user, own record', 'Bearer fixture-client', 403, {}, otherId],
    ['normal user, other record', 'Bearer fixture-client', 403, {}, adminId],
    ['missing configuration', 'Bearer fixture-admin', 503, { allowlist: null }],
    ['empty configuration', 'Bearer fixture-admin', 503, { allowlist: ' ' }],
    ['malformed configuration', 'Bearer fixture-admin', 503, { allowlist: `${adminId}, invalid` }],
    ['authentication unavailable', 'Bearer fixture-admin', 503, { authUnavailable: true }],
  ]) {
    test(`${route}: ${label}`, async () => {
      const f = fixture(options)
      const req = request(method, bearer, target)
      let requestBodyReads = 0
      const originalJson = req.json.bind(req)
      req.json = () => { requestBodyReads++; return originalJson() }
      const response = await load(path, f.imports)[method](req)
      assert.equal(response.status, status)
      assert.equal(requestBodyReads, 0)
      assert.deepEqual(f.effects, [])
      if (!bearer || label === 'malformed bearer') assert.equal(f.authCalls(), 0)
    })
  }

  test(`${route}: admin preserves the production success contract`, async () => {
    const original = fixture()
    const patched = fixture({ allowlist: ` ${otherId} , ${adminId} ` })
    const baseline = await load(path, original.imports, { source })[method](request(method))
    const result = await load(path, patched.imports)[method](request(method, 'Bearer fixture-admin'))
    assert.equal(result.status, 200)
    assert.equal(result.status, baseline.status)
    const resultBody = await result.json()
    const baselineBody = await baseline.json()
    assert.deepEqual(resultBody, baselineBody)
    assert.equal(patched.authCalls(), 1)
    assert.ok(patched.effects.length > 0)
    assert.equal(stableEffects(patched.effects), stableEffects(original.effects))
  })
}

test('eight management call sites pass the existing Supabase session to the fetch helper', () => {
  const byFile = {
    'app/admin/clientes/[userId]/page.tsx': [
      'users/addons', 'users/subscription', 'users/update',
      'cards/toggle-publish', 'cards/delete', 'cards/save-as-template',
    ],
    'app/dashboard/admin/clients/AmbassadorsTab.tsx': ['ambassadors/activate', 'ambassadors/deactivate'],
  }
  for (const [path, expected] of Object.entries(byFile)) {
    const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
    const found = []
    function visit(node) {
      if (ts.isCallExpression(node)) {
        const method = node.expression.getText(file)
        const url = node.arguments[method === 'adminApiFetch' ? 1 : 0]?.getText(file) ?? ''
        const route = expected.find(route => new RegExp(`^['"\x60]/api/admin/${route}(?:[?'"\x60])`).test(url))
        if (route) {
          assert.equal(method, 'adminApiFetch')
          assert.equal(node.arguments[0].getText(file), 'supabase')
          found.push(route)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(file)
    assert.deepEqual(found.sort(), expected.sort())
  }
})

test('management fetch sends the Bearer and preserves method and payload', async () => {
  const fetchCalls = []
  const response = Response.json({}, { status: 403 })
  const { adminApiFetch } = load('lib/admin-api-fetch.ts', {}, {
    fetch: async (...args) => { fetchCalls.push(args); return response },
  })
  const client = { auth: { getSession: async () => ({ data: { session: { access_token: 'fixture-admin' } } }) } }
  const body = JSON.stringify({ id: 'synthetic' })
  const result = await adminApiFetch(client, '/api/admin/cards/delete', {
    method: 'POST', body, headers: { 'Content-Type': 'application/json' },
  })
  assert.equal(result, response)
  assert.equal(fetchCalls.length, 1)
  const [path, init] = fetchCalls[0]
  assert.equal(path, '/api/admin/cards/delete')
  assert.equal(init.headers.get('Authorization'), 'Bearer fixture-admin')
  assert.equal(init.headers.get('Content-Type'), 'application/json')
  assert.equal(init.method, 'POST')
  assert.equal(init.body, body)
  assert.equal(init.redirect, 'error')

  const missing = { auth: { getSession: async () => ({ data: { session: null } }) } }
  await assert.rejects(adminApiFetch(missing, path), /Sem autenticação/)
  assert.equal(fetchCalls.length, 1)
})

if (process.env.KARDME_P0_RECOVERY_GUARD) {
  const guardSource = readFileSync(process.env.KARDME_P0_RECOVERY_GUARD, 'utf8')
  for (const [route, method] of Object.entries(routes)) {
    test(`${route}: containment blocks even a verified administrator`, async () => {
      const f = fixture({ guardSource })
      const path = `app/api/admin/${route}/route.ts`
      const response = await load(path, f.imports)[method](request(method, 'Bearer fixture-admin'))
      assert.equal(response.status, 503)
      assert.equal(f.authCalls(), 1)
      assert.deepEqual(f.effects, [])
    })
  }
}
