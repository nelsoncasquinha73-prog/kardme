'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LeadMagnetsView from '@/app/dashboard/crm/LeadMagnetsView'

export default function LeadMagnetsPage() {
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

  return <LeadMagnetsView userId={userId} />
}
