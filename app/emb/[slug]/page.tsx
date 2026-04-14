import { getAmbassadorBySlug } from '@/lib/ambassadors/ambassadorService'
import { notFound } from 'next/navigation'

interface AmbassadorPageProps {
  params: { slug: string }
}

export default async function AmbassadorPage({ params }: AmbassadorPageProps) {
  let ambassador
  try {
    ambassador = await getAmbassadorBySlug(params.slug)
  } catch (error) {
    notFound()
  }

  if (!ambassador) {
    notFound()
  }

  // Aplicar settings de crop ao cover
  const coverStyle: React.CSSProperties = {
    width: '100%',
    height: 300,
    backgroundColor: ambassador.background_color || '#ffffff',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    overflow: 'hidden',
  }

  if (ambassador.cover_url && ambassador.cover_settings) {
    const { positionX, positionY, scale } = ambassador.cover_settings
    coverStyle.backgroundImage = `url(${ambassador.cover_url})`
    coverStyle.backgroundSize = `${scale * 100}%`
    coverStyle.backgroundPosition = `${positionX}% ${positionY}%`
  } else if (ambassador.cover_url) {
    coverStyle.backgroundImage = `url(${ambassador.cover_url})`
  }

  // Aplicar settings de crop ao avatar
  const avatarStyle: React.CSSProperties = {
    width: 120,
    height: 120,
    borderRadius: '50%',
    backgroundColor: '#e2e8f0',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '4px solid #ffffff',
    marginTop: -60,
    marginLeft: 24,
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Cover */}
      <div style={coverStyle} />

      {/* Avatar + Info */}
      <div style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 32 }}>
          {/* Avatar */}
          <div style={avatarStyle} />

          {/* Name & Bio */}
          <div style={{ padding: '0 24px', marginTop: 24 }}>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: ambassador.text_color || '#1e293b',
                margin: '0 0 8px 0',
                fontFamily: ambassador.font_family || 'system-ui, -apple-system, sans-serif',
              }}
            >
              {ambassador.name}
            </h1>

            {ambassador.bio && (
              <p
                style={{
                  fontSize: 16,
                  color: ambassador.bio_color || '#64748b',
                  margin: '0 0 16px 0',
                  lineHeight: 1.6,
                  fontFamily: ambassador.font_family || 'system-ui, -apple-system, sans-serif',
                }}
              >
                {ambassador.bio}
              </p>
            )}

            {/* Contact Info */}
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              {ambassador.email && (
                <a
                  href={`mailto:${ambassador.email}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  ✉️ Email
                </a>
              )}
              {ambassador.phone && (
                <a
                  href={`tel:${ambassador.phone}`}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  📱 Ligar
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 16,
              backgroundColor: '#f0fdf4',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: '#15803d' }}>
              {ambassador.stats_leads}
            </div>
            <div style={{ fontSize: 12, color: '#65a30d', marginTop: 4 }}>Leads Capturados</div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: '#fef3c7',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: '#d97706' }}>
              {ambassador.stats_deals_closed}
            </div>
            <div style={{ fontSize: 12, color: '#b45309', marginTop: 4 }}>Deals Fechados</div>
          </div>

          <div
            style={{
              padding: 16,
              backgroundColor: '#dbeafe',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0284c7' }}>
              {ambassador.stats_commission_paid}€
            </div>
            <div style={{ fontSize: 12, color: '#0369a1', marginTop: 4 }}>Comissão Paga</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const revalidate = 60
