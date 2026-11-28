const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { test } = require('node:test')
const ts = require('typescript')

const pagePath = 'app/admin/clientes/[userId]/page.tsx'
const page = ts.createSourceFile(pagePath, readFileSync(pagePath, 'utf8'), ts.ScriptTarget.Latest, true)

function findSaveHandler(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === 'saveStripeSubscription') {
    return node
  }
  return ts.forEachChild(node, findSaveHandler)
}

const handler = findSaveHandler(page)
assert.ok(handler, 'The subscription save handler must exist')

test('subscription editor calls the existing administrative POST route with the expected session and payload', async () => {
  const userId = '00000000-0000-4000-8000-000000000002'
  const editingStripePeriodEnd = '2030-01-01'
  const currentPeriodEnd = '2030-01-01T23:59:59Z'
  const stripeSubscription = { id: 'synthetic-subscription' }
  const requests = []
  const alerts = []
  const updates = []
  const dependencies = {
    editingStripePeriodEnd,
    userId,
    stripeSubscription,
    supabase: {
      auth: { getSession: async () => ({ data: { session: { access_token: 'fixture-admin' } } }) },
    },
    async fetch(path, init) {
      requests.push({ path, init })
      return Response.json({ success: true })
    },
    setStripeSubscription: value => updates.push(value),
    setSavingStripe() {},
    setEditingStripeModal() {},
    alert: message => alerts.push(message),
  }
  const handlerCode = ts.transpileModule(handler.getText(page), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  const save = new Function(
    ...Object.keys(dependencies),
    `${handlerCode}\nreturn saveStripeSubscription`,
  )(...Object.values(dependencies))

  await save()

  assert.equal(requests.length, 1)
  const [{ path, init }] = requests
  assert.equal(path, '/api/admin/users/subscription-update')
  const routePath = `app${path}/route.ts`
  const route = ts.createSourceFile(routePath, readFileSync(routePath, 'utf8'), ts.ScriptTarget.Latest, true)
  assert.ok(route.statements.some(statement =>
    ts.isFunctionDeclaration(statement) &&
    statement.name?.text === init.method &&
    statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword),
  ), 'The route must export a handler for the method used by the editor')
  assert.equal(init.method, 'POST')
  assert.equal(new Headers(init.headers).get('authorization'), 'Bearer fixture-admin')
  assert.equal(new Headers(init.headers).get('content-type'), 'application/json')
  assert.deepEqual(JSON.parse(init.body), { userId, currentPeriodEnd })
  assert.deepEqual(updates, [{ ...stripeSubscription, current_period_end: currentPeriodEnd }])
  assert.deepEqual(alerts, ['Subscrição atualizada!'])
})
