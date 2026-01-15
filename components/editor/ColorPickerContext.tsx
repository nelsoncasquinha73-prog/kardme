'use client'

import React, { createContext, useContext, useMemo, useState } from 'react'
import EyedropperLoupeOverlay from './EyedropperLoupeOverlay'

type PickerMode = 'modal' | 'eyedropper'

type PickerState = {
  active: boolean
  mode: PickerMode
  onPick?: (hex: string) => void
}

type Ctx = {
  picker: PickerState
  openPicker: (opts: { mode?: PickerMode; onPick?: (hex: string) => void }) => void
  closePicker: () => void
}

const ColorPickerContext = createContext<Ctx>({
  picker: { active: false, mode: 'modal' },
  openPicker: () => {},
  closePicker: () => {},
})

export function ColorPickerProvider({ children }: { children: React.ReactNode }) {
  const [picker, setPicker] = useState<PickerState>({ active: false, mode: 'modal' })

  const openPicker: Ctx['openPicker'] = (opts) => {
    setPicker({
      active: true,
      mode: opts.mode ?? 'modal',
      onPick: opts.onPick,
    })
  }

  const closePicker = () => {
    setPicker((p) => ({ ...p, active: false }))
  }

  const value = useMemo(() => ({ picker, openPicker, closePicker }), [picker])

  return (
    <ColorPickerContext.Provider value={value}>
      {picker.active && picker.mode === 'eyedropper' && <EyedropperLoupeOverlay />}
      {children}
    </ColorPickerContext.Provider>
  )
}

export function useColorPicker() {
  return useContext(ColorPickerContext)
}
