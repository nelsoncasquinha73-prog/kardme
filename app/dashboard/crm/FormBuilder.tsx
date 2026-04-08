'use client'

import { useState, useEffect } from 'react'
import {
  LeadMagnetForm,
  FormQuestion,
  createForm,
  updateForm,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  getForm,
} from '@/lib/crm/formBuilder'
import { validateQuestion } from '@/lib/crm/formValidation'
import { useToast } from '@/lib/toast-context'
import { FiPlus, FiTrash2, FiEdit2, FiEye, FiCheck, FiX } from 'react-icons/fi'

interface FormBuilderProps {
  userId: string
  leadMagnetId: string
  formId?: string
  onSave?: (form: LeadMagnetForm) => void
}

export default function FormBuilder({
  userId,
  leadMagnetId,
  formId,
  onSave,
}: FormBuilderProps) {
  const { addToast } = useToast()

  const [form, setForm] = useState<LeadMagnetForm>({
    user_id: userId,
    lead_magnet_id: leadMagnetId,
    title: 'Novo Formulário',
    description: '',
    thank_you_message: 'Obrigado por responder!',
    thank_you_email_template: '',
    is_active: true,
    questions: [],
  })

  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (formId) {
      loadForm()
    }
  }, [formId])

  async function loadForm() {
    try {
      const loadedForm = await getForm(formId!)
      setForm({
        ...loadedForm,
        questions: loadedForm.questions || [],
      })
    } catch (error) {
      console.error(error)
      addToast('Erro ao carregar formulário', 'error')
    }
  }

  async function handleSaveForm() {
    setSaving(true)

    try {
      let savedForm: LeadMagnetForm

      if (form.id) {
        savedForm = await updateForm(form.id, form)
      } else {
        savedForm = await createForm(form)
      }

      setForm((prev) => ({
        ...prev,
        ...savedForm,
        questions: prev.questions || [],
      }))

      addToast('Formulário guardado com sucesso!', 'success')
      onSave?.(savedForm)
    } catch (error) {
      console.error(error)
      addToast('Erro ao guardar formulário', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleAddQuestion() {
    const newQuestion: FormQuestion = {
      form_id: form.id,
      order_index: form.questions?.length || 0,
      type: 'text',
      question: '',
      description: '',
      placeholder: '',
      is_required: true,
      options: [],
    }

    setEditingQuestion(newQuestion)
  }

  async function handleSaveQuestion() {
    if (!editingQuestion) return

    const errors = validateQuestion(editingQuestion)
    if (errors.length > 0) {
      addToast(errors[0], 'error')
      return
    }

    try {
      if (!form.id) {
        addToast('Guarda primeiro o formulário antes de adicionar perguntas', 'error')
        return
      }

      if (editingQuestion.id) {
        const updated = await updateQuestion(editingQuestion.id, editingQuestion)

        setForm((prev) => ({
          ...prev,
          questions: (prev.questions || []).map((q) =>
            q.id === editingQuestion.id ? updated : q
          ),
        }))
      } else {
        const saved = await addQuestion({
          ...editingQuestion,
          form_id: form.id,
        })

        setForm((prev) => ({
          ...prev,
          questions: [...(prev.questions || []), saved],
        }))
      }

      addToast('Pergunta guardada com sucesso!', 'success')
      setEditingQuestion(null)
    } catch (error) {
      console.error(error)
      addToast('Erro ao guardar pergunta', 'error')
    }
  }

  async function handleDeleteQuestion(questionId: string) {
    const confirmed = window.confirm('Tens a certeza que queres apagar esta pergunta?')
    if (!confirmed) return

    try {
      await deleteQuestion(questionId)

      setForm((prev) => ({
        ...prev,
        questions: (prev.questions || []).filter((q) => q.id !== questionId),
      }))

      addToast('Pergunta removida com sucesso!', 'success')
    } catch (error) {
      console.error(error)
      addToast('Erro ao remover pergunta', 'error')
    }
  }

  if (editingQuestion) {
    return (
      <QuestionEditor
        question={editingQuestion}
        onChange={setEditingQuestion}
        onSave={handleSaveQuestion}
        onCancel={() => setEditingQuestion(null)}
      />
    )
  }

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, padding: 24 }}>
        <h1 style={{ color: '#fff', marginBottom: 24 }}>Form Builder</h1>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Título do formulário
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                title: e.target.value,
              }))
            }
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Descrição
          </label>
          <textarea
            value={form.description || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Explica o objetivo deste formulário"
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Mensagem de agradecimento
          </label>
          <textarea
            value={form.thank_you_message}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                thank_you_message: e.target.value,
              }))
            }
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              display: 'block',
              fontSize: 12,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: 8,
              fontWeight: 700,
            }}
          >
            Template de email de agradecimento
          </label>
          <textarea
            value={form.thank_you_email_template || ''}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                thank_you_email_template: e.target.value,
              }))
            }
            placeholder="Opcional"
            style={textareaStyle}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <h3 style={{ color: '#fff', marginBottom: 12, fontSize: 15 }}>
            Perguntas ({form.questions?.length || 0})
          </h3>

          {form.questions && form.questions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {form.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                      {q.question || 'Pergunta sem título'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 4 }}>
                      {q.type} · {q.is_required ? 'Obrigatória' : 'Opcional'}
                    </div>
                  </div>

                  <button onClick={() => setEditingQuestion(q)} style={secondaryButtonStyle}>
                    <FiEdit2 size={14} />
                  </button>

                  <button
                    onClick={() => q.id && handleDeleteQuestion(q.id)}
                    style={dangerButtonStyle}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 16,
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px dashed rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.55)',
                fontSize: 14,
              }}
            >
              Ainda não adicionaste perguntas.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={handleAddQuestion} style={successButtonStyle}>
            <FiPlus size={16} />
            Adicionar pergunta
          </button>

          <button onClick={() => setShowPreview(true)} style={secondaryWideButtonStyle}>
            <FiEye size={16} />
            Preview
          </button>

          <button onClick={handleSaveForm} disabled={saving} style={primaryButtonStyle}>
            <FiCheck size={16} />
            {saving ? 'A guardar...' : 'Guardar formulário'}
          </button>
        </div>
      </div>

      {showPreview && <FormPreview form={form} onClose={() => setShowPreview(false)} />}
    </div>
  )
}

function QuestionEditor({
  question,
  onChange,
  onSave,
  onCancel,
}: {
  question: FormQuestion
  onChange: (q: FormQuestion) => void
  onSave: () => void
  onCancel: () => void
}) {
  const isChoiceType =
    question.type === 'single_choice' || question.type === 'multiple_choice'

  function updateOption(index: number, field: 'label' | 'value', value: string) {
    const nextOptions = [...(question.options || [])]
    nextOptions[index] = {
      ...nextOptions[index],
      [field]: value,
    }
    onChange({ ...question, options: nextOptions })
  }

  function addOption() {
    onChange({
      ...question,
      options: [...(question.options || []), { label: '', value: '' }],
    })
  }

  function removeOption(index: number) {
    const nextOptions = [...(question.options || [])]
    nextOptions.splice(index, 1)
    onChange({ ...question, options: nextOptions })
  }

  return (
    <div style={{ padding: 24, maxWidth: 760 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={{ color: '#fff', margin: 0 }}>Editar pergunta</h2>

        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          <FiX />
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Pergunta</label>
        <input
          type="text"
          value={question.question}
          onChange={(e) => onChange({ ...question, question: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Tipo</label>
        <select
          value={question.type}
          onChange={(e) =>
            onChange({
              ...question,
              type: e.target.value as FormQuestion['type'],
              options:
                e.target.value === 'single_choice' || e.target.value === 'multiple_choice'
                  ? question.options || [{ label: '', value: '' }, { label: '', value: '' }]
                  : [],
            })
          }
          style={inputStyle}
        >
          <option value="text">Texto curto</option>
          <option value="email">Email</option>
          <option value="textarea">Texto longo</option>
          <option value="single_choice">Escolha única</option>
          <option value="multiple_choice">Múltipla escolha</option>
          <option value="rating">Rating</option>
          <option value="date">Data</option>
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Descrição</label>
        <textarea
          value={question.description || ''}
          onChange={(e) => onChange({ ...question, description: e.target.value })}
          style={textareaStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Placeholder</label>
        <input
          type="text"
          value={question.placeholder || ''}
          onChange={(e) => onChange({ ...question, placeholder: e.target.value })}
          style={inputStyle}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Obrigatória?</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => onChange({ ...question, is_required: true })}
            style={{
              ...toggleButtonStyle,
              background: question.is_required ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255,255,255,0.08)',
              borderColor: question.is_required ? 'rgba(34, 197, 94, 0.5)' : 'rgba(255,255,255,0.15)',
              color: question.is_required ? '#86efac' : 'rgba(255,255,255,0.7)',
            }}
          >
            Sim
          </button>
          <button
            onClick={() => onChange({ ...question, is_required: false })}
            style={{
              ...toggleButtonStyle,
              background: !question.is_required ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.08)',
              borderColor: !question.is_required ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.15)',
              color: !question.is_required ? '#60a5fa' : 'rgba(255,255,255,0.7)',
            }}
          >
            Não
          </button>
        </div>
      </div>

      {isChoiceType && (
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Opções</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(question.options || []).map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Label"
                  value={opt.label}
                  onChange={(e) => updateOption(idx, 'label', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={opt.value}
                  onChange={(e) => updateOption(idx, 'value', e.target.value)}
                  style={inputStyle}
                />
                <button
                  onClick={() => removeOption(idx)}
                  style={{
                    ...dangerButtonStyle,
                    padding: '8px 12px',
                  }}
                >
                  <FiTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addOption} style={{ ...successButtonStyle, marginTop: 10 }}>
            <FiPlus size={14} /> Adicionar opção
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onSave} style={primaryButtonStyle}>
          <FiCheck size={16} /> Guardar pergunta
        </button>
        <button onClick={onCancel} style={secondaryWideButtonStyle}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function FormPreview({ form, onClose }: { form: LeadMagnetForm; onClose: () => void }) {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

  function handleAnswerChange(questionId: string, value: string | string[]) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#0f172a',
          borderRadius: 12,
          padding: 32,
          maxWidth: 600,
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ color: '#fff', margin: 0 }}>{form.title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 20,
            }}
          >
            <FiX />
          </button>
        </div>

        {form.description && (
          <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 24 }}>{form.description}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
          {(form.questions || []).map((q) => (
            <div key={q.id}>
              <label style={{ display: 'block', color: '#fff', marginBottom: 8, fontWeight: 600 }}>
                {q.question}
                {q.is_required && <span style={{ color: '#f87171' }}> *</span>}
              </label>

              {q.description && (
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 8 }}>
                  {q.description}
                </p>
              )}

              {q.type === 'text' && (
                <input
                  type="text"
                  placeholder={q.placeholder || ''}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => handleAnswerChange(q.id || '', e.target.value)}
                  style={inputStyle}
                />
              )}

              {q.type === 'email' && (
                <input
                  type="email"
                  placeholder={q.placeholder || 'seu@email.com'}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => handleAnswerChange(q.id || '', e.target.value)}
                  style={inputStyle}
                />
              )}

              {q.type === 'textarea' && (
                <textarea
                  placeholder={q.placeholder || ''}
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => handleAnswerChange(q.id || '', e.target.value)}
                  style={textareaStyle}
                />
              )}

              {q.type === 'date' && (
                <input
                  type="date"
                  value={(answers[q.id || ''] as string) || ''}
                  onChange={(e) => handleAnswerChange(q.id || '', e.target.value)}
                  style={inputStyle}
                />
              )}

              {q.type === 'single_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(q.options || []).map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={(answers[q.id || ''] as string) === opt.value}
                        onChange={(e) => handleAnswerChange(q.id || '', e.target.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'multiple_choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(q.options || []).map((opt) => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        value={opt.value}
                        checked={((answers[q.id || ''] as string[]) || []).includes(opt.value)}
                        onChange={(e) => {
                          const current = ((answers[q.id || ''] as string[]) || [])
                          const next = e.target.checked
                            ? [...current, opt.value]
                            : current.filter((v) => v !== opt.value)
                          handleAnswerChange(q.id || '', next)
                        }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              )}

              {q.type === 'rating' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => handleAnswerChange(q.id || '', String(n))}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: (answers[q.id || ''] as string) === String(n) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.08)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <button onClick={onClose} style={primaryButtonStyle}>
          Fechar preview
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: 14,
  fontFamily: 'inherit',
} as const

const textareaStyle = {
  ...inputStyle,
  minHeight: 100,
  resize: 'vertical' as const,
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  color: 'rgba(255,255,255,0.7)',
  marginBottom: 8,
  fontWeight: 700,
} as const

const primaryButtonStyle = {
  padding: '10px 16px',
  borderRadius: 6,
  border: '1px solid rgba(34, 197, 94, 0.4)',
  background: 'rgba(34, 197, 94, 0.2)',
  color: '#86efac',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
} as const

const secondaryButtonStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid rgba(59, 130, 246, 0.4)',
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#60a5fa',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
} as const

const secondaryWideButtonStyle = {
  padding: '10px 16px',
  borderRadius: 6,
  border: '1px solid rgba(59, 130, 246, 0.4)',
  background: 'rgba(59, 130, 246, 0.2)',
  color: '#60a5fa',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
} as const

const successButtonStyle = {
  padding: '10px 16px',
  borderRadius: 6,
  border: '1px solid rgba(16, 185, 129, 0.4)',
  background: 'rgba(16, 185, 129, 0.2)',
  color: '#6ee7b7',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
} as const

const dangerButtonStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid rgba(239, 68, 68, 0.4)',
  background: 'rgba(239, 68, 68, 0.2)',
  color: '#f87171',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
} as const

const toggleButtonStyle = {
  padding: '8px 16px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
} as const
