import { getAmbassadorBySlugPublic } from '@/lib/ambassadors/ambassadorServiceServer'
import { notFound } from 'next/navigation'
import EmbContactForm from './EmbContactForm'
import { LanguageProvider } from '@/components/language/LanguageProvider'
import AmbassadorFloatingActions from '@/app/dashboard/crm/AmbassadorFloatingActions'

interface AmbassadorPageProps {
  params: Promise<{ slug: string }>
}

export default async function AmbassadorPage({ params }: AmbassadorPageProps) {
  const { slug } = await params
  
  let ambassador
  try {
    ambassador = await getAmbassadorBySlugPublic(slug)
  } catch (error) {
    console.error('[emb slug] Error fetching ambassador:', error)
    notFound()
  }

  if (!ambassador) {
    notFound()
  }

  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: 160,
    backgroundColor: ambassador.background_color || '#1e293b',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
    borderRadius: '12px 12px 0 0',
  }

  if (ambassador.cover_url && ambassador.cover_settings) {
    const { positionX, positionY, scale } = ambassador.cover_settings
    coverStyle.backgroundImage = `url(${ambassador.cover_url})`
    coverStyle.backgroundSize = `${scale * 100}%`
    coverStyle.backgroundPosition = `${positionX}% ${positionY}%`
  } else if (ambassador.cover_url) {
    coverStyle.backgroundImage = `url(${ambassador.cover_url})`
  }

  const avatarStyle: React.CSSProperties = {
    width: 100,
    height: 100,
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '4px solid #1e293b',
    overflow: 'hidden',
  }

  if (ambassador.avatar_url && ambassador.avatar_settings) {
    const { positionX, positionY, scale } = ambassador.avatar_settings
    avatarStyle.backgroundImage = `url(${ambassador.avatar_url})`
    avatarStyle.backgroundSize = `${scale * 100}%`
    avatarStyle.backgroundPosition = `${positionX}% ${positionY}%`
  } else if (ambassador.avatar_url) {
    avatarStyle.backgroundImage = `url(${ambassador.avatar_url})`
  }

  // Card background color from ambassador settings
  const cardBackgroundColor = ambassador.background_color || '#1e293b'

  return (
    <LanguageProvider>
      <AmbassadorFloatingActions
        ambassadorUrl={`https://kardme.com/emb/${slug}`}
        ambassadorSlug={slug}
      />
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 700, backgroundColor: cardBackgroundColor, borderRadius: 12, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        {/* Cover */}
        <div style={coverStyle} />

        {/* Content */}
        <div style={{ padding: '0 32px 32px', textAlign: 'center', position: 'relative' }}>
          {/* Avatar */}
          <div style={{ ...avatarStyle, margin: '-50px auto 16px', position: 'relative', zIndex: 10 }} />

          {/* Name */}
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f1f5f9', margin: '0 0 24px 0' }}>
            {ambassador.name}
          </h1>

          {/* Bio */}
          {ambassador.bio && (
            <p style={{ fontSize: 14, color: '#cbd5e1', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              {ambassador.bio}
            </p>
          )}

          {/* Contact Buttons */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, justifyContent: 'center', flexWrap: 'wrap' }}>
            {ambassador.email && (
              <a
                href={`mailto:${ambassador.email}`}
                style={{
                  flex: '1 1 auto',
                  minWidth: 140,
                  padding: '12px 16px',
                  backgroundColor: '#94a3b8',
                  color: '#1e293b',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                ✉️ Email
              </a>
            )}
            {ambassador.phone && (
              <a
                href={`tel:${ambassador.phone}`}
                style={{
                  flex: '1 1 auto',
                  minWidth: 140,
                  padding: '12px 16px',
                  backgroundColor: '#94a3b8',
                  color: '#1e293b',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                📞 Ligar
              </a>
            )}
          </div>

          {/* Contact Form */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#cbd5e1', marginBottom: 16, textAlign: 'left' }}>
              Deixe seu contacto
            </h3>
            <EmbContactForm 
              slug={slug} 
              ambassadorEmail={ambassador.email || ''} 
              ambassadorName={ambassador.name || ''}
              customFields={ambassador.custom_fields || []}
              defaultFields={ambassador.default_fields || [
                { id: 'name', label: 'Nome', type: 'text', required: true, enabled: true },
                { id: 'email', label: 'Email', type: 'email', required: true, enabled: true },
                { id: 'phone', label: 'Telefone', type: 'tel', required: false, enabled: true },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'fixed', bottom: 16, right: 16, fontSize: 12, color: '#64748b' }}>
        Powered by Kardme
      </div>
    </div>
    </LanguageProvider>
  )
}

export const revalidate = 60
