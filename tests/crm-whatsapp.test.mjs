import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../lib/crm/whatsapp.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
})
const whatsapp = {}
new Function('exports', 'require', outputText)(whatsapp, require)
const { normalizeWhatsAppPhone, buildWhatsAppUrl } = whatsapp

const validPhones = [
  ['Portugal, internacional', '+351 912 345 678', '+351912345678'],
  ['Portugal, móvel nacional antigo', '912 345 678', '+351912345678'],
  ['Portugal, fixo nacional antigo', '21 234 56 78', '+351212345678'],
  ['Portugal, indicativo guardado sem +', '351912345678', '+351912345678'],
  ['França, regressão do +351', '+33612345678', '+33612345678'],
  ['França, prefixo 00', '0033 6 12 34 56 78', '+33612345678'],
  ['Alemanha, parênteses e hífen', '+49 (151) 2345-6789', '+4915123456789'],
  ['Espanha, prefixo 00 e espaço não separável', '00 34 612\u00a0345 678', '+34612345678'],
  ['Brasil, indicativo guardado sem +', '55 (11) 91234-5678', '+5511912345678'],
  ['EUA, 351 faz parte do número', '+1 (202) 555-0351', '+12025550351'],
  ['Itália, zero significativo', '+39 02 1234 5678', '+390212345678'],
]

for (const [label, input, expected] of validPhones) {
  test(label, () => {
    assert.equal(normalizeWhatsAppPhone(input), expected)
    assert.equal(normalizeWhatsAppPhone(expected), expected)
    assert.equal(buildWhatsAppUrl(input), `https://wa.me/${expected.slice(1)}`)
  })
}

test('codifica a mensagem sem alterar o destino', () => {
  const url = new URL(buildWhatsAppUrl('+33 6 12 34 56 78', 'Olá! & até já?'))
  assert.equal(url.pathname, '/33612345678')
  assert.equal(url.searchParams.get('text'), 'Olá! & até já?')
})

test('recusa números inválidos ou sem indicativo inequívoco', () => {
  for (const input of [
    undefined, null, '', '+33', '00', '+999123456789', '+35133612345678',
    '0612345678', '33612345678', '612345678', '12345678901', '999999999',
    '+33 06 12 34 56 78', '+33 6 12 34 56 78 ext 1', '++33612345678',
    '+1202555014235123',
  ]) {
    assert.equal(normalizeWhatsAppPhone(input), null, String(input))
    assert.equal(buildWhatsAppUrl(input, 'Olá'), null, String(input))
  }
})
