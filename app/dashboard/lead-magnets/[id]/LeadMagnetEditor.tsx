'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useToast } from '@/lib/toast-context'
import { FiArrowLeft, FiSave, FiCopy, FiTrash2 } from 'react-icons/fi'
import LeadMagnetPreview from './LeadMagnetPreview'
import EventConfigurator from './EventConfigurator'
import styles from './LeadMagnetEditor.module.css'
import WheelConfigurator from '@/components/dashboard/WheelConfigurator'
import FormConfigurator from './FormConfigurator'
import ChecklistConfigurator from './ChecklistConfigurator'
import DiscountConfigurator from './DiscountConfigurator'

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
  show_download_button: boolean
  download_button_text: string
  success_message?: string
  show_success_message?: boolean
  leads_count: number
  created_at: string
  updated_at: string
  form_fields?: any[]
  checklist_items?: any[]
  discount_config?: any
  raffle_config?: any
  wheel_config?: any
  event_config?: any
}


// Helpers para normalizar email text (\\n ↔ \n)
const uiEmailText = (str: string) => (str || '').replace(/\\n/g, '\n');

const dbEmailText = (str: string) => (str || '').replace(/\r\n/g, '\n');

// Normalizar variáveis antigas ({{name}} → {nome}, etc.)
const normalizeVariables = (text: string) => {
  if (!text) return text;
  return text
    .replace(/{{name}}/g, '{nome}')
    .replace(/{{link}}/g, '{link}')
    .replace(/{{numero}}/g, '{numero}')
    .replace(/{{premio}}/g, '{premio}');
};


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
    welcome_email_body: `Olá {nome},

Obrigado pelo teu interesse!

Aqui está o link para o teu e-book:
{link}

Podes fazer download a qualquer momento.

Melhores cumprimentos`,
    thank_you_message: 'Obrigado! O teu e-book está a ser enviado para o teu email.',
  },
  checklist: {
    capture_page_title: 'Descarrega a Checklist',
    capture_page_subtitle: 'Não percas nenhum passo importante',
    capture_page_button_text: 'Receber Checklist',
    welcome_email_subject: '✅ A tua checklist está pronta!',
    welcome_email_body: `Olá {nome},

Aqui está a checklist que pediste:
{link}

Usa-a para garantir que não esqueces nada!

Melhores cumprimentos`,
    thank_you_message: 'Perfeito! A checklist foi enviada para o teu email.',
  },
  wheel: {
    capture_page_title: 'Tenta a Tua Sorte na Roleta!',
    capture_page_subtitle: 'Gira e ganha um prémio exclusivo',
    capture_page_button_text: 'Girar Roleta',
    welcome_email_subject: '🎡 O teu resultado na roleta!',
    welcome_email_body: `Olá {nome},

Obrigado por participares na roleta!

O teu resultado foi: {premio}

Melhores cumprimentos`,
    thank_you_message: 'Parabéns! O teu resultado foi enviado para o teu email.',
  },
  desconto: {
    capture_page_title: 'Desconto Exclusivo à Espera',
    capture_page_subtitle: 'Preenche o formulário e recebe o teu código de desconto',
    capture_page_button_text: 'Receber Desconto',
    welcome_email_subject: '🎟️ O teu código de desconto!',
    welcome_email_body: `Olá {nome},

Obrigado pelo teu interesse!

Aqui está o teu código de desconto exclusivo:

{codigo}

Usa-o no checkout para ativar o desconto.

Melhores cumprimentos`,
    thank_you_message: 'Parabéns! O teu código de desconto está pronto. Copia-o acima!',
  },
  raffle: {
    capture_page_title: 'Participa no Sorteio',
    capture_page_subtitle: 'Preenche o formulário e tenta ganhar',
    capture_page_button_text: 'Participar',
    welcome_email_subject: '🎰 A tua participação no sorteio!',
    welcome_email_body: `Olá {nome},

Obrigado por participares no sorteio!

O teu número da sorte é: {numero}

Guarda este email — se fores o vencedor entraremos em contacto contigo.

Boa sorte!

Melhores cumprimentos`,
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
    event: true,
    capture: true,
    email: true,
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
    console.log('handleTypeChange typeId:', typeId)
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
      const isNew = magnet.id === 'NEW'
      const saveData = {
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
        show_download_button: magnet.show_download_button,
        download_button_text: magnet.download_button_text,
        form_fields: magnet.form_fields,
        checklist_items: magnet.checklist_items,
        discount_config: magnet.discount_config,
        raffle_config: magnet.raffle_config,
        wheel_config: magnet.wheel_config,
        event_config: magnet.event_config,
        updated_at: new Date().toISOString(),
      }

      let result
      if (isNew) {
        // Gera slug único
        const slug = await generateUniqueSlug(magnet.title)
        result = await supabase
          .from('lead_magnets')
          .insert({
            ...saveData,
            user_id: userId,
            slug: slug,
            created_at: new Date().toISOString(),
          })
          .select()
          .single()
      } else {
        result = await supabase
          .from('lead_magnets')
          .update(saveData)
          .eq('id', magnet.id)
          .eq('user_id', userId)
          .select()
          .single()
      }

      if (result.error) throw result.error

      setHasChanges(false)
      addToast('Lead magnet guardado com sucesso', 'success')
      
      // Se era novo, redireciona para o id real
      if (isNew && result.data) {
        setTimeout(() => {
          window.location.href = `/dashboard/lead-magnets/${result.data.id}`
        }, 500)
      }
    } catch (e) {
      console.error(e)
      addToast('Erro ao guardar lead magnet', 'error')
    } finally {
      setIsSaving(false)
    }
  }


  // Gera slug único: base-123a (3 dígitos + 1 letra)
  const generateUniqueSlug = async (title: string): Promise<string> => {
    const slugify = (str: string) => str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const base = slugify(title)
    
    for (let attempt = 0; attempt < 10; attempt++) {
      const num = Math.floor(Math.random() * 900) + 100 // 100-999
      const letter = String.fromCharCode(Math.floor(Math.random() * 26) + 97) // a-z
      const suffix = `${num}${letter}`
      const candidate = `${base}-${suffix}`
      
      // Verifica se já existe (global)
      const { data } = await supabase
        .from('lead_magnets')
        .select('id')
        .eq('slug', candidate)
        .single()
      
      if (!data) return candidate // Não existe, usa este
    }
    
    throw new Error('Não consegui gerar slug único após 10 tentativas')
  }


  const handleDuplicate = async () => {
    try {
      const { error } = await supabase
        .from('lead_magnets')
        .insert({
          user_id: userId,
          slug: await generateUniqueSlug(magnet.title),
          title: `${magnet.title} (cópia)`,
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

  if (magnet.magnet_type === 'webinar') {
    return (
      <div className={styles.container}>
        <div className={styles.editor}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div>
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '16px', marginBottom: '10px' }}>
                ← Voltar
              </button>
              <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 700 }}>🎥 {magnet.title}</h1>
              <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Webinar / Evento</p>
            </div>
            <button onClick={handleSave} disabled={isSaving} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, opacity: isSaving ? 0.6 : 1 }}>
              {isSaving ? '💾 Guardando...' : '💾 Guardar'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <div className={styles.section}>
                <button onClick={() => setShowSections(prev => ({ ...prev, event: !prev.event }))} className={styles.sectionToggle}>
                  <span>{showSections.event ? '▼' : '▶'}</span>
                  <h3>📅 Detalhes do Evento</h3>
                </button>
                {showSections.event && (
                  <div className={styles.sectionContent}>
                    <EventConfigurator config={(magnet as any).event_config || null} onChange={(cfg) => handleChange('event_config' as any, cfg)} />
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <button onClick={() => setShowSections(prev => ({ ...prev, capture: !prev.capture }))} className={styles.sectionToggle}>
                  <span>{showSections.capture ? '▼' : '▶'}</span>
                  <h3>🎯 Página de Captura</h3>
                </button>
                {showSections.capture && (
                  <div className={styles.sectionContent}>
                    <div className={styles.field}>
                      <label>Título</label>
                      <input type="text" value={magnet.capture_page_title} onChange={(e) => handleChange('capture_page_title', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Subtítulo</label>
                      <input type="text" value={magnet.capture_page_subtitle} onChange={(e) => handleChange('capture_page_subtitle', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Imagem</label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input type="text" value={magnet.capture_page_image || ''} onChange={(e) => handleChange('capture_page_image', e.target.value)} placeholder="URL da imagem" style={{ flex: 1 }} />
                        <button type="button" onClick={() => document.getElementById('webinar-image-input')?.click()} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          📷 Upload
                        </button>
                        {magnet.capture_page_image && (
                          <button type="button" onClick={() => handleChange('capture_page_image', '')} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', color: '#ef4444', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                            🗑
                          </button>
                        )}
                        <input id="webinar-image-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; const MAX_SIZE = 5 * 1024 * 1024; const sizeMB = (file.size / (1024 * 1024)).toFixed(2); if (file.size > MAX_SIZE) { alert(`❌ Imagem muito grande!\n\nTamanho: ${sizeMB}MB\nMáximo permitido: 5MB\n\nPor favor, redimensiona a imagem e tenta novamente.`); if (e.target) e.target.value = ''; return; } try { const formData = new FormData(); formData.append('file', file); formData.append('type', 'capture_page_image'); const res = await fetch('/api/lead-magnets/upload', { method: 'POST', body: formData, headers: { 'x-user-id': userId } }); const data = await res.json(); if (data.url) handleChange('capture_page_image', data.url); } catch (err) { console.error(err); } finally { if (e.target) e.target.value = ''; } }} />
                      </div>
                    </div>
                    <div className={styles.field}>
                      <label>Texto do Botão</label>
                      <input type="text" value={magnet.capture_page_button_text} onChange={(e) => handleChange('capture_page_button_text', e.target.value)} />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <button onClick={() => setShowSections(prev => ({ ...prev, email: !prev.email }))} className={styles.sectionToggle}>
                  <span>{showSections.email ? '▼' : '▶'}</span>
                  <h3>📧 Email de Confirmação</h3>
                </button>
                {showSections.email && (
                  <div className={styles.sectionContent}>
                    <div className={styles.field}>
                      <label>Assunto</label>
                      <input type="text" value={magnet.welcome_email_subject} onChange={(e) => handleChange('welcome_email_subject', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                      <label>Corpo do Email</label>
                      <textarea value={magnet.welcome_email_body} onChange={(e) => handleChange('welcome_email_body', e.target.value)} rows={8} />
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.section}>
                <button onClick={() => setShowSections(prev => ({ ...prev, success: !prev.success }))} className={styles.sectionToggle}>
                  <span>{showSections.success ? '▼' : '▶'}</span>
                  <h3>✅ Mensagem de Sucesso</h3>
                </button>
                {showSections.success && (
                  <div className={styles.sectionContent}>
                    <div className={styles.field}>
                      <label>Mensagem</label>
                      <textarea value={(magnet as any).success_message || ''} onChange={(e) => handleChange('success_message' as any, e.target.value)} rows={4} />
                    </div>
                    <div className={styles.field}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={(magnet as any).show_success_message !== false} onChange={(e) => handleChange('show_success_message' as any, e.target.checked)} style={{ width: 18, height: 18 }} />
                        <span>Mostrar mensagem de sucesso</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div style={{ position: 'sticky', top: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px', fontWeight: 600 }}>👁️ Preview</h3>
                <div style={{ background: '#1e293b', borderRadius: '12px', padding: '20px', border: '1px solid #334155', minHeight: '600px' }}>
                  {magnet.capture_page_image && <img src={magnet.capture_page_image} alt="Event" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px', maxHeight: '200px', objectFit: 'cover' }} />}
                  <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#fff' }}>{magnet.capture_page_title || 'Título'}</h2>
                  <p style={{ margin: '0 0 15px 0', color: '#cbd5e1', fontSize: '14px' }}>{magnet.capture_page_subtitle || 'Subtítulo'}</p>

                  {(magnet as any).event_config && (
                    <div style={{ background: '#0f172a', padding: '14px', borderRadius: '10px', border: '1px solid #334155', marginBottom: '14px' }}>
                      <div style={{ fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase', color: '#94a3b8', marginBottom: 8 }}>
                        Detalhes do Evento
                      </div>

                      {(magnet as any).event_config.eventType && (
                        <div style={{ color: '#e2e8f0', fontSize: 13, marginBottom: 6 }}>
                          <strong>Tipo:</strong> {(magnet as any).event_config.eventType}
                        </div>
                      )}

                      {(magnet as any).event_config.timezone && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Timezone:</strong> {(magnet as any).event_config.timezone}
                        </div>
                      )}

                      {((magnet as any).event_config.startAt || (magnet as any).event_config.startTime) && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Início:</strong> {(magnet as any).event_config.startAt || '—'} {(magnet as any).event_config.startTime ? `às ${(magnet as any).event_config.startTime}` : ''}
                        </div>
                      )}

                      {((magnet as any).event_config.endAt || (magnet as any).event_config.endTime) && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Fim:</strong> {(magnet as any).event_config.endAt || '—'} {(magnet as any).event_config.endTime ? `às ${(magnet as any).event_config.endTime}` : ''}
                        </div>
                      )}

                      {(magnet as any).event_config.locationType && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Local:</strong> {(magnet as any).event_config.locationType === 'online' ? 'Online' : 'Presencial'}
                        </div>
                      )}

                      {(magnet as any).event_config.joinUrl && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Link:</strong> {(magnet as any).event_config.joinUrl}
                        </div>
                      )}

                      {(magnet as any).event_config.address && (
                        <div style={{ color: '#cbd5e1', fontSize: 13, marginBottom: 6 }}>
                          <strong>Morada:</strong> {(magnet as any).event_config.address}
                        </div>
                      )}

                      {((magnet as any).event_config.capacity !== undefined && (magnet as any).event_config.capacity !== null && (magnet as any).event_config.capacity !== '') && (
                        <div style={{ color: '#cbd5e1', fontSize: 13 }}>
                          <strong>Capacidade:</strong> {(magnet as any).event_config.capacity}
                        </div>
                      )}
                    </div>
                  )}

                  <button style={{ width: '100%', padding: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600 }}>
                    {magnet.capture_page_button_text || 'Registar-me'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
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

          {magnet.magnet_type === 'discount' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🎟️ Configuração do Desconto</h3>
              <DiscountConfigurator
                config={magnet.discount_config || null}
                onChange={(cfg) => handleChange('discount_config' as any, cfg)}
              />
            </div>
          )}

          {magnet.magnet_type === 'wheel' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>🎡 Configuração da Roda</h3>
              <WheelConfigurator
                config={magnet.wheel_config || null}
                onChange={(cfg) => handleChange('wheel_config' as any, cfg)}
              />
            </div>
          )}

          {magnet.magnet_type === 'form' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>📋 Configuração do Formulário</h3>
              <FormConfigurator
                config={magnet.form_fields || null}
                onChange={(fields) => handleChange('form_fields' as any, fields)}
              />
            </div>
          )}

          {magnet.magnet_type === 'checklist' && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>✅ Itens da Checklist</h3>
              <ChecklistConfigurator
                config={magnet.form_fields || null}
                onChange={(items) => handleChange('form_fields' as any, items)}
              />
            </div>
          )}

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>📨 Remetente (Cartão)</h3>

            <div className={styles.field}>
              <label>Escolhe o cartão que vai enviar os emails desta campanha</label>
              <select
                value={magnet.card_id || ''}
                onChange={(e) => handleChange('card_id', e.target.value || null)}
                style={{
                  width: '100%',
                  minHeight: '48px',
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.07)',
                  color: '#fff',
                  outline: 'none',
                  fontSize: '14px',
                  lineHeight: '1.4',
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
                        
                        const MAX_SIZE = 5 * 1024 * 1024 // 5MB
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
                        
                        // Validar tamanho
                        if (file.size > MAX_SIZE) {
                          alert(`❌ Imagem muito grande!\n\nTamanho: ${sizeMB}MB\nMáximo permitido: 5MB\n\nPor favor, redimensiona a imagem e tenta novamente.`)
                          if (e.target) e.target.value = ''
                          return
                        }
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
                        
                        const MAX_SIZE = 5 * 1024 * 1024 // 5MB
                        const sizeMB = (file.size / (1024 * 1024)).toFixed(2)
                        
                        // Validar tamanho
                        if (file.size > MAX_SIZE) {
                          alert(`❌ Imagem muito grande!\n\nTamanho: ${sizeMB}MB\nMáximo permitido: 5MB\n\nPor favor, redimensiona a imagem e tenta novamente.`)
                          if (e.target) e.target.value = ''
                          return
                        }
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
                    value={uiEmailText(normalizeVariables(magnet.welcome_email_body))}
                    onChange={(e) => handleChange('welcome_email_body', normalizeVariables(dbEmailText(e.target.value)))}
                    placeholder="Use {nome}, {link}, {numero}, {premio} para variáveis dinâmicas"
                    rows={8}
                  />
                  <small style={{ opacity: 0.6, marginTop: 8, display: 'block' }}>
                    Variáveis: {'{nome}'}, {'{link}'}, {'{numero}'}, {'{premio}'}
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

                <div className={styles.field}>
                <div className={styles.field}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input
                      type="checkbox"
                      checked={magnet.show_success_message !== false}
                      onChange={(e) => handleChange('show_success_message', e.target.checked)}
                      style={{width:18,height:18,cursor:'pointer',accentColor:'#6366f1'}}
                    />
                    <span>Mostrar mensagem de sucesso</span>
                  </label>
                </div>

                                  <label>Mensagem de Sucesso (página pública)</label>
                  <textarea
                    value={magnet.success_message || ''}
                    onChange={(e) => handleChange('success_message', e.target.value)}
                    placeholder="Ex: O teu recurso está pronto para download."
                    rows={3}
                  />
                </div>

                <div className={styles.field}>
                  <label style={{fontSize: 12, color: '#64748b', marginTop: 12}}>Preview:</label>
                  <div style={{
                    padding: '12px 16px',
                    backgroundColor: '#1e293b',
                    borderRadius: '6px',
                    color: '#94a3b8',
                    fontSize: '14px',
                    minHeight: '40px',
                    border: '1px solid #334155'
                  }}>
                    {magnet.success_message || '(vazio)'}
                  </div>
                </div>

                <div className={styles.field}>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
                    <input
                      type="checkbox"
                      checked={magnet.show_download_button}
                      onChange={(e) => handleChange('show_download_button', e.target.checked)}
                      style={{width:18,height:18,cursor:'pointer',accentColor:'#6366f1'}}
                    />
                    <span>Mostrar botão de download</span>
                  </label>
                </div>

                {magnet.show_download_button && (
                  <div className={styles.field}>
                    <label>Texto do Botão</label>
                    <input
                      type="text"
                      value={magnet.download_button_text}
                      onChange={(e) => handleChange('download_button_text', e.target.value)}
                      placeholder="Ex: 📥 Fazer Download"
                    />
                  </div>
                )}
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
