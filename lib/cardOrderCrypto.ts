import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'node:crypto'

function getKey(): Buffer {
  const hex = process.env.CARD_ORDER_ENCRYPTION_KEY || ''

  if (!/^[a-f0-9]{64}$/i.test(hex)) {
    throw new Error('CARD_ORDER_ENCRYPTION_KEY inválida')
  }

  return Buffer.from(hex, 'hex')
}

export function encryptCardOrderToken(token: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv)

  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  return [
    'v1',
    iv.toString('hex'),
    tag.toString('hex'),
    encrypted.toString('hex'),
  ].join(':')
}

export function decryptCardOrderToken(value: string): string {
  const parts = value.split(':')

  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Formato de token cifrado inválido')
  }

  const [, ivHex, tagHex, encryptedHex] = parts

  if (
    !/^[a-f0-9]{24}$/i.test(ivHex) ||
    !/^[a-f0-9]{32}$/i.test(tagHex) ||
    !/^(?:[a-f0-9]{2})+$/i.test(encryptedHex)
  ) {
    throw new Error('Token cifrado inválido')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getKey(),
    Buffer.from(ivHex, 'hex')
  )

  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]).toString('utf8')
}
