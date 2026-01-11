'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { HeaderBlock } from '@/components/blocks/HeaderBlock'

type ContactFormProps = {
  cardId: string
  block: {
    id: string
    settings: any
  }
}

export default function ContactForm({ cardId, block }: ContactFormProps) {
  const settings = block.settings || {}

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitLead = async () => {
    setError(null)

    if (settings.required?.email && !email) {
      setError('Email obrigatório')
      return
    }

    if (settings.required?.phone && !phone) {
      setError('Telemóvel obrigatório')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('leads').insert({
      card_id: cardId,
      name,
      email,
      phone,
      message,
    })

    setLoading(false)

    if (error) {
      setError('Erro ao enviar contacto')
      return
    }

    setSuccess(true)
    setName('')
    setEmail('')
    setPhone('')
    setMessage('')
  }

  if (success) {
    return (
      <div style={{ padding: 20 }}>
        <p>{settings.success_message || 'Mensagem enviada com sucesso!'}</p>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        borderRadius: settings.background?.border_radius || 12,
        background: settings.background?.color || '#ffffff',
      }}
    >
      {settings.title && <h2>{settings.title}</h2>}
      {settings.description && <p>{settings.description}</p>}

      {settings.fields?.name && (
        <input
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      )}

      {settings.fields?.email && (
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      )}

      {settings.fields?.phone && (
        <input
          placeholder="Telemóvel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
        />
      )}

      {settings.fields?.message && (
        <textarea
          placeholder="Mensagem"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={submitLead} disabled={loading}>
        {loading
          ? 'A enviar...'
          : settings.button?.text || 'Enviar'}
      </button>
    </div>
  )
}
