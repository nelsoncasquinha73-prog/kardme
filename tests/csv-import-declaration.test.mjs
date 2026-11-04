import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CSV_DECLARATION_VERSION,
  CSV_DECLARATION_TEXT,
  isValidCSVImportDeclaration,
} from '../lib/crm/csvImportDeclaration.ts'

test('Aceitação válida permite avançar', () => {
  assert.equal(
    isValidCSVImportDeclaration(true, CSV_DECLARATION_VERSION),
    true
  )
})

test('Checkbox desmarcada é rejeitada', () => {
  assert.equal(
    isValidCSVImportDeclaration(false, CSV_DECLARATION_VERSION),
    false
  )
})

test('Versão incorreta é rejeitada', () => {
  assert.equal(
    isValidCSVImportDeclaration(true, 'versao-antiga'),
    false
  )
})

test('Aceitação enviada como texto é rejeitada', () => {
  assert.equal(
    isValidCSVImportDeclaration('true', CSV_DECLARATION_VERSION),
    false
  )
})

test('Ausência de versão é rejeitada', () => {
  assert.equal(
    isValidCSVImportDeclaration(true, undefined),
    false
  )
})

test('Texto da declaração está disponível para auditoria', () => {
  assert.ok(CSV_DECLARATION_TEXT.length > 100)
  assert.match(CSV_DECLARATION_TEXT, /responsabilidade/i)
})
