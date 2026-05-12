'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import LeadMagnetEditor from '../[id]/LeadMagnetEditor'

const DEFAULT_FORM_FIELDS = [
  { name: 'name', label: 'Nome', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Telemóvel', type: 'tel', required: false }
]

const DEFAULT_SLICES = Array.from({ length: 8 }, (_, i) => ({
  id: `slice-${i}`,
  label: `Prémio ${i + 1}`,
  color: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'][i % 4]
}))

export default function NewLeadMagnetPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [magnet, setMagnet] = useState<any | null>(null)
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

        // Cria um magnet em memória (não na BD)
        const newMagnet = {
          id: 'NEW',
          slug: '',
          user_id: user.id,
          title: 'Nova Campanha',
          magnet_type: 'ebook',
          description: '',
          cover_image_url: '',
          file_url: '',
          thank_you_message: 'Obrigado! O teu download vai começar automaticamente.',
          welcome_email_subject: '',
          welcome_email_body: '',
          form_fields: DEFAULT_FORM_FIELDS,
          is_active: true,
          views_count: 0,
          leads_count: 0,
          raffle_config: { grid_size: 49, prize_description: '', winning_numbers: [] },
          wheel_config: { slices: DEFAULT_SLICES, capture_before_spin: true, max_spins_per_email: 1 },
          card_id: null,
          custom_type_label: null,
          capture_page_title: '',
          capture_page_subtitle: '',
          capture_page_image: null,
          capture_page_button_text: '',
          capture_page_success_message: '',
          show_download_button: false,
          download_button_text: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        setMagnet(newMagnet)
      } catch (e) {
        console.error(e)
        addToast('Erro ao preparar nova campanha', 'error')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, addToast])

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>A preparar...</div>
  }

  if (!magnet || !userId) {
    return <div style={{ padding: 24, textAlign: 'center', opacity: 0.6 }}>Erro ao preparar nova campanha</div>
  }

  return <LeadMagnetEditor magnet={magnet} userId={userId} onBack={() => router.push('/dashboard/lead-magnets')} />
}
