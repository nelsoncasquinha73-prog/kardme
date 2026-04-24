'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import styles from './CardOrderDetail.module.css'

type Status = 'rascunho' | 'submetido' | 'em_producao' | 'concluido'

interface CardOrder {
  id: string
  slug: string
  status: Status
  nome?: string
  email?: string
  empresa?: string
  cargo?: string
  bio?: string
  foto_perfil?: string
  fotos_galeria?: string[]
  cores_preferidas?: { colors?: string[] }
  telefone?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  tiktok?: string
  linkedin?: string
  youtube?: string
  website?: string
  outros_links?: Array<{ label?: string; url: string }>
  slogan?: string
  created_at?: string
  updated_at?: string
}

const displayUrl = (url?: string) => {
  if (!url) return '—'
  try {
    const u = new URL(url)
    const host = u.host.replace(/^www\./, '')
    const path = (u.pathname || '').replace(/\/$/, '')
    const shortPath = path.length > 28 ? path.slice(0, 28) + '…' : path
    const q = u.search ? '…' : ''
    return host + (shortPath && shortPath !== '/' ? shortPath : '') + q
  } catch {
    // fallback se não for URL válida
    return url.length > 48 ? url.slice(0, 48) + '…' : url
  }
}

export default function CardOrderDetailPage() {
  const params = useParams()
  const slug = params?.slug as string

  const [order, setOrder] = useState<CardOrder | null>(null)
  const [status, setStatus] = useState<Status>('rascunho')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyField = async (key: string, value?: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev))
      }, 1200)
    } catch (e) {
      console.error('Erro ao copiar:', e)
    }
  }


  const CopyBtn = ({ k, value }: { k: string; value?: string }) => (
    <button
      onClick={() => copyField(k, value)}
      style={{
        marginLeft: 8,
        width: 28,
        height: 28,
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.18)',
        background: 'rgba(255,255,255,0.06)',
        color: copiedKey === k ? '#34d399' : '#cbd5e1',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
      title={copiedKey === k ? 'Copiado' : 'Copiar'}
    >
      {copiedKey === k ? '✓' : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 3h7v7" />
          <path d="M10 14L21 3" />
          <path d="M21 14v7h-7" />
          <path d="M3 10V3h7" />
          <path d="M3 21h7" />
        </svg>
      )}
    </button>
  )

  useEffect(() => {
    if (!slug) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        setNotFound(false)

        const res = await fetch(`/api/admin/card-orders/${slug}`)
        if (res.status === 404) {
          setNotFound(true)
          setOrder(null)
          return
        }
        if (!res.ok) throw new Error('Erro ao carregar')

        const data = await res.json()
        setOrder(data)
        setStatus((data?.status as Status) || 'rascunho')
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [slug])

  const handleStatusChange = async (newStatus: Status) => {
    try {
      const res = await fetch(`/api/admin/card-orders/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Erro ao atualizar')
      const data = await res.json()
      setOrder(data)
      setStatus(data.status)
    } catch (err: any) {
      console.error('Erro:', err)
      alert('Erro ao atualizar status')
    }
  }

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <div style={{ padding: 24, color: '#9ca3af' }}>A carregar pedido...</div>
  }

  if (notFound) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: '#e5e7eb' }}>Pedido não encontrado.</p>
      </div>
    )
  }

  if (error) {
    return <div style={{ padding: 24, color: '#fca5a5' }}>Erro: {error}</div>
  }

  if (!order) {
    return <div style={{ padding: 24, color: '#fca5a5' }}>Erro: pedido vazio.</div>
  }

  const colors = order.cores_preferidas?.colors || []

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
        <div>
          <h1 className={styles.title}>{order.nome || 'Pedido'}</h1>
          <p className={styles.subtitle}>
            {order.email || '—'} • {order.slug}
          </p>
        </div>

        <div style={{
          padding: '6px 10px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'white',
          fontWeight: 600,
          fontSize: 13,
        }}>
          {status}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Identidade</h3>
          <p style={{ color: '#cbd5e1', margin: '6px 0' }}><strong>Empresa:</strong> {order.empresa || '—'}</p>
          <p style={{ color: '#cbd5e1', margin: '6px 0' }}><strong>Cargo:</strong> {order.cargo || '—'}</p>
        </div>

        <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Cores</h3>
          {colors.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>Sem cores definidas.</p>
          ) : (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {colors.map((c, idx) => (
                <div key={idx} title={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: '1px solid rgba(255,255,255,0.25)' }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {order.foto_perfil && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Foto de Perfil / Logo</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div
              onClick={() => setModalImage(order.foto_perfil!)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                borderRadius: 12,
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.15)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#60a5fa'
                e.currentTarget.style.boxShadow = '0 0 12px rgba(96, 165, 250, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <img
                src={order.foto_perfil}
                alt="Foto de perfil"
                style={{ width: 120, height: 120, objectFit: 'cover', display: 'block' }}
              />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: 'opacity 0.2s',
              }}>
                <span style={{ color: 'white', fontWeight: 600, fontSize: 12 }}>Clica para ampliar</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => downloadImage(order.foto_perfil!, `${order.slug}-perfil.jpg`)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                ⬇️ Baixar
              </button>
              <a
                href={order.foto_perfil}
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                🔗 Abrir
              </a>
            </div>
          </div>
        </div>
      )}

      {(order.fotos_galeria || []).length > 0 && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Galeria ({order.fotos_galeria?.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            {(order.fotos_galeria || []).map((url, idx) => (
              <div
                key={idx}
                onClick={() => setModalImage(url)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.15)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#60a5fa'
                  e.currentTarget.style.boxShadow = '0 0 8px rgba(96, 165, 250, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <img
                  src={url}
                  alt={`Foto ${idx + 1}`}
                  style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      
      {order.telefone || order.whatsapp || order.email ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Contactos</h3>
          {order.email && <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center' }}><strong style={{ marginRight: 6 }}>Email:</strong><span>{order.email}</span><CopyBtn k="email" value={order.email} /></p>}
          {order.telefone && <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center' }}><strong style={{ marginRight: 6 }}>Telefone:</strong><span>{order.telefone}</span><CopyBtn k="telefone" value={order.telefone} /></p>}
          {order.whatsapp && <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center' }}><strong style={{ marginRight: 6 }}>WhatsApp:</strong><span>{order.whatsapp}</span><CopyBtn k="whatsapp" value={order.whatsapp} /></p>}
        </div>
      ) : null}

      {order.instagram || order.facebook || order.tiktok || order.linkedin || order.youtube || order.website || (order.outros_links && order.outros_links.length > 0) ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Links</h3>
          {order.website && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>Website:</strong> <a href={order.website} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.website)}</a></span>
              <button onClick={() => copyField('website', order.website)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.instagram && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>Instagram:</strong> <a href={order.instagram} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.instagram)}</a></span>
              <button onClick={() => copyField('instagram', order.instagram)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.facebook && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>Facebook:</strong> <a href={order.facebook} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.facebook)}</a></span>
              <button onClick={() => copyField('facebook', order.facebook)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.tiktok && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>TikTok:</strong> <a href={order.tiktok} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.tiktok)}</a></span>
              <button onClick={() => copyField('tiktok', order.tiktok)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.linkedin && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>LinkedIn:</strong> <a href={order.linkedin} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.linkedin)}</a></span>
              <button onClick={() => copyField('linkedin', order.linkedin)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.youtube && (
            <p style={{ color: '#cbd5e1', margin: '6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span><strong>YouTube:</strong> <a href={order.youtube} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{displayUrl(order.youtube)}</a></span>
              <button onClick={() => copyField('youtube', order.youtube)} style={{ padding: '4px 8px', fontSize: 12, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>{copiedKey ? '📋' : '📋'}</button>
            </p>
          )}
          {order.outros_links && order.outros_links.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <strong style={{ color: '#cbd5e1' }}>Outros Links:</strong>
              <ul style={{ margin: '8px 0 0 20px', color: '#cbd5e1' }}>
                {order.outros_links.map((link: any, idx: number) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>{link.label || link.url}</a>
                    <button onClick={() => copyField(`outro_${idx}`, link.url)} style={{ padding: '2px 6px', fontSize: 11, background: 'rgba(96,165,250,0.2)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 3, cursor: 'pointer' }}>{copiedKey ? '📋' : '📋'}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}

      {order.slogan || order.bio ? (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
          <h3 style={{ marginTop: 0, color: 'white' }}>Texto</h3>
          {order.slogan && <p style={{ color: '#cbd5e1', margin: '6px 0', fontWeight: 600, display: 'flex', alignItems: 'center' }}><strong style={{ marginRight: 6 }}>Slogan:</strong><span>{order.slogan}</span><CopyBtn k="slogan" value={order.slogan} /></p>}
          {order.bio && <div style={{ color: '#cbd5e1', margin: '12px 0 0 0', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}><strong>Bio:</strong><br/>{order.bio}</div>}
        </div>
      ) : null}

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}>
        <h3 style={{ marginTop: 0, color: 'white', marginBottom: 16 }}>Status</h3>
        <div className={styles.selectWrap}>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as Status)}
            className={styles.statusSelect}
          >
            <option className={styles.statusOption} value="rascunho">Rascunho</option>
            <option className={styles.statusOption} value="submetido">Submetido</option>
            <option className={styles.statusOption} value="em_producao">Em Produção</option>
            <option className={styles.statusOption} value="concluido">Concluído</option>
          </select>
          <span className={styles.chevron}>▾</span>
        </div>
      </div>

      {modalImage && (
        <div
          onClick={() => setModalImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
            }}
          >
            <img
              src={modalImage}
              alt="Ampliada"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                borderRadius: 12,
              }}
            />
            <button
              onClick={() => setModalImage(null)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.7)',
                border: 'none',
                color: 'white',
                fontSize: 18,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              ✕
            </button>
            <button
              onClick={() => {
                const filename = modalImage.split('/').pop() || 'imagem.jpg'
                downloadImage(modalImage, filename)
              }}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                padding: '8px 12px',
                borderRadius: 8,
                background: 'rgba(0,0,0,0.7)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              ⬇️ Baixar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
