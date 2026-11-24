const { test } = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { runInThisContext } = require('node:vm')
const ts = require('typescript')

function load(file, mocks) {
  const source = readFileSync(new URL('../' + file, 'file://' + __filename), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  })
  const exports = {}
  runInThisContext('(function(require, exports) {' + outputText + '\n})')(
    name => {
      if (Object.hasOwn(mocks, name)) return mocks[name]
      if (name === 'server-only') return {}
      if (name === 'next/server') return { NextResponse: { json: Response.json } }
      if (name === 'crypto' || name.startsWith('node:')) return require(name)
      throw new Error('Unexpected dependency: ' + name)
    }, exports)
  return exports
}

function fixture() {
  const sent = []
  const leads = [
    { id: 'lead-a', user_id: 'account-a', email: 'lead-a@example.test', card_id: 'card-a', marketing_opt_in: true },
    { id: 'lead-b', user_id: 'account-b', email: 'lead-b@example.test', card_id: 'card-b', marketing_opt_in: true },
  ]
  const tables = {
    leads,
    cards: [{ id: 'card-a', user_id: 'account-a' }, { id: 'card-b', user_id: 'account-b' }],
    email_unsubscribes: [],
    scheduled_tasks: [],
    email_video_previews: [{ id: 'preview', user_id: 'account-a', broadcast_id: 'campaign' }],
    email_broadcasts: [{ id: 'campaign', user_id: 'account-b' }],
    email_broadcast_recipients: [],
    email_video_opens: [],
    email_video_open_notifications: [],
    profiles: [{ id: 'account-a', email: 'owner@example.test' }],
    ambassadors: [],
    ambassador_leads: [],
    raffle_entries: [],
    lead_activities: [],
    message_history: [],
    email_templates: [],
    lead_magnets: [{ id: 'discount', slug: 'promo', user_id: 'account-a', card_id: 'card-a',
      is_active: true, magnet_type: 'discount', discount_config: { code: 'TEST' }, welcome_email_body: '{codigo}' }],
  }
  const supabaseAdmin = {
    rpc: async () => ({ error: null }),
    auth: { admin: { getUserById: async id => ({ data: { user: tables.profiles.find(row => row.id === id) } }) },
      getUser: async token => token === 'valid-a'
      ? { data: { user: { id: 'account-a' } } }
      : { data: { user: null }, error: new Error('invalid session') } },
    from(table) {
      const records = tables[table]
      let rows = records
      let update
      const query = {
        select: () => query,
        eq: (key, value) => { rows = rows.filter(row => row[key] === value); return query },
        lte: (key, value) => { rows = rows.filter(row => row[key] <= value); return query },
        gt: (key, value) => { rows = rows.filter(row => row[key] > value); return query },
        contains: (key, value) => {
          rows = rows.filter(row => Object.entries(value).every(([field, expected]) => row[key]?.[field] === expected))
          return query
        },
        ilike: (key, value) => {
          const substring = value.startsWith('%') && value.endsWith('%')
          rows = rows.filter(row => substring
            ? row[key].toLowerCase().includes(value.slice(1, -1))
            : row[key].toLowerCase() === value)
          return query
        },
        limit: limit => { rows = rows.slice(0, limit); return query },
        update: value => { update = value; return query },
        insert: value => {
          rows = (Array.isArray(value) ? value : [value]).map((item, index) => ({
            id: table + '-' + (records.length + index), ...item,
          }))
          records.push(...rows)
          return query
        },
        single: async () => query.maybeSingle(),
        maybeSingle: async () => {
          if (update) rows.forEach(row => Object.assign(row, update))
          return { data: rows[0] ? { ...rows[0] } : null }
        },
        then: resolve => {
          if (update) rows.forEach(row => Object.assign(row, update))
          resolve({ data: rows.map(row => ({ ...row })) })
        },
      }
      return query
    },
  }
  const gmail = {
    isMailbox: value => typeof value === 'string' && /^[^\s,@]+@[^\s,@]+\.test$/.test(value),
    validAttachments: Array.isArray,
    convertTextToHtml: body => body,
    openGmail: async userId => ({ senderEmail: 'gmail@example.test', sendRaw: async raw => {
      sent.push({ userId, raw })
      return 'gmail-ficticio'
    } }),
    buildRawEmail: payload => payload,
    sendGmail: async message => { sent.push(message); return 'gmail-ficticio' },
  }
  const mocks = {
    '@/lib/supabaseAdmin': { supabaseAdmin },
    '@/lib/supabaseServer': { supabaseServer: supabaseAdmin },
    '@supabase/supabase-js': { createClient: () => supabaseAdmin },
    '@/lib/server/gmailTransport': gmail,
    './gmailTransport': gmail,
    '@/lib/processEmailTemplate': load('lib/processEmailTemplate.ts', {}),
    '@/lib/email': { sendEmail: async message => {
      sent.push(message)
      if (message.to === 'falha@example.test') throw new Error('Resend simulado')
      return { data: { id: 'resend-ficticio' } }
    } },
  }
  mocks['@/lib/server/emailAuthorization'] = load('lib/server/emailAuthorization.ts', mocks)
  const route = file => load(file, mocks)
  return { sent, leads, tables, route, supabaseAdmin }
}

function request(payload, token) {
  return new Request('http://localhost/fixture', {
    method: 'POST',
    headers: token ? { authorization: 'Bearer ' + token } : {},
    body: JSON.stringify(payload),
  })
}
const emailRoute = 'app/api/send-email/route.ts'
const message = { leadId: 'lead-a', subject: 'Assunto', body: 'Mensagem' }

test('rejeita pedidos anónimos e sessões inválidas', async () => {
  const { sent, route } = fixture()
  const { POST } = route(emailRoute)
  assert.equal((await POST(request(message))).status, 401)
  assert.equal((await POST(request(message, 'inválido'))).status, 401)
  assert.equal(sent.length, 0)
})

test('deriva conta e destinatário, recusa leads e cartões de outra conta', async () => {
  const { sent, leads, route } = fixture()
  const { POST } = route(emailRoute)
  assert.equal((await POST(request({ ...message, leadId: 'lead-b' }, 'valid-a'))).status, 404)
  assert.equal((await POST(request({ ...message, cardId: 'card-b' }, 'valid-a'))).status, 404)
  // Attribution is not the sender card. An ambassador may refer a lead to another account.
  leads[0].source_card_id = 'card-b'
  assert.equal((await POST(request({
    ...message, userId: 'account-b', recipientEmail: 'outra@example.test',
  }, 'valid-a'))).status, 200)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].userId, 'account-a')
  assert.equal(sent[0].recipientEmail, 'lead-a@example.test')
})

test('recusa email de conteúdo livre sem consentimento ou após cancelamento', async () => {
  const { sent, leads, tables, route } = fixture()
  const { POST } = route(emailRoute)
  leads[0].marketing_opt_in = false
  assert.equal((await POST(request(message, 'valid-a'))).status, 403)
  leads[0].marketing_opt_in = true
  tables.email_unsubscribes.push({ user_id: 'account-a', email: ' LEAD-A@example.test ' })
  assert.equal((await POST(request(message, 'valid-a'))).status, 403)
  assert.equal(sent.length, 0)
})

test('recusa associação de vídeo, lead e campanha de contas diferentes', async () => {
  const { sent, route } = fixture()
  const { POST } = route('app/api/crm/video-open/route.ts')
  assert.equal((await POST(request({ previewId: 'preview', leadId: 'lead-b', broadcastId: 'campaign' }))).status, 404)
  assert.equal((await POST(request({ previewId: 'preview', leadId: 'lead-a', broadcastId: 'campaign' }))).status, 404)
  assert.equal(sent.length, 0)
})

test('desconto devolve erro quando o Resend simulado falha', async () => {
  const { sent, route } = fixture()
  const { POST } = route('app/api/lead-magnets/discount/route.ts')
  const payload = { slug: 'promo', name: 'Nome', phone: '', consent: true }
  assert.equal((await POST(request({ ...payload, email: 'falha@example.test' }))).status, 502)
  assert.equal((await POST(request({ ...payload, email: 'ok@example.test' }))).status, 200)
  assert.deepEqual(sent.map(message => message.to), ['falha@example.test', 'ok@example.test'])
})

test('transporte Gmail consulta apenas a integração da conta e conserva o histórico', async () => {
  const history = []
  const filters = {}
  let delivered
  let refreshed
  const integrations = {
    select: () => integrations,
    eq: (key, value) => { filters[key] = value; return integrations },
    update: value => { refreshed = value; return integrations },
    single: async () => ({ data: filters.user_id === 'account-a' && filters.integration_type === 'gmail'
      ? { id: 'integration-a', access_token: null, refresh_token: 'refresh-ficticio', sender_email: 'gmail@example.test' }
      : null }),
  }
  const transport = load('lib/server/gmailTransport.ts', {
    '@/lib/supabaseAdmin': { supabaseAdmin: { from: table => {
      if (table === 'user_integrations') return integrations
      if (table === 'message_history') return { insert: async row => { history.push(row); return {} } }
      throw new Error('Unexpected table ' + table)
    } } },
    googleapis: { google: {
      auth: { OAuth2: class {
        setCredentials(credentials) { this.credentials = credentials }
        async refreshAccessToken() {
          assert.equal(this.credentials.refresh_token, 'refresh-ficticio')
          return { credentials: { access_token: 'token-renovado' } }
        }
      } },
      gmail: () => ({ users: { messages: { send: async payload => {
        delivered = Buffer.from(payload.requestBody.raw, 'base64url').toString()
        return { data: { id: 'gmail-ficticio' } }
      } } } }),
    } },
  })
  const payload = { userId: 'account-a', leadId: 'lead-a', recipientEmail: 'lead-a@example.test',
    subject: 'Assunto', body: 'Mensagem' }
  await assert.rejects(transport.sendGmail({ ...payload, userId: 'account-b' }))
  await assert.rejects(transport.sendGmail({ ...payload, recipientEmail: 'lead-a@example.test\n' }))
  assert.equal(delivered, undefined)
  assert.equal(await transport.sendGmail(payload), 'gmail-ficticio')
  assert.match(delivered, /To: lead-a@example\.test\r\n/)
  assert.equal(refreshed.access_token, 'token-renovado')
  assert.equal(filters.id, 'integration-a')
  assert.equal(filters.user_id, 'account-a')
  assert.equal(history.length, 1)
  assert.equal(history[0].user_id, 'account-a')
  assert.equal(history[0].message_id, 'gmail-ficticio')
})

test('campanha valida remetente, titularidade, consentimento e cancelamento', async () => {
  const { sent, leads, tables, route } = fixture()
  const { POST } = route('app/api/crm/email/send-broadcast/route.ts')
  const payload = {
    userId: 'account-a', broadcastId: 'campaign', recipients: ['lead-a@example.test'],
    recipientLeadIds: ['lead-a'], subject: 'Assunto', htmlBody: '<p>{UNSUBSCRIBE_URL}</p>',
  }
  const before = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'chave-ficticia'
  try {
    assert.equal((await POST(request(payload, 'valid-a'))).status, 404)
    tables.email_broadcasts[0].user_id = 'account-a'
    tables.email_broadcasts[0].sender_card_id = 'card-b'
    assert.equal((await POST(request(payload, 'valid-a'))).status, 404)
    tables.email_broadcasts[0].sender_card_id = 'card-a'
    await POST(request({ ...payload, recipients: ['lead-b@example.test'], recipientLeadIds: ['lead-b'] }, 'valid-a'))
    leads[0].marketing_opt_in = false
    await POST(request(payload, 'valid-a'))
    leads[0].marketing_opt_in = true
    tables.email_unsubscribes.push({ user_id: 'account-a', email: ' LEAD-A@example.test ' })
    await POST(request(payload, 'valid-a'))
    assert.equal(sent.length, 0)
    tables.email_unsubscribes.pop()
    assert.equal((await POST(request(payload, 'valid-a'))).status, 200)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].raw.to, 'lead-a@example.test')
    assert.match(sent[0].raw.unsubscribeUrl, /broadcastId=campaign/)
  } finally {
    if (before.url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = before.url
    if (before.key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = before.key
  }
})

test('embaixador publicado notifica os destinatários do registo autorizado', async () => {
  const { sent, tables, route } = fixture()
  const { POST } = route('app/api/ambassadors/lead/route.ts')
  tables.ambassadors.push({
    id: 'ambassador', user_id: 'account-a', slug: 'embaixador', name: 'Embaixador',
    is_published: true, card_id: 'card-a', email: 'ambassador@example.test',
  })
  assert.equal((await POST(request({ slug: 'embaixador', name: 'Lead', email: 'visitor@example.test',
    consentGiven: true, recipientEmail: 'manipulado@example.test' }))).status, 200)
  assert.deepEqual(sent.map(message => message.recipientEmail), ['owner@example.test', 'ambassador@example.test'])
  assert.ok(sent.every(message => message.userId === 'account-a'))
})

test('vídeo de campanha autorizado regista abertura e aplica cooldown sequencial', async () => {
  const { sent, tables, route } = fixture()
  const { POST } = route('app/api/crm/video-open/route.ts')
  Object.assign(tables.email_broadcasts[0], { user_id: 'account-a', notify_on_video_opens: true })
  tables.email_broadcast_recipients.push({ lead_id: 'lead-a', broadcast_id: 'campaign', status: 'sent' })
  const payload = { previewId: 'preview', leadId: 'lead-a', broadcastId: 'campaign' }
  assert.equal((await POST(request(payload))).status, 200)
  assert.equal((await POST(request(payload))).status, 200)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].recipientEmail, 'owner@example.test')
  assert.equal(tables.email_video_opens.length, 2)
})


test('cron Gmail exige segredo e autorização operacional antes de ler a fila', async () => {
  const { sent, tables, route } = fixture()
  const { POST } = route('app/api/cron/send-bulk-emails/route.ts')
  const oldSecret = process.env.CRON_SECRET
  const oldEnabled = process.env.ENABLE_LEGACY_GMAIL_CRON
  try {
    delete process.env.CRON_SECRET
    delete process.env.ENABLE_LEGACY_GMAIL_CRON
    assert.equal((await POST(request({}, 'dev-secret'))).status, 401)
    process.env.CRON_SECRET = 'cron-ficticio'
    assert.equal((await POST(request({}, 'errado'))).status, 401)
    assert.equal((await POST(request({}, 'cron-ficticio'))).status, 503)
    assert.equal(sent.length, 0)
    tables.scheduled_tasks.push({ id: 'task', user_id: 'account-a', lead_id: 'lead-a',
      email_recipient: 'arbitrario@example.test', email_source_type: 'broadcast',
      email_subject: 'Assunto', email_body: 'Corpo', send_status: 'pending', due_at: '2000-01-01',
      attachments: [{ filename: 'ficticio.txt', mimeType: 'text/plain', base64: 'dGVzdA==' }] })
    process.env.ENABLE_LEGACY_GMAIL_CRON = 'true'
    const response = await POST(request({}, 'cron-ficticio'))
    assert.equal(response.status, 200)
    assert.equal((await response.json()).processed, 1)
    assert.equal(sent[0].recipientEmail, 'lead-a@example.test')
    assert.equal(sent[0].fromName, 'Kardme')
    assert.equal(sent[0].attachments[0].filename, 'ficticio.txt')
  } finally {
    if (oldSecret === undefined) delete process.env.CRON_SECRET
    else process.env.CRON_SECRET = oldSecret
    if (oldEnabled === undefined) delete process.env.ENABLE_LEGACY_GMAIL_CRON
    else process.env.ENABLE_LEGACY_GMAIL_CRON = oldEnabled
  }
})

test('embaixador Kardme mantém o cartão de origem atribuído e envia pela conta central', async () => {
  const { tables, sent, route } = fixture()
  const { POST } = route('app/api/ambassadors/lead/route.ts')
  const central = 'aafb4f55-843b-4dd2-b199-70dd9df592a8'
  tables.profiles.push({ id: central, email: 'central@example.test' })
  tables.ambassadors.push({
    id: 'amb', user_id: 'account-b', slug: 'central', name: 'Embaixador',
    ambassador_type: 'kardme', is_published: true, card_id: 'card-b', email: 'amb@example.test',
  })
  const response = await POST(request({ slug: 'central', name: 'Lead', email: 'lead@example.test', consentGiven: true }))
  assert.equal(response.status, 200)
  assert.equal(tables.leads.at(-1).user_id, central)
  assert.equal(tables.leads.at(-1).source_card_id, 'card-b')
  assert.deepEqual(sent.map(row => row.recipientEmail), ['central@example.test', 'amb@example.test'])
  assert.ok(sent.every(row => row.userId === central))
})

test('envio em massa conserva remetente, personalização, anexos e histórico', async () => {
  const { sent, leads, tables, route } = fixture()
  tables.cards[0].name = 'Cartão autorizado'
  leads[0].name = 'Pessoa Exemplo'
  Object.assign(tables.email_broadcasts[0], { user_id: 'account-a', sender_card_id: 'card-a' })
  tables.email_templates.push({ id: 'template-a', user_id: 'account-a' })
  const payload = {
    userId: 'account-a', broadcastId: 'campaign', recipientLeadIds: ['lead-a'],
    recipients: ['lead-a@example.test'], recipientNames: ['Nome manipulado'],
    subject: 'Olá {nome}', htmlBody: 'Mensagem para {nome}',
    attachments: [{ filename: 'fixture.txt', mimeType: 'text/plain', base64: 'dGVzdA==' }],
    legacy: { templateId: 'template-a' },
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'ficticio'
    const { POST } = route('app/api/crm/email/send-broadcast/route.ts')
    const response = await POST(request(payload, 'valid-a'))
    assert.equal(response.status, 200)
    assert.equal(sent[0].raw.fromName, 'Cartão autorizado')
    assert.equal(sent[0].raw.subject, 'Olá Pessoa Exemplo')
    assert.match(sent[0].raw.htmlBody, /Mensagem para Pessoa Exemplo/)
    assert.match(sent[0].raw.htmlBody, /Cancelar subscrição/)
    assert.deepEqual(sent[0].raw.attachments, payload.attachments)
    assert.equal(tables.message_history[0].template_id, 'template-a')
    assert.equal(tables.message_history[0].message_id, 'gmail-ficticio')
  } finally {
    if (url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
    else process.env.NEXT_PUBLIC_SUPABASE_URL = url
    if (key === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = key
  }
})

test('cron Resend rejeita segredo ausente, vazio, antigo ou incorreto antes de consultar a fila', async () => {
  const { sent, route, supabaseAdmin } = fixture()
  let reads = 0
  const from = supabaseAdmin.from
  supabaseAdmin.from = table => { reads++; return from(table) }
  const { POST } = route('app/api/cron/execute-scheduled-tasks/route.ts')
  const saved = [process.env.CRON_SECRET, process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY]
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'ficticio'
    delete process.env.CRON_SECRET
    assert.equal((await POST(request({}, 'dev-secret'))).status, 401)
    process.env.CRON_SECRET = '  '
    assert.equal((await POST(request({}, 'segredo-ficticio'))).status, 401)
    process.env.CRON_SECRET = 'dev-secret'
    assert.equal((await POST(request({}, 'dev-secret'))).status, 401)
    process.env.CRON_SECRET = 'segredo-ficticio'
    assert.equal((await POST(request({}))).status, 401)
    assert.equal((await POST(request({}, 'errado'))).status, 401)
    assert.equal(reads, 0)
    assert.equal((await POST(request({}, 'segredo-ficticio'))).status, 200)
    assert.equal(reads, 1)
    assert.equal(sent.length, 0)
  } finally {
    for (const [i, key] of ['CRON_SECRET', 'NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].entries()) {
      if (saved[i] === undefined) delete process.env[key]
      else process.env[key] = saved[i]
    }
  }
})

test('roleta preserva o registo de participação autorizado sem expedir emails de prémio', async () => {
  const { sent, leads, tables, route } = fixture()
  const { POST } = route('app/api/lead-magnets/wheel-winner/route.ts')
  tables.lead_magnets.push({ id: 'wheel', user_id: 'account-a', slug: 'roleta',
    is_active: true, magnet_type: 'wheel', title: 'Roleta fictícia' })
  leads[0].lead_magnet_id = 'wheel'
  const payload = { slug: 'roleta', lead_id: 'lead-a', prize_label: 'Prémio fictício', final: true }
  assert.equal((await POST(request({ ...payload, lead_id: 'lead-b' }))).status, 404)
  const allowed = await POST(request(payload))
  assert.equal(allowed.status, 200)
  assert.deepEqual(await allowed.json(), { ok: true, emailSent: false })
  assert.equal(tables.lead_activities.length, 1)
  assert.equal(sent.length, 0)
})
