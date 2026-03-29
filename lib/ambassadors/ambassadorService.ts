import { supabase } from '@/lib/supabaseClient'

export interface Ambassador {
  id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  photo_url?: string
  bio?: string
  slug: string
  commission_type: 'fixed' | 'percentage'
  commission_value: number
  contract_signed: boolean
  contract_signed_at?: string
  card_type: 'digital' | 'pvc' | 'metallic'
  card_ordered: boolean
  is_active: boolean
  stats_leads: number
  stats_deals_closed: number
  stats_commission_paid: number
  avatar_url?: string
  cover_url?: string
  background_color: string
  text_color: string
  bio_color: string
  font_family: string
  show_interest_type: boolean
  show_location: boolean
  show_budget: boolean
  custom_fields: Array<{
    id: string
    label: string
    type: 'text' | 'textarea' | 'select'
    options?: string[]
    required: boolean
    enabled: boolean
  }>
  subscription_status?: 'inactive' | 'pending' | 'active' | 'canceled' | 'past_due'
  subscription_plan?: string
  subscription_price?: number
  subscription_currency?: string
  subscription_id?: string
  checkout_session_id?: string
  activated_at?: string
  deactivated_at?: string
  access_token?: string
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface AmbassadorLead {
  id: string
  ambassador_id: string
  user_id: string
  name: string
  email?: string
  phone?: string
  interest_type?: string
  location?: string
  budget?: string
  notes?: string
  marketing_opt_in: boolean
  status: 'new' | 'contacted' | 'in_progress' | 'deal_closed' | 'lost'
  created_at: string
  updated_at: string
}

// Gerar slug único
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .substring(0, 50) + '-' + Math.random().toString(36).substring(7)
}

// Criar embaixador
export async function createAmbassador(data: {
  user_id: string
  name: string
  email?: string
  phone?: string
  photo_url?: string
  bio?: string
  commission_type: 'fixed' | 'percentage'
  commission_value: number
  card_type: 'digital' | 'pvc' | 'metallic'
}) {
  const slug = generateSlug(data.name)

  const { data: ambassador, error } = await supabase
    .from('ambassadors')
    .insert([
      {
        ...data,
        slug,
        is_active: false,
        contract_signed: false,
      },
    ])
    .select()
    .single()

  if (error) throw error
  return ambassador as Ambassador
}

// Listar embaixadores do consultor
export async function getAmbassadors() {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Ambassador[]
}

// Obter embaixador por ID
export async function getAmbassador(id: string) {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Ambassador
}

// Obter embaixador por slug (público)
export async function getAmbassadorBySlug(slug: string) {
  const { data, error } = await supabase
    .from('ambassadors')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) throw error
  return data as Ambassador
}

// Atualizar embaixador
export async function updateAmbassador(id: string, data: Partial<Ambassador>) {
  console.log('[ambassadorService] Updating ambassador with data:', data);
  const { data: ambassador, error } = await supabase
    .from('ambassadors')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  console.log('[ambassadorService] Update response:', ambassador);
  return ambassador as Ambassador
}

// Marcar contrato como assinado
export async function markContractAsSigned(id: string) {
  const { data, error } = await supabase
    .from('ambassadors')
    .update({
      contract_signed: true,
      contract_signed_at: new Date().toISOString(),
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Ambassador
}

// Criar lead via embaixador
export async function createAmbassadorLead(ambassadorId: string, data: {
  name: string
  email?: string
  phone?: string
  interest_type?: string
  location?: string
  budget?: string
  notes?: string
  marketing_opt_in: boolean
}) {
  const { data: lead, error } = await supabase
    .from('ambassador_leads')
    .insert([
      {
        ambassador_id: ambassadorId,
        ...data,
      },
    ])
    .select()
    .single()

  if (error) throw error

  // Incrementar stats
  await supabase.rpc('increment_ambassador_leads', { amb_id: ambassadorId })

  return lead as AmbassadorLead
}

// Listar leads do embaixador
export async function getAmbassadorLeads(ambassadorId: string) {
  const { data, error } = await supabase
    .from('ambassador_leads')
    .select('*')
    .eq('ambassador_id', ambassadorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as AmbassadorLead[]
}

// Atualizar status da lead
export async function updateAmbassadorLeadStatus(
  leadId: string,
  status: 'new' | 'contacted' | 'in_progress' | 'deal_closed' | 'lost'
) {
  const { data, error } = await supabase
    .from('ambassador_leads')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', leadId)
    .select()
    .single()

  if (error) throw error
  return data as AmbassadorLead
}

// Criar comissão
export async function createAmbassadorCommission(data: {
  ambassador_id: string
  ambassador_lead_id?: string
  description: string
  deal_value: number
  commission_type: 'fixed' | 'percentage'
  commission_value: number
}) {
  const commission_amount =
    data.commission_type === 'percentage'
      ? (data.deal_value * data.commission_value) / 100
      : data.commission_value

  const { data: commission, error } = await supabase
    .from('ambassador_commissions')
    .insert([
      {
        ...data,
        commission_amount,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) throw error
  return commission
}

// Listar comissões do embaixador
export async function getAmbassadorCommissions(ambassadorId: string) {
  const { data, error } = await supabase
    .from('ambassador_commissions')
    .select('*')
    .eq('ambassador_id', ambassadorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Marcar comissão como paga
export async function payAmbassadorCommission(commissionId: string) {
  const { data, error } = await supabase
    .from('ambassador_commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', commissionId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Deletar embaixador
export async function deleteAmbassador(id: string) {
  const { error } = await supabase
    .from('ambassadors')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function activateAmbassadorSubscription(
  ambassadorId: string,
  subscriptionId: string,
  userId: string
) {
  const { data, error } = await supabase.rpc('activate_ambassador', {
    p_ambassador_id: ambassadorId,
    p_subscription_id: subscriptionId,
    p_user_id: userId,
  })

  if (error) throw error
  return data
}

export async function deactivateAmbassadorSubscription(
  ambassadorId: string,
  userId: string,
  reason?: string
) {
  const { data, error } = await supabase.rpc('deactivate_ambassador', {
    p_ambassador_id: ambassadorId,
    p_user_id: userId,
    p_reason: reason || null,
  })

  if (error) throw error
  return data
}

export async function toggleAmbassadorPublished(id: string, isPublished: boolean, userId?: string) {
  console.log('toggleAmbassadorPublished called with:', { id, isPublished, userId })
  const { data, error } = await supabase
    .from('ambassadors')
    .update({ is_published: isPublished, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    console.error('Error toggling ambassador published:', error)
    throw error
  }
  
  console.log('Ambassador published toggled:', data)
  return data as Ambassador
}
