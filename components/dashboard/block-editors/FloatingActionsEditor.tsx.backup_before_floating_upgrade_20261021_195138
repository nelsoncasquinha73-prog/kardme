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
          </>
        )}
      </Section>
    </div>
  )
}
