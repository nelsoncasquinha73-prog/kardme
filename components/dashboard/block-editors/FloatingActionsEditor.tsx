'use client'

import { Section, Row, Toggle } from '@/components/editor/ui'
import SwatchRow from '@/components/editor/SwatchRow'
import { useColorPicker } from '@/components/editor/ColorPickerContext'

export type FloatingActionsSettings = {
  enabled?: boolean
  showShare?: boolean
  showQR?: boolean
  showSaveContact?: boolean
  buttonColor?: string
}

type Props = {
  settings: FloatingActionsSettings
  onChange: (settings: FloatingActionsSettings) => void
}

export default function FloatingActionsEditor({ settings, onChange }: Props) {
  const { openPicker } = useColorPicker()

  const s = {
    enabled: settings.enabled ?? true,
    showShare: settings.showShare ?? true,
    showQR: settings.showQR ?? true,
    showSaveContact: settings.showSaveContact ?? true,
    buttonColor: settings.buttonColor ?? '#8B5CF6',
  }

  const update = (partial: Partial<FloatingActionsSettings>) => {
    onChange({ ...s, ...partial })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Botões Flutuantes">
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
          Botões fixos no canto do cartão para partilhar, mostrar QR code e guardar contacto.
        </p>

        <Row label="Ativar botões">
          <Toggle
            active={s.enabled}
            onClick={() => update({ enabled: !s.enabled })}
          />
        </Row>

        {s.enabled && (
          <>
            <Row label="Botão Partilhar">
              <Toggle
                active={s.showShare}
                onClick={() => update({ showShare: !s.showShare })}
              />
            </Row>

            <Row label="Botão QR Code">
              <Toggle
                active={s.showQR}
                onClick={() => update({ showQR: !s.showQR })}
              />
            </Row>

            <Row label="Botão Guardar Contacto">
              <Toggle
                active={s.showSaveContact}
                onClick={() => update({ showSaveContact: !s.showSaveContact })}
              />
            </Row>

            <Row label="Cor do botão">
              <SwatchRow
                value={s.buttonColor}
                onChange={(hex) => update({ buttonColor: hex })}
                onEyedropper={() =>
                  openPicker({
                    mode: 'eyedropper',
                    onPick: (hex) => update({ buttonColor: hex }),
                  })
                }
              />
            </Row>
          </>
        )}
      </Section>
    </div>
  )
}
