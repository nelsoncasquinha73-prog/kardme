'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import EmailMarketingView from '@/app/dashboard/crm/EmailMarketingView'

export default function EmailMarketingPage() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.id) setUserId(data.session.user.id)
    })
  }, [])

  if (!userId) return (
    <div style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
      A carregar...
    </div>
  )

  return <EmailMarketingView userId={userId} />
}
