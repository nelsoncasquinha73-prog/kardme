'use client'

import { Section, Row, Toggle } from '@/components/editor/ui'
import SwatchRow from '@/components/editor/SwatchRow'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import { useLanguage } from '@/components/language/LanguageProvider'

export type FloatingActionsSettings = {
  enabled?: boolean
  showShare?: boolean
  showQR?: boolean
  showSaveContact?: boolean
  buttonColor?: string
  buttonSize?: number
  buttonPosition?: 'left' | 'right'
  buttonBottom?: number
  buttonSide?: number
}

type Props = {
  settings: FloatingActionsSettings
  onChange: (settings: FloatingActionsSettings) => void
}

export default function FloatingActionsEditor({ settings, onChange }: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()

  const s = {
    enabled: settings.enabled ?? true,
    showShare: settings.showShare ?? true,
    showQR: settings.showQR ?? true,
    showSaveContact: settings.showSaveContact ?? true,
    buttonColor: settings.buttonColor ?? '#8B5CF6',
    buttonSize: settings.buttonSize ?? 56,
    buttonPosition: settings.buttonPosition ?? 'right',
    buttonBottom: settings.buttonBottom ?? 24,
    buttonSide: settings.buttonSide ?? 16,
  }

  const update = (partial: Partial<FloatingActionsSettings>) => {
    onChange({ ...s, ...partial })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title={t('editor.floating_buttons')}>
        <p style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
          Botões fixos no canto do cartão para partilhar, mostrar QR code e guardar contacto.
        </p>

        <Row label={t('editor.enable_buttons')}>
          <Toggle
            active={s.enabled}
            onClick={() => update({ enabled: !s.enabled })}
          />
        </Row>

        {s.enabled && (
          <>
            <Row label={t('editor.share_button')}>
              <Toggle
                active={s.showShare}
                onClick={() => update({ showShare: !s.showShare })}
              />
            </Row>

            <Row label={t('editor.qr_button')}>
              <Toggle
                active={s.showQR}
                onClick={() => update({ showQR: !s.showQR })}
              />
            </Row>

            <Row label={t('editor.save_contact_button')}>
              <Toggle
                active={s.showSaveContact}
                onClick={() => update({ showSaveContact: !s.showSaveContact })}
              />
            </Row>

            <Row label={t('editor.button_color')}>
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

            <Row label="Tamanho">
              <select value={s.buttonSize} onChange={(e) => update({ buttonSize: Number(e.target.value) })}>
                <option value={36}>Pequeno (36 px)</option>
                <option value={44}>Médio (44 px)</option>
                <option value={56}>Grande (56 px)</option>
              </select>
            </Row>
            <Row label="Posição">
              <select value={s.buttonPosition} onChange={(e) => update({ buttonPosition: e.target.value as 'left' | 'right' })}>
                <option value="right">Direita</option>
                <option value="left">Esquerda</option>
              </select>
            </Row>
            <Row label="Margem inferior (px)">
              <input type="number" min={0} max={150} value={s.buttonBottom} onChange={(e) => update({ buttonBottom: Number(e.target.value) })} style={{ width: 75 }} />
            </Row>
            <Row label="Margem lateral (px)">
              <input type="number" min={0} max={100} value={s.buttonSide} onChange={(e) => update({ buttonSide: Number(e.target.value) })} style={{ width: 75 }} />
            </Row>
          </>
        )}
      </Section>
    </div>
  )
}
