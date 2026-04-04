'use client'

import { FiBold, FiItalic, FiUnderline } from 'react-icons/fi'

interface TextBlockEditorProps {
  content: {
    text?: string
    fontSize?: number
    color?: string
    align?: 'left' | 'center' | 'right'
    fontWeight?: number
    fontStyle?: string
    textDecoration?: string
    fontFamily?: string
  }
  onUpdate: (updates: Record<string, any>) => void
}

export default function TextBlockEditor({ content, onUpdate }: TextBlockEditorProps) {
  const isBold = content.fontWeight === 700
  const isItalic = content.fontStyle === 'italic'
  const isUnderline = content.textDecoration === 'underline'

  const fonts = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS']
  const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Toolbar de Formatação */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Linha 1: Bold, Italic, Underline */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => onUpdate({ fontWeight: isBold ? 400 : 700 })}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 4,
              border: 'none',
              background: isBold ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
            title="Negrito"
          >
            <FiBold size={16} />
          </button>
          <button
            onClick={() => onUpdate({ fontStyle: isItalic ? 'normal' : 'italic' })}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 4,
              border: 'none',
              background: isItalic ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontStyle: 'italic',
            }}
            title="Itálico"
          >
            <FiItalic size={16} />
          </button>
          <button
            onClick={() => onUpdate({ textDecoration: isUnderline ? 'none' : 'underline' })}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 4,
              border: 'none',
              background: isUnderline ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'underline',
            }}
            title="Sublinhado"
          >
            <FiUnderline size={16} />
          </button>
        </div>

        {/* Linha 2: Fonte */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 700 }}>
            Fonte
          </label>
          <select
            value={content.fontFamily || 'Arial'}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {fonts.map((font) => (
              <option key={font} value={font} style={{ background: '#1a1a2e', color: '#fff' }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Linha 3: Tamanho */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 700 }}>
            Tamanho: {content.fontSize || 16}px
          </label>
          <input
            type="range"
            min="10"
            max="48"
            value={content.fontSize || 16}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        {/* Linha 4: Cor */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 700 }}>
            Cor
          </label>
          <input
            type="color"
            value={content.color || '#111827'}
            onChange={(e) => onUpdate({ color: e.target.value })}
            style={{
              width: '100%',
              height: 40,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Linha 5: Alinhamento */}
        <div>
          <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontWeight: 700 }}>
            Alinhamento
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => onUpdate({ align })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: 4,
                  border: 'none',
                  background: content.align === align ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: content.align === align ? 700 : 400,
                }}
              >
                {align === 'left' ? '⬅️' : align === 'center' ? '⬇️' : '➡️'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div>
        <label style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: 700 }}>
          Texto
        </label>
        <textarea
          value={content.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            fontSize: 12,
            minHeight: 100,
            fontFamily: content.fontFamily || 'Arial',
            fontWeight: content.fontWeight || 400,
            fontStyle: content.fontStyle || 'normal',
            textDecoration: content.textDecoration || 'none',
          }}
          placeholder="Escreve aqui o teu texto..."
        />
      </div>
    </div>
  )
}
