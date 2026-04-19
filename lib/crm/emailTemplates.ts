import { supabase } from '@/lib/supabaseClient'
import { type EmailBlock } from '@/app/dashboard/crm/EmailCampaignEditor'

export type EmailTemplate = {
  id: string
  user_id: string
  name: string
  category: string
  subject: string
  body: string
  blocks?: EmailBlock[] | null
  created_at: string
}

export async function fetchEmailTemplates(params: { userId: string; category?: string }) {
  let query = supabase
    .from('email_templates')
    .select('*')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })

  if (params.category && params.category !== 'Todos') {
    query = query.eq('category', params.category)
  }

  return query
}

export async function createEmailTemplate(params: {
  userId: string
  name: string
  category: string
  subject: string
  body: string
  blocks?: EmailBlock[] | null
}) {
  return supabase.from('email_templates').insert({
    user_id: params.userId,
    name: params.name,
    category: params.category,
    subject: params.subject,
    body: params.body,
    blocks: params.blocks || null,
  })
}

export async function deleteEmailTemplate(params: { templateId: string }) {
  return supabase.from('email_templates').delete().eq('id', params.templateId)
}


export async function updateEmailTemplate(params: {
  templateId: string
  name: string
  category: string
  subject: string
  body: string
  blocks?: EmailBlock[] | null
}) {
  return supabase
    .from('email_templates')
    .update({
      name: params.name,
      category: params.category,
      subject: params.subject,
      body: params.body,
      blocks: params.blocks || null,
    })
    .eq('id', params.templateId)
}

export const DEFAULT_EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'default-1',
    user_id: '',
    name: 'Obrigado pela Presença',
    category: 'Agradecimento',
    subject: 'Obrigado por estar presente! 🎉',
    body: 'Olá {nome},\n\nObrigado por ter estado presente no nosso evento. Foi um prazer conhecer-te!\n\nQualquer dúvida ou interesse, fico à disposição.\n\nMelhores cumprimentos,\nKardme',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-2',
    user_id: '',
    name: 'Follow-up Pós-Evento',
    category: 'Follow-up',
    subject: 'Seguimento do nosso encontro',
    body: 'Olá {nome},\n\nEspero que tenha aproveitado o evento. Gostaria de saber se tem alguma questão ou se posso ajudar em algo.\n\nFico à espera do seu contacto.\n\nMelhores cumprimentos,\nKardme',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-3',
    user_id: '',
    name: 'Proposta Imobiliária',
    category: 'Imobiliário',
    subject: 'Proposta de Propriedade - {nome}',
    body: 'Olá {nome},\n\nSegue em anexo a planta e detalhes da propriedade que visitou.\n\nQualquer dúvida, fico à disposição para esclarecimentos.\n\nMelhores cumprimentos,\nKardme',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-4',
    user_id: '',
    name: 'Foto de Grupo - Excursão',
    category: 'Excursões',
    subject: 'Foto de Grupo da Excursão 📸',
    body: 'Olá {nome},\n\nSegue em anexo a foto de grupo do nosso passeio. Esperamos que tenha apreciado!\n\nAté à próxima aventura!\n\nMelhores cumprimentos,\nKardme',
    created_at: new Date().toISOString(),
  },
  {
    id: 'default-5',
    user_id: '',
    name: 'Confirmação de Reunião',
    category: 'Geral',
    subject: 'Confirmação de Reunião',
    body: 'Olá {nome},\n\nConfirmo a nossa reunião conforme agendado. Fico à espera de ti.\n\nMelhores cumprimentos,\nKardme',
    created_at: new Date().toISOString(),
  },
]
