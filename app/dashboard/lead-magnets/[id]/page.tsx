'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import LeadMagnetEditor from './LeadMagnetEditor'

interface LeadMagnet {
  id: string
  slug: string
  user_id: string
  title: string
  magnet_type: string
  card_id: string | null
  is_active: boolean
  welcome_email_subject: string
  welcome_email_body: string
  file_url: string | null
  thank_you_message: string
  capture_page_title: string
  capture_page_subtitle: string
  capture_page_image: string | null
  capture_page_button_text: string
  capture_page_success_message: string
  leads_count: number
  created_at: string
  updated_at: string
}

export default function LeadMagnetPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { addToast } = useToast()
  const [magnet, setMagnet] = useState<LeadMagnet | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserId(user.id)

        const { id } = await params
        const { data, error } = await supabase
          .from('lead_magnets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          addToast('Lead magnet não encontrado', 'error')
          router.push('/dashboard/lead-magnets')
          return
        }

        setMagnet(data)
      } catch (e) {
        console.error(e)
        addToast('Erro ao carregar lead magnet', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params, router, addToast])

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>A carregar...</div>
  }

  if (!magnet || !userId) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>Lead magnet não encontrado</div>
  }

  return <LeadMagnetEditor magnet={magnet} userId={userId} onBack={() => router.push('/dashboard/lead-magnets')} />
}
