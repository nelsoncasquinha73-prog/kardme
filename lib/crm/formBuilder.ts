import { supabase } from '@/lib/supabaseClient'

export interface FormQuestion {
  id?: string
  form_id?: string
  order_index: number
  type: 'text' | 'email' | 'textarea' | 'single_choice' | 'multiple_choice' | 'rating' | 'date'
  question: string
  description?: string
  placeholder?: string
  is_required: boolean
  options?: Array<{ label: string; value: string }>
}

export interface LeadMagnetForm {
  id?: string
  user_id: string
  lead_magnet_id: string
  title: string
  description?: string
  thank_you_message: string
  thank_you_email_template?: string
  is_active: boolean
  questions?: FormQuestion[]
}

export interface FormResponse {
  id?: string
  form_id: string
  lead_id: string
  responses: Record<string, string | string[]>
  submitted_at?: string
}


// CRUD - Formulários
export async function createForm(form: LeadMagnetForm): Promise<LeadMagnetForm> {
  const { data, error } = await supabase
    .from('lead_magnet_forms')
    .insert({
      user_id: form.user_id,
      lead_magnet_id: form.lead_magnet_id,
      title: form.title,
      description: form.description,
      thank_you_message: form.thank_you_message,
      thank_you_email_template: form.thank_you_email_template,
      is_active: form.is_active,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getForm(formId: string): Promise<LeadMagnetForm> {
  const { data: form, error: formError } = await supabase
    .from('lead_magnet_forms')
    .select()
    .eq('id', formId)
    .single()

  if (formError) throw formError

  const { data: questions, error: questionsError } = await supabase
    .from('form_questions')
    .select()
    .eq('form_id', formId)
    .order('order_index', { ascending: true })

  if (questionsError) throw questionsError

  return { ...form, questions }
}

export async function updateForm(formId: string, updates: Partial<LeadMagnetForm>): Promise<LeadMagnetForm> {
  const { data, error } = await supabase
    .from('lead_magnet_forms')
    .update({
      title: updates.title,
      description: updates.description,
      thank_you_message: updates.thank_you_message,
      thank_you_email_template: updates.thank_you_email_template,
      is_active: updates.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', formId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteForm(formId: string): Promise<void> {
  const { error } = await supabase
    .from('lead_magnet_forms')
    .delete()
    .eq('id', formId)

  if (error) throw error
}

// CRUD - Perguntas
export async function addQuestion(question: FormQuestion): Promise<FormQuestion> {
  const { data, error } = await supabase
    .from('form_questions')
    .insert(question)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateQuestion(questionId: string, updates: Partial<FormQuestion>): Promise<FormQuestion> {
  const { data, error } = await supabase
    .from('form_questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteQuestion(questionId: string): Promise<void> {
  const { error } = await supabase
    .from('form_questions')
    .delete()
    .eq('id', questionId)

  if (error) throw error
}

export async function reorderQuestions(formId: string, questions: FormQuestion[]): Promise<void> {
  const updates = questions.map((q, idx) => ({
    id: q.id,
    order_index: idx,
  }))

  for (const update of updates) {
    const { error } = await supabase
      .from('form_questions')
      .update({ order_index: update.order_index })
      .eq('id', update.id)

    if (error) throw error
  }
}

// Submissão de formulário
export async function submitFormResponse(response: FormResponse): Promise<FormResponse> {
  const { data, error } = await supabase
    .from('form_responses')
    .insert({
      form_id: response.form_id,
      lead_id: response.lead_id,
      responses: response.responses,
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// Obter respostas de um formulário
export async function getFormResponses(formId: string): Promise<FormResponse[]> {
  const { data, error } = await supabase
    .from('form_responses')
    .select()
    .eq('form_id', formId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}

// Obter respostas de um lead específico
export async function getLeadResponses(leadId: string): Promise<FormResponse[]> {
  const { data, error } = await supabase
    .from('form_responses')
    .select()
    .eq('lead_id', leadId)
    .order('submitted_at', { ascending: false })

  if (error) throw error
  return data
}
