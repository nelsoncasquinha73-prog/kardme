'use client'

import { useMemo } from 'react'
import { Theme, defaultTheme } from '@/lib/defaultTheme'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'

type Props = {
  theme?: Partial<Theme>
  setTheme: (theme: Theme) => void
}

type PickerTarget = 'background' | 'surface' | 'text' | 'primary' | 'mutedText'

export default function ThemeEditor({ theme, setTheme }: Props) {
  const value: Theme = useMemo(
    () => ({
      ...defaultTheme,
      ...(theme || {}),
    }),
    [theme]
  )

  const { openPicker } = useColorPicker()

  function update<K extends keyof Theme>(key: K, v: Theme[K]) {
    setTheme({
      ...value,
      [key]: v,
    })
  }

  function openWheelFor(key: PickerTarget) {
  openPicker({
    onPick: (hex) => update(key as any, hex as any),
  })
}


  function openEyedropperFor(key: PickerTarget) {
    openPicker({
      mode: 'eyedropper',
      onPick: (hex) => update(key as any, hex as any),
    })
  }

  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 16,
        padding: 20,
      }}
    >
      <h3 style={{ marginBottom: 16 }}>Editor manual</h3>

      <Row
        label="Fundo"
        value={value.background}
        onChange={(v) => update('background', v)}
       
        onEyedropper={() => openEyedropperFor('background')}
      />

      <Row
        label="Superfície"
        value={value.surface}
        onChange={(v) => update('surface', v)}
       
        onEyedropper={() => openEyedropperFor('surface')}
      />

      <Row
        label="Texto"
        value={value.text}
        onChange={(v) => update('text', v)}
       
        onEyedropper={() => openEyedropperFor('text')}
      />

      <Row
        label="Primária"
        value={value.primary}
        onChange={(v) => update('primary', v)}
      
        onEyedropper={() => openEyedropperFor('primary')}
      />

      <Row
        label="Texto suave"
        value={value.mutedText}
        onChange={(v) => update('mutedText', v)}
      
        onEyedropper={() => openEyedropperFor('mutedText')}
      />
    </div>
  )
}

/* ───────── row component ───────── */

function Row({
  label,
  value,
  onChange,
  
  onEyedropper,
}: {
  label: string
  value: string
  onChange: (v: string) => void
 
  onEyedropper: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
      }}
    >
      <span style={{ fontSize: 14, opacity: 0.8 }}>{label}</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <SwatchRow value={value} onChange={onChange} onEyedropper={onEyedropper} />

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 110,
            padding: '6px 8px',
            borderRadius: 10,
            border: '1px solid rgba(0,0,0,0.15)',
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        />
      </div>
    </div>
  )
}
