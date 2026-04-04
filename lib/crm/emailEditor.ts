import { supabase } from '@/lib/supabaseClient'

export type EmailBlockType = 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'video'

export interface EmailBlockTemplate {
  id: string
  user_id: string
  name: string
  block_type: EmailBlockType
  content: Record<string, any>
  created_at: string
  updated_at: string
}

export async function fetchEmailBlockTemplates(userId: string): Promise<EmailBlockTemplate[]> {
  const { data, error } = await supabase
    .from('email_block_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Erro ao carregar blocos de email:', error)
    return []
  }

  return (data || []) as EmailBlockTemplate[]
}

export async function createEmailBlockTemplate(
  userId: string,
  name: string,
  blockType: EmailBlockType,
  content: Record<string, any>
): Promise<EmailBlockTemplate> {
  const { data, error } = await supabase
    .from('email_block_templates')
    .insert({
      user_id: userId,
      name,
      block_type: blockType,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data as EmailBlockTemplate
}

export async function updateEmailBlockTemplate(
  id: string,
  userId: string,
  updates: {
    name?: string
    content?: Record<string, any>
  }
): Promise<EmailBlockTemplate> {
  const { data, error } = await supabase
    .from('email_block_templates')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data as EmailBlockTemplate
}

export async function deleteEmailBlockTemplate(id: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('email_block_templates')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) throw error
}

export const DEFAULT_EMAIL_BLOCKS: Array<{
  name: string
  block_type: EmailBlockType
  content: Record<string, any>
}> = [
  {
    name: 'Texto',
    block_type: 'text',
    content: {
      text: 'Escreve aqui o teu texto...',
      fontSize: 16,
      color: '#111827',
      align: 'left',
      fontWeight: 400,
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  {
    name: 'Imagem',
    block_type: 'image',
    content: {
      url: '',
      alt: '',
      width: '100%',
      borderRadius: 12,
      align: 'center',
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  {
    name: 'Botão',
    block_type: 'button',
    content: {
      text: 'Clica aqui',
      url: '',
      backgroundColor: '#10b981',
      textColor: '#ffffff',
      align: 'center',
      borderRadius: 10,
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  {
    name: 'Vídeo',
    block_type: 'video',
    content: {
      videoUrl: '',
      thumbnail: '',
      width: '100%',
      align: 'center',
      paddingTop: 0,
      paddingBottom: 0,
    },
  },
  {
    name: 'Divisor',
    block_type: 'divider',
    content: {
      color: '#e5e7eb',
      thickness: 1,
      marginTop: 12,
      marginBottom: 12,
    },
  },
  {
    name: 'Espaçador',
    block_type: 'spacer',
    content: {
      height: 24,
    },
  },
]
