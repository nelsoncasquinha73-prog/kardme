'use client'

import styles from './LeadMagnetEditor.module.css'

export default function LeadMagnetPreview({ magnet }: { magnet: any }) {
  const t = String(magnet?.magnet_type || '').trim().toLowerCase()

  const discount = magnet?.discount_config || null

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Preview genérico da Página de Captura */}
      <div style={{ padding: 18 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 10 }}>
          PREVIEW • PÁGINA DE CAPTURA
        </div>

        {magnet?.capture_page_image ? (
          <img
            src={magnet.capture_page_image}
            alt="Capa"
            style={{
              width: '100%',
              height: 140,
              objectFit: 'cover',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: 12,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 140,
              borderRadius: 8,
              border: '1px dashed rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.03)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.35)',
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Sem imagem
          </div>
        )}

        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          {magnet?.capture_page_title || 'Título da Página'}
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, marginBottom: 14 }}>
          {magnet?.capture_page_subtitle || 'Subtítulo / descrição curta'}
        </div>

        {t === 'webinar' && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 10 }}>
              DETALHES DO EVENTO
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Tipo</div>
                <div style={{ fontWeight: 800, color: '#fff' }}>
                  {(magnet?.event_config?.eventType || 'webinar') === 'presentation'
                    ? 'Apresentação'
                    : (magnet?.event_config?.eventType || 'webinar') === 'event'
                    ? 'Evento'
                    : 'Eventos e Webinars'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Timezone</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>{magnet?.event_config?.timezone || 'Europe/Lisbon'}</div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Início</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>
                  {magnet?.event_config?.startAt ? new Date(magnet.event_config.startAt).toLocaleString('pt-PT') : '—'}
                </div>
              </div>

              {magnet?.event_config?.endAt && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Fim</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>
                    {new Date(magnet.event_config.endAt).toLocaleString('pt-PT')}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Local</div>
                <div style={{ fontWeight: 700, color: '#fff' }}>
                  {magnet?.event_config?.locationType === 'in_person' ? 'Presencial' : 'Online'}
                </div>
              </div>

              {magnet?.event_config?.locationType === 'in_person' ? (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Morada</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{magnet?.event_config?.address || '—'}</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Link</div>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{magnet?.event_config?.joinUrl ? '✓ definido' : '—'}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {t !== 'webinar' && (
        <button
          type="button"
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: 'none',
            background: '#10b981',
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'default',
            opacity: 0.95,
          }}
        >
          {magnet?.capture_page_button_text || 'Botão'}
        </button>
        )}
      </div>

      {/* Bloco específico por tipo (só quando fizer sentido) */}
      {t === 'discount' && (
        <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: 1, marginBottom: 10 }}>
            PREVIEW • DESCONTO
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>
              Desconto de
            </div>

            <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 10 }}>
              {discount?.value ?? 0}
              {discount?.type === 'percent' ? '%' : '€'}
            </div>

            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: 'monospace', letterSpacing: 2 }}>
              {discount?.code || 'CODIGO'}
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
            (No público, aqui aparece “Copiar código” e o CTA.)
          </div>
        </div>
      )}
    </div>
  )
}
