import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import ts from 'typescript'


function loadTemplate(file, dependencies = {}) {
  const source = readFileSync(new URL(file, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  })
  const exports = {}
  new Function('exports', 'require', outputText)(exports, name => {
    assert.ok(Object.hasOwn(dependencies, name))
    return dependencies[name]
  })
  return exports
}

const i18n = loadTemplate('../lib/i18n/leadWelcomeEmail.ts')
const { composeLeadWelcomeEmail } = loadTemplate('../lib/leadWelcomeEmail.ts', {
  './i18n/leadWelcomeEmail': i18n,
})
const variables = { nome: 'Inês', email: 'ines@example.invalid', cardTitle: 'Demo' }
const confirmUrl = 'https://example.invalid/confirmation?token=synthetic&source=test'
const body = '<img src="https://example.invalid/card.png"><table><tr><td>Olá {nome}</td></tr></table>'

for (const language of Object.keys(i18n.welcomeTranslations)) {
  test(`confirmation block precedes the personalized message in ${language}`, () => {
    const { html } = composeLeadWelcomeEmail({ language, variables, body, confirmUrl })
    const { document, Node } = new JSDOM(html).window
    const text = i18n.welcomeTranslations[language]
    const [button, fallback] = [...document.querySelectorAll('a')]
    assert.equal(document.documentElement.dir, language === 'ar' ? 'rtl' : 'ltr')
    assert.equal(button.textContent.trim(), text.button)
    assert.equal(fallback.getAttribute('href'), confirmUrl)
    assert.equal(button.getAttribute('href'), confirmUrl)
    const confirmation = fallback.closest('tr')
    const message = confirmation.nextElementSibling
    assert.ok(confirmation.textContent.includes(text.notice))
    assert.ok(button.compareDocumentPosition(fallback) & Node.DOCUMENT_POSITION_FOLLOWING)
    assert.ok(message.textContent.includes(body.replace('{nome}', variables.nome)))
  })
}

test('welcome messages without a usable confirmation URL omit the block', () => {
  for (const url of [undefined, 'http://example.invalid/confirmation']) {
    const { html } = composeLeadWelcomeEmail({ variables, body, confirmUrl: url })
    const { document } = new JSDOM(html).window
    assert.equal(document.querySelectorAll('a').length, 0)
    assert.ok(document.body.textContent.includes('Olá Inês'))
  }
})
