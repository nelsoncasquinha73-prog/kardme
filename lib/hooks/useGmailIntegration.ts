import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export function useGmailIntegration(userId: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkConnection = async () => {
    if (!userId) return
    setLoading(true)
    const { data } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('integration_type', 'gmail')
      .single()
    setIsConnected(!!data)
    setLoading(false)
  }

  const connectGmail = async () => {
    const response = await fetch('/api/gmail/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const json = await response.json()
    if (!response.ok) throw new Error(json?.error || 'Failed')
    window.location.href = json.authUrl
  }

  const sendEmail = async (leadId: string, recipientEmail: string, subject: string, body: string, templateId?: string) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, leadId, recipientEmail, subject, body, templateId }),
      })
      const json = await response.json()
      console.log('Send email response:', { status: response.status, json })
      if (!response.ok) throw new Error(json?.details || json?.error || 'Failed')
      return json
    } catch (err: any) {
      console.error('Send email error:', err)
      throw err
    }
  }

  return { isConnected, loading, checkConnection, connectGmail, sendEmail }
}
