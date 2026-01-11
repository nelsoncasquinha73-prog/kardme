'use client'

type Props = {
  phone?: string | null
  email?: string | null
}

export default function QuickActions({ phone, email }: Props) {
  if (!phone && !email) return null

  const cleanPhone = phone?.replace(/\D/g, '')

  return (
    <div style={wrapper}>
      {phone && (
        <a href={`tel:${cleanPhone}`} style={secondaryBtn}>
          <PhoneIcon />
          <span>Ligar</span>
        </a>
      )}

      {phone && (
        <a
          href={`https://wa.me/${cleanPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          style={whatsappBtn}
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      )}

      {email && (
        <a href={`mailto:${email}`} style={secondaryBtn}>
          <MailIcon />
          <span>Email</span>
        </a>
      )}
    </div>
  )
}

/* ===== ICONS ===== */

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor">
      <path d="M19.11 17.51c-.27-.14-1.62-.8-1.87-.9-.25-.09-.43-.14-.61.14-.18.27-.7.9-.86 1.08-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.12-.56.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29 0 1.34.98 2.64 1.12 2.82.14.18 1.93 2.95 4.68 4.13.65.28 1.15.45 1.54.57.65.21 1.24.18 1.71.11.52-.08 1.62-.66 1.85-1.3.23-.64.23-1.18.16-1.3-.07-.11-.25-.18-.52-.32z" />
      <path d="M16.04 2.67c-7.32 0-13.28 5.96-13.28 13.28 0 2.34.61 4.54 1.68 6.46L2.6 29.33l7.1-1.86a13.21 13.21 0 006.34 1.61c7.32 0 13.28-5.96 13.28-13.28S23.36 2.67 16.04 2.67zm0 24.01c-2.04 0-4.03-.55-5.77-1.59l-.41-.24-4.21 1.1 1.12-4.1-.27-.42a11.01 11.01 0 01-1.72-5.92c0-6.08 4.95-11.03 11.03-11.03 6.08 0 11.03 4.95 11.03 11.03 0 6.08-4.95 11.03-11.03 11.03z" />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.05-.24c1.12.37 2.33.57 3.59.57a1 1 0 011 1V21a1 1 0 01-1 1C10.3 22 2 13.7 2 3a1 1 0 011-1h3.5a1 1 0 011 1c0 1.26.2 2.47.57 3.59a1 1 0 01-.25 1.05l-2.2 2.15z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  )
}

/* ===== STYLES ===== */

const wrapper: React.CSSProperties = {
  position: 'fixed',
  bottom: 16,
  left: 16,
  right: 16,
  display: 'flex',
  gap: 12,
  zIndex: 100,
}

const whatsappBtn: React.CSSProperties = {
  flex: 1.2,
  padding: '14px 16px',
  borderRadius: 14,
  background: '#25D366',
  color: '#0b0b0f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 600,
  textDecoration: 'none',
  boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
}

const secondaryBtn: React.CSSProperties = {
  flex: 1,
  padding: '14px 16px',
  borderRadius: 14,
  background: '#111',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  fontWeight: 500,
  textDecoration: 'none',
}