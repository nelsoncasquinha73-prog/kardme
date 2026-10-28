'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import styles from './CardOrderWizard.module.css'
import { cardOrderTranslations } from '@/lib/i18n/cardOrder'

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

type Language = 'pt-PT' | 'pt-BR' | 'en' | 'it' | 'de' | 'es' | 'fr' | 'ar'

interface Props {
  slug: string
  initialOrder?: CardOrder
  accessToken?: string
  language?: string
}

export default function CardOrderWizard({
  slug,
  initialOrder,
  accessToken,
  language = 'pt-PT',
}: Props) {
  const initialLanguage: Language =
    (['pt-PT', 'pt-BR', 'en', 'it', 'de', 'es', 'fr', 'ar'] as string[])
      .includes(language)
      ? language as Language
      : 'pt-PT'

  const [currentLanguage, setCurrentLanguage] =
    useState<Language>(initialLanguage)
  const t = cardOrderTranslations[
    currentLanguage === 'it' ? 'it' : 'pt-PT'
  ]
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
      foto_perfil: undefined,
      outros_links: [],
      fotos_galeria: [],
      cores_preferidas: { colors: [], pantone: '' },
    }
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const saveQueue = useRef<Promise<void>>(Promise.resolve())
  const editVersion = useRef(0)

  const saveOrder = (snapshot: CardOrder) => {
    const version = editVersion.current

    const task = saveQueue.current.catch(() => {}).then(async () => {
      setSaving(true)
      try {
        const res = await fetch(`/api/card-orders/${slug}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { 'x-card-order-token': accessToken } : {}),
          },
          body: JSON.stringify(snapshot),
        })

        if (!res.ok) {
          const details = await res.json().catch(() => ({}))
          throw new Error(
            `Erro ao guardar (HTTP ${res.status}): ${details.error || 'Erro desconhecido'}`
          )
        }

        if (editVersion.current === version) {
          setUnsavedChanges(false)
        }
      } finally {
        setSaving(false)
      }
    })

    saveQueue.current = task
    return task
  }

  useEffect(() => {
    if (!unsavedChanges || loading) return

    const timer = setTimeout(() => {
      void saveOrder(order).catch(err => {
        console.error('Auto-save error:', err)
      })
    }, 1000)

    return () => clearTimeout(timer)
  }, [order, unsavedChanges, slug, loading])

  const handleChange = (field: string, value: any) => {
    editVersion.current += 1
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
        throw new Error(error || t.uploadError)
      }

      const { url } = await res.json()
      handleChange('foto_perfil', url)
    } catch (err: any) {
      setUploadError(err.message || t.uploadError)
    } finally {
      setUploading(false)
    }
  }

  const handleFotosGaleriaUpload = async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
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
        throw new Error(error || t.uploadError)
      }

      const { url } = await res.json()
      handleChange('fotos_galeria', [...(order.fotos_galeria || []), url])
    } catch (err: any) {
      setUploadError(err.message || t.uploadError)
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
      if (!order.nome?.trim()) newErrors.nome = t.requiredName
      if (!order.email?.trim()) newErrors.email = t.requiredEmail
      if (order.email && !order.email.includes('@')) newErrors.email = t.invalidEmail
    }

    if (stepNum === 3) {
      if ((order.bio || '').length > 600) newErrors.bio = t.bioTooLong
      if ((order.slogan || '').length > 120) newErrors.slogan = t.sloganTooLong
    }

    if (stepNum === 4) {
      if (!order.foto_perfil) newErrors.foto_perfil = t.requiredPhoto

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
    if (!validateStep(4) || uploading || loading) return

    setLoading(true)
    setErrors({})

    try {
      // Aguarda gravações anteriores e guarda a versão mais recente.
      await saveOrder(order)

      const submitRes = await fetch(`/api/card-orders/${slug}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { 'x-card-order-token': accessToken } : {}),
        },
        body: JSON.stringify({ language: currentLanguage }),
      })

            if (!submitRes.ok) {
        throw new Error(t.submitError)
      }

      setUnsavedChanges(false)
      router.push(`/card-orders/${slug}/sucesso?lang=${encodeURIComponent(currentLanguage)}`)
    } catch (err) {
      console.error('Submit error:', err)
      setErrors({
        submit: t.submitError,
      })
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
  const colors = order.cores_preferidas?.colors || []

  const setColorAt = (index: number, value: string) => {
    const next = [
      colors[0] || '#0b1220',
      colors[1] || '#3b82f6',
      colors[2] || '#ffffff',
    ]
    next[index] = value
    handleChange('cores_preferidas', { ...order.cores_preferidas, colors: next })
  }

  const socialExamples: Record<string, string> = {
    instagram: '@nome.profissional',
    facebook: 'Nome Profissional',
    tiktok: '@nomeprofissional',
    linkedin: 'linkedin.com/in/nome-profissional',
    youtube: '@nomeprofissional',
    website: 'https://exemplo.com',
  }

  const colorPresets = [
    { name: currentLanguage === 'it' ? 'Classico' : 'Clássico', colors: ['#0b1220', '#3b82f6', '#ffffff'] },
    { name: currentLanguage === 'it' ? 'Caldo' : 'Quente', colors: ['#fef3c7', '#dc2626', '#1f2937'] },
    { name: currentLanguage === 'it' ? 'Fresco' : 'Fresco', colors: ['#e0f2fe', '#0284c7', '#0f172a'] },
    { name: currentLanguage === 'it' ? 'Minimalista' : 'Minimalista', colors: ['#ffffff', '#000000', '#6b7280'] },
    { name: 'Premium', colors: ['#1f2937', '#fbbf24', '#f3f4f6'] },
  ]

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginBottom: 16,
        }}>
          <select
            aria-label="Idioma / Language"
            value={currentLanguage}
            onChange={(e) =>
              setCurrentLanguage(e.target.value as Language)
            }
            style={{
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              background: '#fff',
              color: '#1e293b',
              fontSize: 14,
            }}
          >
            <option value="pt-PT">🇵🇹 Português</option>
            <option value="pt-BR">🇧🇷 Português (Brasil)</option>
            <option value="en">🇬🇧 English</option>
            <option value="it">🇮🇹 Italiano</option>
            <option value="de">🇩🇪 Deutsch</option>
            <option value="es">🇪🇸 Español</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>
        <h1>{t.title}</h1>
        <p style={{ color: '#64748b', margin: '8px 0 0', fontSize: 14 }}>
          {t.subtitle}
        </p>
        <div className={styles.status}>
          {order.status === 'rascunho' && <span className={styles.badge}>{t.draft}</span>}
          {order.status === 'submetido' && <span className={styles.badge + ' ' + styles.submitted}>{t.submitted}</span>}
          {saving && <span className={styles.saving}>{t.saving}</span>}
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progressPercent}%` }} />
      </div>
      <p className={styles.stepIndicator}>{t.step} {step} {t.of} 4</p>

      <div className={styles.content}>
        {step === 1 && (
          <div className={styles.step}>
            <h2>{t.identity}</h2>

            <div className={styles.field}>
              <label>{t.name} *</label>
              <input
                type="text"
                value={order.nome || ''}
                onChange={(e) => handleChange('nome', e.target.value)}
                placeholder="Nome completo"
                className={errors.nome ? styles.error : ''}
              />
              {errors.nome && <span className={styles.errorMsg}>{errors.nome}</span>}
            </div>

            <div className={styles.field}>
              <label>{t.company}</label>
              <input
                type="text"
                value={order.empresa || ''}
                onChange={(e) => handleChange('empresa', e.target.value)}
                placeholder={t.companyPlaceholder}
              />
            </div>

            <div className={styles.field}>
              <label>{t.role}</label>
              <input
                type="text"
                value={order.cargo || ''}
                onChange={(e) => handleChange('cargo', e.target.value)}
                placeholder={t.rolePlaceholder}
              />
            </div>

            <div className={styles.field}>
              <label>{t.email} *</label>
              <input
                type="email"
                value={order.email || ''}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="nome@exemplo.com"
                className={errors.email ? styles.error : ''}
              />
              {errors.email && <span className={styles.errorMsg}>{errors.email}</span>}
            </div>

            <div className={styles.field}>
              <label>{t.phone}</label>
              <input
                type="tel"
                value={order.telefone || ''}
                onChange={(e) => handleChange('telefone', e.target.value)}
                placeholder="+351 912 345 678"
              />
            </div>

            <div className={styles.field}>
              <label>WhatsApp</label>
              <button
                type="button"
                onClick={() => handleChange('whatsapp', order.telefone || '')}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#2563eb',
                  padding: '0 0 10px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {t.samePhone}
              </button>
              <input
                type="tel"
                value={order.whatsapp || ''}
                onChange={(e) => handleChange('whatsapp', e.target.value)}
                placeholder="+351 912 345 678"
              />
              <small>{t.whatsappHelp}</small>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <h2>{t.links}</h2>

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
                  <small>{t.optionalLink}</small>
                </div>
              ))}
            </div>

            <div className={styles.field}>
              <label>{t.otherLinks}</label>
              {(order.outros_links || []).map((link, idx) => (
                <div key={idx} className={styles.linkRow}>
                  <input
                    type="text"
                    placeholder={t.linkPlaceholder}
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
                + {t.addLink}
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <h2>{t.text}</h2>

            <div className={styles.field}>
              <label>Bio</label>
              <small>
                {t.bioHelp}
              </small>
              <textarea
                value={order.bio || ''}
                onChange={(e) => handleChange('bio', e.target.value.slice(0, 600))}
                placeholder={t.bioPlaceholder}
                rows={5}
                className={errors.bio ? styles.error : ''}
              />
              <div className={styles.counter}>{(order.bio || '').length} / 600 {t.characters}</div>
              {errors.bio && <span className={styles.errorMsg}>{errors.bio}</span>}
            </div>

            <div className={styles.field}>
              <label>{t.sloganHelp.split(" — ")[0]}</label>
              <small>
                {t.sloganHelp}
              </small>
              <input
                type="text"
                value={order.slogan || ''}
                onChange={(e) => handleChange('slogan', e.target.value.slice(0, 120))}
                placeholder={t.sloganPlaceholder}
                maxLength={120}
                className={errors.slogan ? styles.error : ''}
              />
              <div className={styles.counter}>{(order.slogan || '').length} / 120 {t.characters}</div>
              {errors.slogan && <span className={styles.errorMsg}>{errors.slogan}</span>}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className={styles.step}>
            <h2>{t.photosColors}</h2>

            {uploadError && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: 6, marginBottom: 20, fontSize: 14 }}>
                {uploadError}
              </div>
            )}

            <div className={styles.field}>
              <label>{t.profilePhoto} *</label>
              <small>{t.profileHelp}</small>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFotoPerfilUpload(e.target.files[0])}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                <p>{uploading ? t.uploading : t.selectFile}</p>
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
                  <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8 }}>✓ {t.photoSuccess}</p>
                </div>
              )}
              {errors.foto_perfil && <span className={styles.errorMsg}>{errors.foto_perfil}</span>}
            </div>

            <div className={styles.field}>
              <label>{t.gallery}</label>
              <small>{t.galleryHelp}</small>
              <div className={styles.uploadArea}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFotosGaleriaUpload(e.target.files[0])}
                  className={styles.fileInput}
                  disabled={uploading}
                />
                <p>{uploading ? t.uploading : t.selectFile}</p>
              </div>

              {(order.fotos_galeria || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{t.uploadedPhotos} ({order.fotos_galeria?.length || 0}/10):</p>
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
              <label>{t.colors} *</label>
                <button
                  type="button"
                  onClick={() => handleChange(
                    'notas_estilo',
                    [
                      order.notas_estilo || '',
                      ...(order.notas_estilo || '').includes(t.chooseForMeNote)
                        ? []
                        : [t.chooseForMeNote],
                    ].filter(Boolean).join('\n')
                  )}
                  style={{
                    border: 'none',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    marginBottom: 12,
                    fontWeight: 600,
                  }}
                >
                  {t.chooseForMe}
                </button>
              <small>
                {t.colorsHelp}
              </small>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>{t.background}</label>
                  <input 
                    type="color" 
                    value={colors[0] || '#0b1220'}
                    onChange={(e) => setColorAt(0, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title={t.colorPicker}
                  />
                  {errors.color0 && <span className={styles.errorMsg}>{errors.color0}</span>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>{t.accent}</label>
                  <input 
                    type="color" 
                    value={colors[1] || '#3b82f6'}
                    onChange={(e) => setColorAt(1, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title={t.colorPicker}
                  />
                  {errors.color1 && <span className={styles.errorMsg}>{errors.color1}</span>}
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600 }}>{t.neutral}</label>
                  <input 
                    type="color" 
                    value={colors[2] || '#ffffff'}
                    onChange={(e) => setColorAt(2, e.target.value)}
                    style={{ cursor: 'pointer', width: '100%', height: 50, border: '1px solid #d1d5db', borderRadius: 6 }}
                    title={t.colorPicker}
                  />
                  {errors.color2 && <span className={styles.errorMsg}>{errors.color2}</span>}
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{t.preset}</p>
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
              <label>{t.pantone}</label>
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
              <label>{t.styleNotes}</label>
              <small>{t.styleHelp}</small>
              <textarea
                value={order.notas_estilo || ''}
                onChange={(e) => handleChange('notas_estilo', e.target.value)}
                rows={3}
                placeholder={t.stylePlaceholder}
              />
            </div>
          </div>
        )}

        {errors.submit && <div className={styles.errorAlert}>{errors.submit}</div>}
      </div>

      <div className={styles.buttons}>
        {step > 1 && (
          <button onClick={handleBack} className={styles.btnSecondary} disabled={loading || uploading}>
            ← {t.back}
          </button>
        )}
        {step < 4 && (
          <button onClick={handleNext} className={styles.btnPrimary} disabled={loading || saving || uploading}>
            {t.next} →
          </button>
        )}
        {step === 4 && (
          <button onClick={handleSubmit} className={styles.btnSuccess} disabled={loading || saving || uploading}>{loading ? t.submitting : t.submit}
          </button>
        )}
      </div>
    </div>
  )
}
