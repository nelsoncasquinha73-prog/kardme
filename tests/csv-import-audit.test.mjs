import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CSV_DECLARATION_VERSION,
  CSV_DECLARATION_TEXT,
  saveCSVImportDeclaration,
} from '../lib/crm/csvImportDeclaration.ts'

test('Auditoria bem-sucedida devolve o ID e guarda a declaração correta', async () => {
  let savedRecord

  const write = async (record) => {
    savedRecord = record
    return {
      data: { id: 'audit-test-123' },
      error: null,
    }
  }

  const result = await saveCSVImportDeclaration(
    write,
    'user-test-123',
    'card-test-456'
  )

  assert.equal(result, 'audit-test-123')
  assert.equal(savedRecord.user_id, 'user-test-123')
  assert.equal(savedRecord.card_id, 'card-test-456')
  assert.equal(savedRecord.declaration_version, CSV_DECLARATION_VERSION)
  assert.equal(savedRecord.declaration_text, CSV_DECLARATION_TEXT)
})

test('Erro de escrita impede obter um ID de auditoria', async () => {
  const write = async () => ({
    data: null,
    error: { message: 'Erro simulado do Supabase' },
  })

  const result = await saveCSVImportDeclaration(write, 'user-test', 'card-test')

  assert.equal(result, null)
})

test('Ausência de registo impede obter um ID de auditoria', async () => {
  const write = async () => ({
    data: null,
    error: null,
  })

  const result = await saveCSVImportDeclaration(write, 'user-test', 'card-test')

  assert.equal(result, null)
})

test('Exceção na ligação à base de dados é tratada', async () => {
  const write = async () => {
    throw new Error('Ligação indisponível')
  }

  const result = await saveCSVImportDeclaration(write, 'user-test', 'card-test')

  assert.equal(result, null)
})
