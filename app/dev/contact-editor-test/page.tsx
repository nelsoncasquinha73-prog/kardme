'use client'

import React, { useState } from 'react'
import ContactBlockEditor from '@/components/dashboard/block-editors/ContactBlockEditor'
import ContactBlock from '@/components/blocks/ContactBlock'
import { LanguageProvider } from '@/components/language/LanguageProvider'

export default function ContactEditorTestPage() {
  const [settings, setSettings] = useState<any>({
    heading: 'Contactos',
    layout: { direction: 'row', align: 'center', gapPx: 10 },
    items: {
      phone: { enabled: true, label: 'Ligar', value: '+351 912 345 678' },
      email: { enabled: true, label: 'Email', value: 'teste@kardme.com' },
      whatsapp: { enabled: true, label: 'WhatsApp', value: '+351 912 345 678' },
      telegram: { enabled: false, label: 'Telegram', value: '@kardme' },
    },
  })

  const [style, setStyle] = useState<any>({
    showLabel: true,
    uniformButtons: true,
    uniformWidthPx: 160,
    uniformHeightPx: 52,
    uniformContentAlign: 'center',
    headingAlign: 'left',
    headingBold: true,
    headingFontSize: 13,
    container: { bgColor: '#ffffff', padding: 16, radius: 14, shadow: false, borderWidth: 1, borderColor: '#e5e7eb' },
    buttonDefaults: {
      sizePx: 44,
      radius: 14,
      bgMode: 'solid',
      bgColor: '#ffffff',
      borderEnabled: true,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.10)',
      iconColor: '#111827',
      textColor: '#111827',
      fontWeight: 800,
      labelFontSize: 13,
      paddingY: 10,
      paddingX: 12,
      iconScale: 0.58,
      shadow: false,
    },
    buttons: {},
  })

  return (
    <LanguageProvider>
      <div
        style={{
          minHeight: '100vh',
          padding: 24,
          background: '#f3f4f6',
          display: 'grid',
          gridTemplateColumns: '420px 1fr',
          gap: 18,
          alignItems: 'start',
        }}
      >
        <div style={{ position: 'sticky', top: 12 }}>
          <ContactBlockEditor
            settings={settings}
            style={style}
            onChangeSettings={setSettings}
            onChangeStyle={setStyle}
          />
        </div>

        <div
          style={{
            background: '#fff',
            borderRadius: 18,
            padding: 18,
            border: '1px solid rgba(0,0,0,0.08)',
            maxWidth: 520,
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 10 }}>Preview</div>
          <ContactBlock settings={settings} style={style} />
        </div>
      </div>
    </LanguageProvider>
  )
}
