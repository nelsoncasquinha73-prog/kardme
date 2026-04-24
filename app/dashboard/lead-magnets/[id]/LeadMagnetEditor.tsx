'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import { FiArrowLeft, FiSave, FiCopy, FiTrash2 } from 'react-icons/fi'
import LeadMagnetPreview from './LeadMagnetPreview'
import styles from './LeadMagnetEditor.module.css'

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

const MAGNET_TYPES = [
  { id: 'ebook', label: '📚 E-book', icon: '📚' },
  { id: 'guide', label: '📖 Guia', icon: '📖' },
  { id: 'checklist', label: '✅ Checklist', icon: '✅' },
  { id: 'discount', label: '🏷️ Desconto', icon: '🏷️' },
  { id: 'webinar', label: '🎥 Webinar', icon: '🎥' },
  { id: 'form', label: '📋 Formulário', icon: '📋' },
  { id: 'raffle', label: '🎰 Sorteio', icon: '🎰' },
  { id: 'wheel', label: '🎡 Roda da Sorte', icon: '🎡' },
  { id: 'custom', label: '⚙️ Personalizado', icon: '⚙️' },
]

const PRESETS: Record<string, Partial<LeadMagnet>> = {
  ebook: {
    capture_page_title: 'Descarrega o E-book Gratuito',
    capture_page_subtitle: 'Aprende as melhores práticas com este guia completo',
    capture_page_button_text: 'Receber E-book',
    welcome_email_subject: '📚 O teu e-book está pronto!',
    welcome_email_body: 'Olá {{name}},\\n\\nObrigado pelo teu interesse!\\n\\nAqui está o link para o teu e-book:\\n{{link}}\\n\\nPodes fazer download a qualquer momento.\\n\\nMelhores cumprimentos',
    thank_you_message: 'Obrigado! O teu e-book está a ser enviado para o teu email.',
  },
  checklist: {
    capture_page_title: 'Descarrega a Checklist',
    capture_page_subtitle: 'Não percas nenhum passo importante',
    capture_page_button_text: 'Receber Checklist',
    welcome_email_subject: '✅ A tua checklist está pronta!',
    welcome_email_body: 'Olá {{name}},\\n\\nAqui está a checklist que pediste:\\n{{link}}\\n\\nUsa-a para garantir que não esqueces nada!\\n\\nMelhores cumprimentos',
    thank_you_message: 'Perfeito! A checklist foi enviada para o teu email.',
  },
  wheel: {
    capture_page_title: 'Tenta a Tua Sorte na Roleta!',
    capture_page_subtitle: 'Gira e ganha um prémio exclusivo',
    capture_page_button_text: 'Girar Roleta',
    welcome_email_subject: '🎡 O teu resultado na roleta!',
    welcome_email_body: 'Olá {{name}},\\n\\nObrigado por participares na roleta!\\n\\nO teu resultado foi: {{premio}}\\n\\nMelhores cumprimentos',
    thank_you_message: 'Parabéns! O teu resultado foi enviado para o teu email.',
  },
  raffle: {
    capture_page_title: 'Participa no Sorteio',
    capture_page_subtitle: 'Preenche o formulário e tenta ganhar',
    capture_page_button_text: 'Participar',
    welcome_email_subject: '🎰 A tua participação no sorteio!',
    welcome_email_body: 'Olá {{name}},\\n\\nObrigado por participares no sorteio!\\n\\nO teu número da sorte é: {{numero}}\\n\\nGuarda este email — se fores o vencedor entraremos em contacto contigo.\\n\\nBoa sorte!\\n\\nMelhores cumprimentos',
    thank_you_message: 'Obrigado! O teu número foi registado. Boa sorte!',
  },
}

interface EditorProps {
  magnet: LeadMagnet
  userId: string
  onBack: () => void
}

export default function LeadMagnetEditor({ magnet: initialMagnet, userId, onBack }: EditorProps) {
  const { addToast } = useToast()
  const [magnet, setMagnet] = useState<LeadMagnet>(initialMagnet)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  type CardOption = { id: string; name: string | null }

  const [cards, setCards] = useState<CardOption[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [showSections, setShowSections] = useState({
    capture: true,
    welcome: true,
    success: true,
  })

  useEffect(() => {
    if (initialMagnet) {
      setMagnet(initialMagnet)
    }
  }, [initialMagnet])

  useEffect(() => {
    if (!userId) return

    let isMounted = true
    const loadCards = async () => {
      setIsLoadingCards(true)
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('id, name')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        if (isMounted) setCards(data || [])
      } catch (e) {
        console.error(e)
        addToast('Erro ao carregar cartões', 'error')
      } finally {
        if (isMounted) setIsLoadingCards(false)
      }
    }

    loadCards()
    return () => {
      isMounted = false
    }
  }, [userId, addToast])

  const handleChange = useCallback((field: keyof LeadMagnet, value: any) => {
    setMagnet(prev => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  const handleTypeChange = (typeId: string) => {
    const preset = PRESETS[typeId] || {}
    setMagnet(prev => ({
      ...prev,
      magnet_type: typeId,
      ...preset,
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!magnet || !userId) {
      addToast('Dados não carregados', 'error')
      return
    }
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .update({
          title: magnet.title,
          magnet_type: magnet.magnet_type,
          card_id: magnet.card_id,
          is_active: magnet.is_active,
          welcome_email_subject: magnet.welcome_email_subject,
          welcome_email_body: magnet.welcome_email_body,
          file_url: magnet.file_url,
          thank_you_message: magnet.thank_you_message,
          capture_page_title: magnet.capture_page_title,
          capture_page_subtitle: magnet.capture_page_subtitle,
          capture_page_image: magnet.capture_page_image,
          cover_image_url: magnet.capture_page_image,
          capture_page_button_text: magnet.capture_page_button_text,
          capture_page_success_message: magnet.capture_page_success_message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', magnet.id)
        .eq('user_id', userId)

      if (error) throw error

      setHasChanges(false)
      addToast('Lead magnet guardado com sucesso', 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao guardar lead magnet', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .insert({
          user_id: userId,
          slug: `\${magnet.slug}-copia-\${Date.now()}`,
          title: `\${magnet.title} (cópia)`,
          magnet_type: magnet.magnet_type,
          card_id: magnet.card_id,
          is_active: false,
          welcome_email_subject: magnet.welcome_email_subject,
          welcome_email_body: magnet.welcome_email_body,
          file_url: magnet.file_url,
          thank_you_message: magnet.thank_you_message,
          capture_page_title: magnet.capture_page_title,
          capture_page_subtitle: magnet.capture_page_subtitle,
          capture_page_image: magnet.capture_page_image,
          capture_page_button_text: magnet.capture_page_button_text,
          capture_page_success_message: magnet.capture_page_success_message,
        })

      if (error) throw error
      addToast('Lead magnet duplicado com sucesso', 'success')
    } catch (e) {
      console.error(e)
      addToast('Erro ao duplicar lead magnet', 'error')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tens a certeza que queres apagar este lead magnet?')) return

    try {
      const { error } = await supabase
        .from('lead_magnets')
        .delete()
        .eq('id', magnet.id)
        .eq('user_id', userId)

      if (error) throw error
      addToast('Lead magnet apagado', 'success')
      onBack()
    } catch (e) {
      console.error(e)
      addToast('Erro ao apagar lead magnet', 'error')
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backBtn} title="Voltar">
          <FiArrowLeft size={20} />
        </button>
        <div className={styles.headerTitle}>
          <input
            type="text"
            value={magnet.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className={styles.titleInput}
            placeholder="Nome da campanha"
          />
          <span className={styles.slug}>/{magnet.slug}</span>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleDuplicate} className={styles.actionBtn} title="Duplicar">
            <FiCopy size={18} />
          </button>
          <button onClick={handleDelete} className={styles.actionBtn} style={{ color: '#ef4444' }} title="Apagar">
            <FiTrash2 size={18} />
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={styles.saveBtn}
          >
            <FiSave size={18} />
            {isSaving ? 'A guardar...' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.editor}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Tipo de Campanha</h3>
            <div className={styles.typeGrid}>
              {MAGNET_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeChange(type.id)}
                  className={`\${styles.typeCard} \${magnet.magnet_type === type.id ? styles.typeCardActive : ''}`}
                >
                  <span className={styles.typeIcon}>{type.icon}</span>
                  <span className={styles.typeLabel}>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📨 Remetente (Cartão)</h3>

            <div className={styles.field}>
              <label>Escolhe o cartão que vai enviar os emails desta campanha</label>
              <select
                value={magnet.card_id || ''}
                onChange={(e) => handleChange('card_id', e.target.value || null)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  outline: 'none',
                }}
                disabled={isLoadingCards}
              >
                <option value="">
                  {isLoadingCards ? 'A carregar cartões...' : '— Selecionar cartão —'}
                </option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || '(Sem nome)'} ({c.id.slice(0, 6)}…)
                  </option>
                ))}
              </select>

              <small style={{ opacity: 0.65, marginTop: 8, display: 'block' }}>
                Obrigatório para enviar emails com o Gmail certo (cada cartão pode ter um Gmail diferente).
              </small>
            </div>
          </div>

          <div className={styles.section}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={magnet.is_active}
                onChange={(e) => {
                  const next = e.target.checked
                  if (next && !magnet.card_id) {
                    addToast('Para ativar a campanha, escolhe primeiro o cartão remetente.', 'error')
                    return
                  }
                  handleChange('is_active', next)
                }}
              />
              <span>Campanha ativa</span>
            </label>
          </div>

          <div className={styles.section}>
            <button
              onClick={() => setShowSections(prev => ({ ...prev, capture: !prev.capture }))}
              className={styles.sectionToggle}
            >
              <span>{showSections.capture ? '▼' : '▶'}</span>
              <h3>📄 Página de Captura</h3>
              <span className={styles.sectionBadge}>Mensagem que o cliente vê ao clicar no link</span>
            </button>
            {showSections.capture && (
              <div className={styles.sectionContent}>
                <div className={styles.field}>
                  <label>Título</label>
                  <input
                    type="text"
                    value={magnet.capture_page_title}
                    onChange={(e) => handleChange('capture_page_title', e.target.value)}
                    placeholder="Ex: Descarrega o E-book Gratuito"
                  />
                </div>
                <div className={styles.field}>
                  <label>Subtítulo</label>
                  <input
                    type="text"
                    value={magnet.capture_page_subtitle}
                    onChange={(e) => handleChange('capture_page_subtitle', e.target.value)}
                    placeholder="Ex: Aprende as melhores práticas"
                  />
                </div>
                <div className={styles.field}>
                <div className={styles.field}>
                  <label>Imagem</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={magnet.capture_page_image || ''}
                      onChange={(e) => handleChange('capture_page_image', e.target.value)}
                      placeholder="URL da imagem"
                      style={{ flex: 1 }}
                    />

                    <button
                      type="button"
                      onClick={() => document.getElementById('capture-image-input')?.click()}
                      style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Upload"
                    >
                      📷 Upload
                    </button>

                    {magnet.capture_page_image && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleChange('capture_page_image', '')}
                          style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                          title="Eliminar"
                        >
                          🗑
                        </button>
                      </>
                    )}

                    <input
                      id="capture-image-input"
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('type', 'capture_page_image')
                          const res = await fetch('/api/lead-magnets/upload', {
                            method: 'POST',
                            body: formData,
                            headers: { 'x-user-id': userId },
                          })
                          const data = await res.json()
                          if (data.url) handleChange('capture_page_image', data.url)
                        } catch (err) {
                          console.error(err)
                        } finally {
                          if (e.target) e.target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label>Link do Ficheiro/Recurso</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={magnet.file_url || ''}
                      onChange={(e) => handleChange('file_url', e.target.value)}
                      placeholder="URL do ficheiro para download"
                      style={{ flex: 1 }}
                    />

                    <button
                      type="button"
                      onClick={() => document.getElementById('file-url-input')?.click()}
                      style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      title="Upload"
                    >
                      📁 Upload
                    </button>

                    {magnet.file_url && (
                      <button
                        type="button"
                        onClick={() => handleChange('file_url', '')}
                        style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                        title="Eliminar"
                      >
                        🗑
                      </button>
                    )}

                    <input
                      id="file-url-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt,.csv"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const formData = new FormData()
                          formData.append('file', file)
                          formData.append('type', 'file_url')
                          const res = await fetch('/api/lead-magnets/upload', {
                            method: 'POST',
                            body: formData,
                            headers: { 'x-user-id': userId },
                          })
                          const data = await res.json()
                          if (data.url) handleChange('file_url', data.url)
                        } catch (err) {
                          console.error(err)
                        } finally {
                          if (e.target) e.target.value = ''
                        }
                      }}
                    />
                  </div>
                </div>
                </div>
                <div className={styles.field}>
                  <label>Texto do Botão</label>
                  <input
                    type="text"
                    value={magnet.capture_page_button_text}
                    onChange={(e) => handleChange('capture_page_button_text', e.target.value)}
                    placeholder="Ex: Receber E-book"
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <button
              onClick={() => setShowSections(prev => ({ ...prev, welcome: !prev.welcome }))}
              className={styles.sectionToggle}
            >
              <span>{showSections.welcome ? '▼' : '▶'}</span>
              <h3>📧 Email de Boas-vindas</h3>
              <span className={styles.sectionBadge}>Email que o cliente recebe após subscrever</span>
            </button>
            {showSections.welcome && (
              <div className={styles.sectionContent}>
                <div className={styles.field}>
                  <label>Assunto do Email</label>
                  <input
                    type="text"
                    value={magnet.welcome_email_subject}
                    onChange={(e) => handleChange('welcome_email_subject', e.target.value)}
                    placeholder="Ex: 📚 O teu e-book está pronto!"
                  />
                </div>
                <div className={styles.field}>
                  <label>Corpo do Email</label>
                  <textarea
                    value={magnet.welcome_email_body}
                    onChange={(e) => handleChange('welcome_email_body', e.target.value)}
                    placeholder="Use {{name}}, {{link}}, {{numero}}, {{premio}} para variáveis dinâmicas"
                    rows={8}
                  />
                  <small style={{ opacity: 0.6, marginTop: 8, display: 'block' }}>
                    Variáveis: {'name'} (nome), {'link'} (link), {'numero'} (sorteio), {'premio'} (roleta)
                  </small>
                </div>
                <div className={styles.field}>
                  <label>Link do Ficheiro/Recurso</label>
                  <input
                    type="text"
                    value={magnet.file_url || ''}
                    onChange={(e) => handleChange('file_url', e.target.value)}
                    placeholder="URL do ficheiro para download"
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <button
              onClick={() => setShowSections(prev => ({ ...prev, success: !prev.success }))}
              className={styles.sectionToggle}
            >
              <span>{showSections.success ? '▼' : '▶'}</span>
              <h3>✅ Mensagem de Sucesso</h3>
              <span className={styles.sectionBadge}>Mensagem após o cliente subscrever</span>
            </button>
            {showSections.success && (
              <div className={styles.sectionContent}>
                <div className={styles.field}>
                  <label>Mensagem</label>
                  <textarea
                    value={magnet.thank_you_message}
                    onChange={(e) => handleChange('thank_you_message', e.target.value)}
                    placeholder="Ex: Obrigado! O teu e-book está a ser enviado."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📊 Estatísticas</h3>
            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Leads capturados</span>
                <span className={styles.statValue}>{magnet.leads_count}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Criado em</span>
                <span className={styles.statValue}>{new Date(magnet.created_at).toLocaleDateString('pt-PT')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.preview}>
          <LeadMagnetPreview magnet={magnet} />
        </div>
      </div>
    </div>
  )
}
