'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

// EDITORS
import HeaderBlockEditor from '@/components/dashboard/block-editors/HeaderBlockEditor'

type Props = {
  cardId: string // adiciona esta prop para receber o cardId
  block: {
    id: string
    type: string
    settings: any
  }
  onClose: () => void
  onSaved: () => void
}

export default function EditBlockModal({
  cardId, // recebe o cardId aqui
  block,
  onClose,
  onSaved,
}: Props) {
  const [settings, setSettings] = useState<any>(block.settings || {})
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)

    await supabase
      .from('card_blocks')
      .update({ settings })
      .eq('id', block.id)

    setSaving(false)
    onSaved()
    onClose()
  }

  function renderEditor() {
    switch (block.type) {
      case 'header':
        return (
          <HeaderBlockEditor
            cardId={cardId} // passa o cardId aqui
            settings={settings}
            onChange={setSettings}
          />
        )

      default:
        return (
          <p style={{ opacity: 0.6 }}>
            Este bloco ainda não tem editor.
          </p>
        )
    }
  }

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* HEADER */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <strong style={{ fontSize: 16 }}>
            Editar bloco: {block.type}
          </strong>

          <button onClick={onClose}>✕</button>
        </header>

        {/* CONTENT */}
        <div
          style={{
            maxHeight: '70vh',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {renderEditor()}
        </div>

        {/* ACTIONS */}
        <footer
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button onClick={onClose}>Cancelar</button>

          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#2563eb',
              color: '#fff',
              fontWeight: 600,
              opacity: saving ? 0.6 : 1,
              cursor: 'pointer',
            }}
          >
            {saving ? 'A guardar…' : 'Guardar'}
          </button>
        </footer>
      </div>
    </div>
  )
}

/* ───────── STYLES ───────── */

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
}

const modal: React.CSSProperties = {
  width: '100%',
  maxWidth: 520,
  background: '#fff',
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
}
