'use client'

import '@/styles/dashboard.css'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type TemplateBlock = {
  type: string | null
  order?: number | null
  title?: string | null
  enabled?: boolean
  settings?: any
  style?: any
}

type Template = {
  id: string
  name: string
  description: string | null
  category: string
  price: number | null
  image_url: string | null
  preview_json: TemplateBlock[] | null
  is_active: boolean | null
}

export default function NewCardPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [userTemplateIds, setUserTemplateIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const { data: authData, error: authErr } = await supabase.auth.getUser()
    if (authErr || !authData?.user?.id) {
      setError('Sem sessão. Faz login novamente.')
      setLoading(false)
      return
    }
    const userId = authData.user.id

    const { data: tData, error: tErr } = await supabase
      .from('templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (tErr) {
      setError(tErr.message)
      setLoading(false)
      return
    }

    const { data: utData, error: utErr } = await supabase
      .from('user_templates')
      .select('template_id')
      .eq('user_id', userId)

    if (utErr) {
      // não bloqueia a página, mas informa
      console.error('Erro a carregar user_templates:', utErr)
    }

   setTemplates((tData || []) as Template[])
setUserTemplateIds((utData || []).map((ut) => ut.template_id))
setLoading(false)