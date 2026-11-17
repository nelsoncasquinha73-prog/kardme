const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const { JSDOM } = require('jsdom')
function load(file, deps) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText, { exports, require: name => {
    if (!(name in deps)) throw Error(name)
    return deps[name]
  } })
  return exports
}
const policy = load('lib/sanitizeWelcomeHtml.ts', { 'isomorphic-dompurify': require('isomorphic-dompurify') })
const translations = load('lib/i18n/leadWelcomeEmail.ts', {})
const { composeLeadWelcomeEmail } = load('lib/leadWelcomeEmail.ts', { './sanitizeWelcomeHtml': policy, './i18n/leadWelcomeEmail': translations })
const variables = { nome: 'Example', email: 'visitor@example.invalid', cardTitle: 'Demo' }
function render(body, extra = {}) {
  const result = composeLeadWelcomeEmail({ language: 'fr', body, variables, confirmUrl: 'https://example.invalid/confirmation', ...extra })
  const dom = new JSDOM(result.html)
  return { ...result, document: dom.window.document, window: dom.window }
}
function checkButton(result) {
  const button = [...result.document.querySelectorAll('a')].find(a => a.textContent === 'Confirmer mon adresse email')
  assert.ok(button)
  assert.equal(result.window.getComputedStyle(button).display, 'inline-block')
  assert.equal(button.getAttribute('href'), 'https://example.invalid/confirmation')
}
for (const [name, body] of [
  ['global CSS', '<style>a {display:none!important} td {font-size:99px}</style><p>Example</p>'],
  ['unclosed comment', '<p>Example</p><!--'],
  ['unclosed tag', '<b><div><h1>Example'],
  ['closing table breakout', '</td></tr></table><p>Example'],
  ['nested malformed table', '<table><tr><td>Example<div><b>Text'],
  ['scripts and events', '<script>alert(1)</script><img src="https://example.invalid/image.png" onerror="alert(1)"><p onclick="alert(2)">Example</p>'],
  ['position and hidden content', '<div style="position:fixed;inset:0;z-index:99999;transform:scale(100);margin:-999px;display:none">Example</div>'],
]) test(`confirmation remains intact: ${name}`, () => {
  const result = render(body)
  checkButton(result)
  assert.equal(result.document.querySelectorAll('script,style,iframe,form,svg,math').length, 0)
  assert.equal(result.document.querySelectorAll('[onclick],[onerror]').length, 0)
  assert.equal(/position:|z-index:|transform:|display:none/.test(result.html), false)
})
test('preserves semantic formatting, safe colors, links and lists', () => {
  const result = render('<p style="color:#123456;text-align:center"><strong>Bold</strong><em>Italic</em><u>Underline</u></p><ul><li>One</li></ul><ol start="3"><li>Three</li></ol><a href="https://example.invalid/page">Link</a>')
  for (const selector of ['strong','em','u','ul li','ol li']) assert.ok(result.document.querySelector(selector))
  assert.equal(result.document.querySelector('p').style.color, 'rgb(18, 52, 86)')
  assert.equal(result.document.querySelector('p').style.textAlign, 'center')
  assert.equal(result.document.querySelector('ol').getAttribute('start'), '3')
})
test('unsafe URLs removed but labels remain', () => {
  const result = render('<a href="javascript:alert(1)">Unsafe</a><a href="data:text/html,hello">Data</a><a href="tel:+000">Phone</a><a href="mailto:example@example.invalid">Email</a>')
  const links = [...result.document.querySelectorAll('a')]
  assert.equal(links[0].hasAttribute('href'), false)
  assert.equal(links[1].hasAttribute('href'), false)
  assert.equal(links[2].getAttribute('href'), 'tel:+000')
  assert.equal(links[3].getAttribute('href'), 'mailto:example@example.invalid')
})
test('images retained and constrained; unsafe images produce alt text and diagnostics', () => {
  const result = render('<img src="https://example.invalid/logo.png" width="9000" alt="Logo"><img src="cid:logo" alt="Embedded"><img src="data:image/png;base64,aGVsbG8=" alt="Inline"><img src="javascript:alert(1)" alt="Rejected">')
  const images = [...result.document.querySelectorAll('img')]
  assert.equal(images.length, 3)
  assert.equal(images[0].style.width, '600px')
  for (const image of images) assert.equal(image.style.maxWidth, '100%')
  assert.ok(result.document.body.textContent.includes('Rejected'))
  assert.ok(result.warnings.some(w => w.includes('Image source rejected')))
})
test('data tables and cells retained without overflow or dangerous attributes', () => {
  const result = render('<table width="5000"><caption>Data</caption><tr><th colspan="2">Heading</th></tr><tr><td>A</td><td>B</td></tr></table>')
  const table = result.document.querySelector('caption').parentElement
  assert.equal(table.style.width, '100%')
  assert.equal(table.getAttribute('width'), '100%')
  assert.equal(table.style.maxWidth, '100%')
  assert.equal(table.querySelector('th').getAttribute('colspan'), '2')
  assert.equal(table.querySelectorAll('td').length, 2)
})
test('excessive sizes bounded while heading hierarchy and emphasis survive', () => {
  const result = render('<h1 style="font-size:200px">Title</h1><h2>Subtitle</h2><p style="font-size:99px;font-weight:bold">Body</p><span style="font-size:1px">Small</span>')
  assert.equal(result.document.querySelector('h1').style.fontSize, '24px')
  assert.equal(result.document.querySelector('h2').style.fontSize, '22px')
  assert.equal(result.document.querySelector('p').style.fontSize, '16px')
  assert.equal(result.document.querySelector('p').style.fontWeight, 'bold')
  assert.equal(result.document.querySelector('span').style.fontSize, '15px')
})
test('personalization is escaped text and is not recursively expanded', () => {
  const result = render('<p>{nome} {email} {cardTitle}</p>', { variables: { nome: '<img src=x onerror=alert(1)>', email: 'a&b@example.invalid', cardTitle: '{nome}' } })
  assert.equal(result.document.querySelectorAll('img').length, 0)
  assert.equal(result.document.querySelector('p').textContent, '<img src=x onerror=alert(1)> a&b@example.invalid {nome}')
})
for (const language of translations.welcomeLanguages) test(`fluid email shell and direction: ${language}`, () => {
  const result = render('Example\n\nMessage', { language })
  assert.equal(result.document.documentElement.lang, language)
  assert.equal(result.document.documentElement.dir, language === 'ar' ? 'rtl' : 'ltr')
  assert.ok(result.document.querySelector('meta[name="viewport"]'))
  assert.ok([...result.document.querySelectorAll('table')].some(t => t.style.maxWidth === '600px' && t.style.width === '100%'))
  assert.ok(result.document.body.textContent.includes(translations.welcomeTranslations[language].button))
  assert.equal(result.document.body.textContent.includes('Kardme'), false)
})
test('no global sanitizer hooks leak between messages', () => {
  render('<style>*{display:none}</style>Unsafe')
  const result = render('<p style="color:blue">Safe</p>')
  assert.equal(result.document.querySelector('p').style.color, 'blue')
  checkButton(result)
})
