export const CSV_DECLARATION_VERSION = 'csv-import-v1'

export const CSV_DECLARATION_TITLE =
  'Declaração de responsabilidade — Importação de contactos'

export const CSV_DECLARATION_INTRO =
  'Ao importar contactos para o Kardme, declaro que:'

export const CSV_DECLARATION_CLAUSES = [
  'Obtive os dados pessoais de forma lícita e tenho fundamento legal para os tratar.',
  'Sou responsável por garantir que os contactos assinalados como autorizados para marketing possuem uma autorização válida, quando legalmente exigida, e que consigo apresentar a respetiva prova.',
  'Comprometo-me a respeitar os direitos dos titulares dos dados, incluindo pedidos de oposição, retirada de consentimento e eliminação, quando aplicáveis.',
  'Reconheço que o Kardme disponibiliza a ferramenta tecnológica e não verifica individualmente a origem ou a validade das autorizações declaradas, sem prejuízo das responsabilidades legais que lhe sejam aplicáveis.',
] as const

export const CSV_DECLARATION_ACCEPTANCE =
  'Li e aceito a declaração de responsabilidade pela importação dos contactos.'

export const CSV_DECLARATION_TEXT = [
  CSV_DECLARATION_TITLE,
  CSV_DECLARATION_INTRO,
  ...CSV_DECLARATION_CLAUSES.map((clause, index) => `${index + 1}. ${clause}`),
  CSV_DECLARATION_ACCEPTANCE,
].join('\n')

export function isValidCSVImportDeclaration(
  accepted: unknown,
  version: unknown
): boolean {
  return accepted === true && version === CSV_DECLARATION_VERSION
}

export async function saveCSVImportDeclaration(
  write: (record: {
    user_id: string
    card_id: string
    declaration_version: string
    declaration_text: string
  }) => PromiseLike<{
    data: { id: string } | null
    error: unknown
  }>,
  userId: string,
  cardId: string
): Promise<string | null> {
  try {
    const { data, error } = await write({
      user_id: userId,
      card_id: cardId,
      declaration_version: CSV_DECLARATION_VERSION,
      declaration_text: CSV_DECLARATION_TEXT,
    })

    return error ? null : data?.id ?? null
  } catch {
    return null
  }
}
