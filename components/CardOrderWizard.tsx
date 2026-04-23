'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CardOrderWizard.module.css'

interface CardOrder {
  id: string
  slug: string
  status: string
  nome?: string
  empresa?: string
  cargo?: string
  email?: string
  telefone?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  linkedin?: string
  youtube?: string
  website?: string
  outros_links?: Array<{ label: string; url: string }>
  bio?: string
  slogan?: string
  foto_perfil?: string
  fotos_galeria?: string[]
  cores_preferidas?: { colors?: string[]; pantone?: string }
  notas_estilo?: string
}

interface Props {
  slug: string
  initialOrder?: CardOrder
}

export default function CardOrderWizard({ slug, initialOrder }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [order, setOrder] = useState<CardOrder>(
    initialOrder || {
      id: '',
      slug,
      status: 'rascunho',
      outros_links: [],
      fotos_galeria: [],
      cores_preferidas: { colors: ['#0b1220', '#3b82f6', '#ffffff'], pantone: '' },
      notas_estilo: '',
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    if (!unsavedChanges) return

    const timer = setTimeout(async () => {
      setSaving(true)
      try {
        const res = await fetch(`/api/card-orders/${slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        })
        if (!res.ok) throw new Error('Erro ao guardar')
        setUnsavedChanges(false)
      } catch (err) {
        console.error('Auto-save error:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [order, unsavedChanges, slug])

  const handleChange = (field: string, value: any) => {
    setOrder((prev) => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
  }

  const handleFotoPerfilUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('slug', slug)
      formData.append('type', 'perfil')

      const res = await fetch('/api/card-orders/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'Erro ao fazer upload')
      }

      const { url } = await res.json()
      handleChange('foto_perfil', url)
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const handleFotosGaleriaUpload = async (files: FileList) => {
    setUploading(true)
    setUploadError(null)
    try {
      const urls: string[] = []
      for (let i = 0; i < Math.min(files.length, 10); i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append('file', file)
        formData.append('slug', slug)
        formData.append('type', 'galeria')

        const res = await fetch('/api/card-orders/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const { error } = await res.json()
          throw new Error(error || 'Erro ao fazer upload')
        }

        const { url } = await res.json()
        urls.push(url)
      }

      handleChange('fotos_galeria', [...(order.fotos_galeria || []), ...urls])
    } catch (err: any) {
      setUploadError(err.message || 'Erro ao fazer upload')
    } finally {
      setUploading(false)
    }
  }

  const removeGaleriaFoto = (index: number) => {
    const newGaleria = (order.fotos_galeria || []).filter((_, i) => i !== index)
    handleChange('fotos_galeria', newGaleria)
  }

  const handleOtrosLinksChange = (index: number, field: string, value: string) => {
    const newLinks = [...(order.outros_links || [])]
    newLinks[index] = { ...newLinks[index], [field]: value }
    handleChange('outros_links', newLinks)
  }

  const addOutroLink = () => {
    handleChange('outros_links', [...(order.outros_links || []), { label: '', url: '' }])
  }

  const removeOutroLink = (index: number) => {
    const newLinks = (order.outros_links || []).filter((_, i) => i !== index)
    handleChange('outros_links', newLinks)
  }

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (stepNum === 1) {
      if (!order.nome?.trim()) newErrors.nome = 'Nome obrigatório'
      if (!order.email?.trim()) newErrors.email = 'Email obrigatório'
      if (order.email && !order.email.includes('@')) newErrors.email = 'Email inválido'
    }

    if (stepNum === 3) {
      if ((order.bio || '').length > 600) newErrors.bio = 'Bio muito longa (máx 600 caracteres)'
      if ((order.slogan || '').length > 120) newErrors.slogan = 'Slogan muito longo (máx 120 caracteres)'
    }

    if (stepNum === 4) {
      if (!order.foto_perfil) newErrors.foto_perfil = 'Foto de perfil obrigatória'
      const colors = order.cores_preferidas?.colors || []
      if (!colors[0]) newErrors.color0 = 'Cor de fundo obrigatória'
      if (!colors[1]) newErrors.color1 = 'Cor de destaque obrigatória'
      if (!colors[2]) newErrors.color2 = 'Cor de texto obrigatória'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/card-orders/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) throw new Error('Erro ao submeter')
      router.push(`/card-orders/${slug}/sucesso`)
    } catch (err) {
      console.error('Submit error:', err)
      setErrors({ submit: 'Erro ao submeter. Tenta novamente.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [unsavedChanges])

  const progressPercent = (step / 4) * 100
  const colors = order.cores_preferidas?.colors || ['#0b1220', '#3b82f6', '#ffffff']

  const setColorAt = (index: number, value: string) => {
    const next = [...colors]
    next[index] = value
    handleChange('cores_preferidas', { ...order.cores_preferidas, colors: next })
  }

  const socialExamples: Record<string, string> = {
    instagram: '@sofia.ferreira',
    facebook: 'Sofia Ferreira',
    tiktok: '@sofiaferreira',
    linkedin: 'linkedin.com/in/sofiaferreira',
    youtube: '@sofiaferreira',
    website: 'https://sofiaferreira.com',
  }

  const colorPresets = [
    { name: 'Clássico', colors: ['#0b1220', '#3b82f6', '#ffffff'] },
    { name: 'Quente', colors: ['#fef3c7', '#dc2626', '#1f2937'] },
    { name: 'Fresco', colors: ['#e0f2fe', '#0284c7', '#0f172a'] },
    { name: 'Minimalista', colors: ['#ffffff', '#000000', '#6b7280'] },
    { name: 'Premium', colors: ['#1f2937', '#fbbf24', '#f3f4f6'] },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pedido de Cartão</h1>
        <div className={styles.status}>
          {order.status === 'rascunho' && <span className={styles.badge}>Rascunho</span>}
          {order.status === 'submetido' && <span className={styles.badge + ' ' + styles.submitted}>Submetido</span>}
          {saving && <span className={styles.saving}>A guardar...</span>}
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
      </div>
      <p className={styles.stepIndicator}>Passo {step} de 4</p>

      <div className={styles.content}>
        {step === 1 && (
          <div className={styles.step}>
            <h2>Identidade</h2>

            <div className={styles.field}>
              <label>Nome *</label>
              <input
                type="text"
                value={order.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Sofia Ferreira"
                className={errors.nome ? styles.error : ''}
              />
              {errors.nome && <span className={styles.errorMsg}>{errors.nome}</span>}
            </div>

            <div className={styles.field}>
              <label>Empresa</label>
              <input
                type="text"
                value={order.empresa || ''}
                onChange={(e) => handleChange('empresa', e.target.value)}
                placeholder="Century 21 Lisboa"
              />
            </div>

            <div className={styles.field}>
              <label>Cargo / Profissão</label>
              <input
                type="text"
                value={order.cargo || ''}
                onChange={(e) => handleChange('cargo', e.target.value)}
                placeholder="Consultora Imobiliária"
              />
            </div>

            <div className={styles.field}>
              <label>Email *</label>
              <input
                type="email"
                value={order.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="sofia@century21.pt"
                className={errors.email ? styles.error : ''}
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label>Telefone</label>
              <input
                type="tel"
                value={order.telefone || ''}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="+351 912 345 678"
              />
            </div>

            <div className={styles.field}>
              <label>WhatsApp</label>
              <input
                type="tel"
                value={order.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+351 912 345 678"
              />
              <small>O WhatsApp é o melhor contacto para dúvidas durante a produção.</small>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h2>Links</h2>

            <div className={styles.linksGrid}>
              {['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'website'].map((field) => (
                <div key={field} className={styles.field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  <input
                    type="text"
                    value={(order as any)[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    placeholder={socialExamples[field]}
                  />
                  <small>Se não tiveres, deixa em branco.</small>
                </div>
              ))}
            </div>

            <div className={styles.field}>
              <label>Outros Links</label>
              {(order.outros_links || []).map((link, idx) => (
                <div key={idx} className={styles.linkRow}>
                  <input
                    type="text"
                    placeholder="Catálogo, Portfólio, etc"
                    value={link.label}
                    onChange={(e) => handleOtrosLinksChange(idx, 'label', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="https://..."
                    value={link.url}
                    onChange={(e) => handleOtrosLinksChange(idx, 'url', e.target.value)}
                  />
                  <button onClick={() => removeOutroLink(idx)} className={styles.removeBtn} type="button">
                    ✕
                  </button>
                </div>
              ))}
              <button onClick={addOutroLink} className={styles.addBtn} type="button">
                + Adicionar link
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <h2>Texto</h2>

            <div className={styles.field}>
              <label>Bio</label>
              <small>
                Texto curto para aparecer no cartão. Diz quem és, o que fazes e para quem (em 2–4 frases). Opcional.
              </small>
              <textarea
                value={order.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value.slice(0, 600))}
                placeholder="Ajudo famílias a encontrar a casa certa em Lisboa, com acompanhamento completo do início ao fim. Atendimento rápido por WhatsApp."
                rows={5}
                className={errors.bio ? styles.error : ''}
              />
              <div className={styles.counter}>{(order.bio || '').length} / 600 caracteres</div>
              {errors.bio && <span className={styles.errorMsg}>{errors.bio}</span>}
            </div>

            <div className={styles.field}>
              <label>Slogan / Quote</label>
              <small>
                Frase curta de impacto (opcional). Pode ser promessa, posicionamento ou lema.
              </small>
              <input
                type="text"
                value={order.slogan || ''}
                onChange={(e) => handleChange('slogan', e.target.value.slice(0, 120))}
                placeholder="A tua próxima casa começa aqui."
                maxLength={120}
                className={errors.slogan ? styles.error : ''}
              />
              <div className={styles.counter}>{(order.slogan || '').length} / 120 caracteres</div>
              {errors.slogan && <span className={styles.errorMsg}>{errors.slogan}</span>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.step}>
            <h2>Fotos + Cores</h2>

            {uploadError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
                {uploadError}
              </div>
            )}

            <div className={styles.field}>
              <label>Foto de Perfil / Logotipo *</label>
              <small>Recomendado: foto nítida, de frente, fundo simples. Se for logotipo, envia em boa qualidade.</small>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFotoPerfilUpload(e.target.files[0])}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                <p>{uploading ? 'A enviar...' : 'Clica para selecionar'}</p>
              </div>
              {order.foto_perfil && (
                <div style={{ marginTop: 16 }}>
                  <div style={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                  }}>
                    <img
                      src={order.foto_perfil}
                      alt="Perfil"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                      }}
                    />
                    <button
                      onClick={() => handleChange('foto_perfil', null)}
                      type="button"
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>✓ Foto enviada com sucesso</p>
                </div>
              )}
              {errors.foto_perfil && <span className={styles.errorMsg}>{errors.foto_perfil}</span>}
            </div>

            <div className={styles.field}>
              <label>Fotos para Galeria</label>
              <small>Até 10 fotos (opcional). Ex: imóveis, equipa, espaço, produtos, etc.</small>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleFotosGaleriaUpload(e.target.files)}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                <p>{uploading ? 'A enviar...' : 'Clica para selecionar'}</p>
              </div>

              {(order.fotos_galeria || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Fotos enviadas ({order.fotos_galeria?.length || 0}/10):</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                    {(order.fotos_galeria || []).map((url, idx) => (
                      <div key={idx} style={{ position: 'relative' }}>
                        <img
                          src={url}
                          alt={`Galeria \${idx + 1}`}
                          style={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 6,
                            border: '1px solid #e5e7eb',
                          }}
                        />
                        <button
                          onClick={() => removeGaleriaFoto(idx)}
                          type="button"
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            width: 20,
                            height: 20,
                            cursor: 'pointer',
                            fontSize: 12,
                            fontWeight: 'bold',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Cores (2–3) *</label>
              <small>
                Escolhe as cores que gostarias de ver no cartão. A primeira é a cor base/fundo. Clica no quadrado para abrir o seletor de cores e mudar.
              </small>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Fundo/Base</label>
                  <input 
                    type="color" 
                    value={colors[0]} 
                    onChange={(e) => setColorAt(0, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title="Clica para mudar a cor"
                  />
                  {errors.color0 && <span className={styles.errorMsg}>{errors.color0}</span>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Destaque</label>
                  <input 
                    type="color" 
                    value={colors[1]} 
                    onChange={(e) => setColorAt(1, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title="Clica para mudar a cor"
                  />
                  {errors.color1 && <span className={styles.errorMsg}>{errors.color1}</span>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>Texto/Neutro</label>
                  <input 
                    type="color" 
                    value={colors[2]} 
                    onChange={(e) => setColorAt(2, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title="Clica para mudar a cor"
                  />
                  {errors.color2 && <span className={styles.errorMsg}>{errors.color2}</span>}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Ou escolhe um preset:</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => handleChange('cores_preferidas', { ...order.cores_preferidas, colors: preset.colors })}
                      type="button"
                      style={{
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: 6,
                        background: '#fff',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6'
                        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                        {preset.colors.map((color, i) => (
                          <div
                            key={i}
                            style={{
                              width: 16,
                              height: 16,
                              background: color,
                              borderRadius: 3,
                              border: '1px solid #e5e7eb',
                            }}
                          />
                        ))}
                      </div>
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.field}>
              <label>Pantone (opcional)</label>
              <input
                type="text"
                value={(order.cores_preferidas?.pantone || '')}
                onChange={(e) =>
                  handleChange('cores_preferidas', {
                    ...order.cores_preferidas,
                    pantone: e.target.value,
                  })
                }
                placeholder="Pantone 2025 C"
              />
            </div>

            <div className={styles.field}>
              <label>Notas de estilo (opcional)</label>
              <small>Se tens referências (ex: "minimalista", "luxo", "clean", "dark", "cores suaves"), escreve aqui.</small>
              <textarea
                value={order.notas_estilo || ''}
                onChange={(e) => handleChange('notas_estilo', e.target.value)}
                rows={3}
                placeholder="Ex: estilo premium, fundo escuro, detalhes em azul, tipografia moderna."
              />
            </div>
          </div>
        )}

        {errors.submit && <div className={styles.errorAlert}>{errors.submit}</div>}
      </div>

      <div className={styles.buttons}>
        {step > 1 && (
          <button onClick={handleBack} className={styles.btnSecondary} disabled={loading || uploading}>
            ← Voltar
          </button>
        )}
        {step < 4 && (
          <button onClick={handleNext} className={styles.btnPrimary} disabled={loading || saving || uploading}>
            Continuar →
          </button>
        )}
        {step === 4 && (
          <button onClick={handleSubmit} className={styles.btnSuccess} disabled={loading || saving || uploading}>{loading ? 'A submeter...' : 'Submeter Pedido'}
          </button>
        )}
      </div>
    </div>
  )
}
