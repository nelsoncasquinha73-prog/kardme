'use client'

type BlockItem = {
  id: string
  type: string
  title?: string
  enabled: boolean
  order?: number
  settings?: any
  style?: any
}

export default function AddBlockModal({
  open,
  blocks,
  onClose,
  onEnable,
}: {
  open: boolean
  blocks: BlockItem[]
  onClose: () => void
  onEnable: (id: string) => void
}) {
  if (!open) return null

  const disabled = blocks.filter(b => !b.enabled)

  return (
    <div
      onMouseDown={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 9999,
        padding: 16,
      }}
    >
      <div
        onMouseDown={e => e.stopPropagation()}
        style={{
          width: 520,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
          }}
        >
          <strong style={{ fontSize: 14 }}>Adicionar bloco</strong>
          <button
            onClick={onClose}
            style={{
              height: 34,
              padding: '0 10px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Fechar
          </button>
        </div>

        <div style={{ padding: 14 }}>
          {disabled.length === 0 ? (
            <p style={{ fontSize: 14, opacity: 0.7 }}>Já tens todos os blocos ativos ✅</p>
          ) : (
            <>
              <p style={{ fontSize: 13, opacity: 0.65, marginBottom: 12 }}>
                Seleciona um bloco para ativar.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {disabled.map(b => (
                  <button
                    key={b.id}
                    onClick={() => onEnable(b.id)}
                    style={{
                      textAlign: 'left',
                      padding: 12,
                      borderRadius: 14,
                      border: '1px solid rgba(0,0,0,0.10)',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 800, fontSize: 13 }}>{b.title || b.type}</div>
                    <div style={{ fontSize: 12, opacity: 0.6 }}>{b.type}</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: 14,
            borderTop: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
          }}
        >
          <button
            onClick={onClose}
            style={{
              height: 40,
              padding: '0 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 800,
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
