'use client'

import { Theme } from '@/lib/defaultTheme'
import { defaultTheme } from '@/lib/defaultTheme'
import { HeaderBlock } from '@/components/blocks/HeaderBlock'

type BookingAction = {
  type: 'link' | 'whatsapp'
  label: string
  value: string
}

type Props = {
  settings: {
    title?: string
    description?: string
    action?: BookingAction
  }
  theme?: Partial<Theme>
}

export default function BookingBlock({ settings, theme }: Props) {
  const t: Theme = { ...defaultTheme, ...(theme || {}) }

  if (!settings?.action) return null

  const href =
    settings.action.type === 'whatsapp'
      ? `https://wa.me/${settings.action.value}`
      : settings.action.value

  return (
    <section style={{ marginTop: 48, textAlign: 'center' }}>
      {settings.title && (
        <h3
          style={{
            marginBottom: 12,
            color: t.mutedText,
          }}
        >
          {settings.title}
        </h3>
      )}

      {settings.description && (
        <p
          style={{
            marginBottom: 20,
            fontSize: 14,
            opacity: 0.8,
            color: t.text,
          }}
        >
          {settings.description}
        </p>
      )}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '14px 22px',
          borderRadius: 999,
          background: t.primary,
          color: '#fff',
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        {settings.action.label}
      </a>
    </section>
  )
}
