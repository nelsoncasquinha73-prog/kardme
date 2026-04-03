import { useState } from 'react'

type Lead = {
  id: string
  name: string
  email: string
  phone: string
  message: string
  lead_type_id?: string | null
}

export function useChatGPT() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMessage = async (type: 'email' | 'whatsapp', lead: Lead, context?: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/crm/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, lead, context }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar mensagem')
      }

      return data.message
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generateMessage, loading, error }
}
