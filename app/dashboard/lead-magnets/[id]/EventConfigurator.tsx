'use client'

import { useEffect, useState } from 'react'

export type EventConfig = {
  eventType: 'webinar' | 'presentation' | 'event'
  startAt: string
  endAt?: string
  timezone?: string
  locationType: 'online' | 'in_person'
  joinUrl?: string
  address?: string
  capacity?: number
  showCtaButton?: boolean
  ctaText?: string
  ctaUrl?: string
}

export default function EventConfigurator({
  config,
  onChange,
}: {
  config: EventConfig | null
  onChange: (cfg: EventConfig) => void
}) {
  const [evt, setEvt] = useState<EventConfig>(
    config || {
      eventType: 'webinar',
      startAt: '',
      timezone: 'Europe/Lisbon',
      locationType: 'online',
      joinUrl: '',
      address: '',
      showCtaButton: false,
      ctaText: 'Inscrever-me',
      ctaUrl: '',
    }
  )

  useEffect(() => {
    if (config) setEvt(config)
  }, [config])

  function setField<K extends keyof EventConfig>(key: K, value: EventConfig[K]) {
    const updated = { ...evt, [key]: value }
    setEvt(updated)
    onChange(updated)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Tipo
          </label>
          <select
            value={evt.eventType}
            onChange={(e) => setField('eventType', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="webinar">Webinar</option>
            <option value="presentation">Apresentação</option>
            <option value="event">Evento</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Timezone
          </label>
          <input
            value={evt.timezone || 'Europe/Lisbon'}
            onChange={(e) => setField('timezone', e.target.value)}
            placeholder="Europe/Lisbon"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Início *
          </label>
          <input
            type="datetime-local"
            value={evt.startAt ? new Date(evt.startAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => setField('startAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Fim (opcional)
          </label>
          <input
            type="datetime-local"
            value={evt.endAt ? new Date(evt.endAt).toISOString().slice(0, 16) : ''}
            onChange={(e) => setField('endAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Local
          </label>
          <select
            value={evt.locationType}
            onChange={(e) => setField('locationType', e.target.value as any)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="online">Online</option>
            <option value="in_person">Presencial</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Capacidade (opcional)
          </label>
          <input
            type="number"
            value={evt.capacity ?? ''}
            onChange={(e) => setField('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder="Ex: 50"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {evt.locationType === 'online' ? (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Link do evento (Zoom/Meet/etc.)
          </label>
          <input
            value={evt.joinUrl || ''}
            onChange={(e) => setField('joinUrl', e.target.value)}
            placeholder="https://..."
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
            Morada
          </label>
          <input
            value={evt.address || ''}
            onChange={(e) => setField('address', e.target.value)}
            placeholder="Rua, nº, cidade"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>
      )}

      <div
        style={{
          padding: 12,
          borderRadius: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={!!evt.showCtaButton}
            onChange={(e) => setField('showCtaButton', e.target.checked)}
          />
          <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>Ativar botão CTA na página</span>
        </label>

        {evt.showCtaButton && (
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
                Texto do botão
              </label>
              <input
                value={evt.ctaText || ''}
                onChange={(e) => setField('ctaText', e.target.value)}
                placeholder="Ex: Inscrever-me"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.75)', display: 'block', marginBottom: 6 }}>
                Link do botão
              </label>
              <input
                value={evt.ctaUrl || ''}
                onChange={(e) => setField('ctaUrl', e.target.value)}
                placeholder="https://..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.14)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
