'use client'

import { useRef, useState } from 'react'
import type { HeaderSettings } from '@/components/blocks/HeaderBlock'
import { uploadCardImage } from '@/lib/uploadCardImage'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'

type CardBg =
  | { mode: 'solid'; color: string; opacity?: number }
  | { mode: 'gradient'; from: string; to: string; angle?: number; opacity?: number }

type BadgePos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type Props = {
  cardId: string
  settings: HeaderSettings
  onChange: (s: HeaderSettings) => void

  cardBg?: CardBg
  onChangeCardBg?: (bg: CardBg) => void
}

export default function HeaderBlockEditor({ cardId, settings, onChange, cardBg, onChangeCardBg }: Props) {
  const coverRef = useRef<HTMLInputElement>(null)
  const badgeRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadingBadge, setUploadingBadge] = useState(false)

  const { openPicker } = useColorPicker()

  const layout = settings.layout ?? {}

  const setLayout = (patch: Partial<HeaderSettings['layout']>) =>
    onChange({
      ...settings,
      layout: {
        ...layout,
        ...patch,
      },
    })

  const toggleCover = () => setLayout({ showCover: layout?.showCover === false })

  async function onPickCover(file: File) {
    setUploading(true)
    try {
      const { publicUrl } = await uploadCardImage({ cardId, file, kind: 'cover' })
      onChange({ ...settings, coverImage: publicUrl })
      if (layout?.showCover === false) setLayout({ showCover: true })
    } finally {
      setUploading(false)
    }
  }

  async function onPickBadge(file: File) {
    setUploadingBadge(true)
    try {
      const { publicUrl } = await uploadCardImage({ cardId, file, kind: 'badge' })
      onChange({ ...settings, badgeImage: publicUrl })

      const curBadge = (layout as any)?.badge ?? {}
      if (curBadge?.enabled !== true) {
        setLayout({ ...(layout as any), badge: { ...curBadge, enabled: true } } as any)
      }
    } finally {
      setUploadingBadge(false)
    }
  }

  const coverMode = (layout as any)?.coverMode ?? 'tile'
  const tileRadius = (layout as any)?.tileRadius ?? 18
  const tilePadding = (layout as any)?.tilePadding ?? 10

  const overlayEnabled = layout?.overlay === true
  const overlayOpacity = typeof layout?.overlayOpacity === 'number' ? layout.overlayOpacity : 0.25
  const overlayColor = (layout as any)?.overlayColor ?? '#000000'
  const overlayGradient = (layout as any)?.overlayGradient === true

  // NOVO: fade para baixo (liga cover ao fundo)
  const coverFadeEnabled = (layout as any)?.coverFadeEnabled === true
  const coverFadeStrength = typeof (layout as any)?.coverFadeStrength === 'number' ? (layout as any).coverFadeStrength : 50 // 0-100
  const coverFadeHeightPx = typeof (layout as any)?.coverFadeHeightPx === 'number' ? (layout as any).coverFadeHeightPx : 120

  // Por defeito, tenta usar a cor do fundo do cartão (se existir). Senão branco.
  const fallbackFadeColor =
    cardBg?.mode === 'solid'
      ? cardBg.color
      : cardBg?.mode === 'gradient'
        ? cardBg.to
        : '#ffffff'

  const coverFadeColor = (layout as any)?.coverFadeColor ?? fallbackFadeColor

  // NOVO: badge settings
  const badge = (layout as any)?.badge ?? {}
  const badgeEnabled = badge?.enabled === true
  const badgePos: BadgePos = badge?.position ?? 'top-right'
  const badgeSizePx = typeof badge?.sizePx === 'number' ? badge.sizePx : 56
  const badgeOffsetX = typeof badge?.offsetX === 'number' ? badge.offsetX : 10
  const badgeOffsetY = typeof badge?.offsetY === 'number' ? badge.offsetY : 10
  const badgeBgEnabled = badge?.bgEnabled === true
  const badgeBgColor = badge?.bgColor ?? 'rgba(255,255,255,0.85)'
  const badgeRadiusPx = typeof badge?.radiusPx === 'number' ? badge.radiusPx : 12
  const badgeShadow = badge?.shadow === true

  const pick = (apply: (hex: string) => void) => {
    openPicker({ onPick: apply })
  }

  function openEyedropperOverlay() {
    pick((hex) => setLayout({ ...(layout as any), overlayColor: hex } as any))
  }

  function openEyedropperFade() {
    pick((hex) => setLayout({ ...(layout as any), coverFadeColor: hex } as any))
  }

  function openEyedropperBadgeBg() {
    pick((hex) => setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* NOVO: Fundo global do cartão */}
      {cardBg && onChangeCardBg && (
        <Section title="Fundo do cartão (global)">
          <Row label="Tipo">
            <Button
              onClick={() =>
                onChangeCardBg({
                  mode: 'solid',
                  color: cardBg.mode === 'solid' ? cardBg.color : '#ffffff',
                  opacity: cardBg.opacity ?? 1,
                })
              }
            >
              Cor sólida
            </Button>
            <Button
              onClick={() =>
                onChangeCardBg({
                  mode: 'gradient',
                  from: cardBg.mode === 'gradient' ? cardBg.from : '#ffffff',
                  to: cardBg.mode === 'gradient' ? cardBg.to : '#f3f4f6',
                  angle: cardBg.mode === 'gradient' ? cardBg.angle ?? 180 : 180,
                  opacity: cardBg.opacity ?? 1,
                })
              }
            >
              Degradê
            </Button>
          </Row>

          {cardBg.mode === 'solid' ? (
            <Row label="Cor">
              <SwatchRow
                value={cardBg.color}
                onChange={(hex) => onChangeCardBg({ ...cardBg, color: hex })}
                onEyedropper={() => {
                  pick((hex) => onChangeCardBg({ ...cardBg, color: hex }))
                }}
              />
            </Row>
          ) : (
            <>
              <Row label="De">
                <SwatchRow
                  value={cardBg.from}
                  onChange={(hex) => onChangeCardBg({ ...cardBg, from: hex })}
                  onEyedropper={() => {
                    pick((hex) => onChangeCardBg({ ...cardBg, from: hex }))
                  }}
                />
              </Row>
              <Row label="Para">
                <SwatchRow
                  value={cardBg.to}
                  onChange={(hex) => onChangeCardBg({ ...cardBg, to: hex })}
                  onEyedropper={() => {
                    pick((hex) => onChangeCardBg({ ...cardBg, to: hex }))
                  }}
                />
              </Row>
              <Row label="Ângulo">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={cardBg.angle ?? 180}
                  onChange={(e) => onChangeCardBg({ ...cardBg, angle: Number(e.target.value) })}
                  style={{ width: 90 }}
                />
              </Row>
            </>
          )}

          <Row label="Opacidade">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={cardBg.opacity ?? 1}
              onChange={(e) => onChangeCardBg({ ...cardBg, opacity: Number(e.target.value) })}
            />
          </Row>
        </Section>
      )}

      {/* Restante UI do HeaderBlockEditor */}
      <Section title="Visibilidade">
        <Row label="Cover">
          <Toggle active={layout?.showCover !== false} onClick={toggleCover} />
        </Row>
      </Section>

      <Section title="Imagem">
        <Button onClick={() => coverRef.current?.click()}>{uploading ? 'A enviar...' : '📷 Alterar cover'}</Button>

        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPickCover(f)
          }}
        />
      </Section>

      <Section title="Cover (moldura)">
        <Row label="Modo">
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'full' } as any)}>Full</Button>
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'tile' } as any)}>Moldura</Button>
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'auto' } as any)}>Auto (adaptar)</Button>
        </Row>

        {(layout as any)?.coverMode === 'auto' && (
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Auto mostra a imagem inteira e preenche o fundo com blur (ideal para imagens da net).
          </div>
        )}

        {coverMode === 'tile' ? (
          <>
            <Row label="Radius">
              <input
                type="range"
                min={0}
                max={32}
                step={1}
                value={tileRadius}
                onChange={(e) => setLayout({ ...(layout as any), tileRadius: Number(e.target.value) } as any)}
              />
            </Row>

            <Row label="Padding">
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={tilePadding}
                onChange={(e) => setLayout({ ...(layout as any), tilePadding: Number(e.target.value) } as any)}
              />
            </Row>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7 }}>Full: a cover ocupa a largura toda do cartão (edge-to-edge).</div>
        )}
      </Section>

      <Section title="Layout">
        <Row label="Altura">
          <Button onClick={() => setLayout({ height: 180 })}>180</Button>
          <Button onClick={() => setLayout({ height: 220 })}>220</Button>
          <Button onClick={() => setLayout({ height: 260 })}>260</Button>
        </Row>

        <Row label="Overlay">
          <Toggle active={overlayEnabled} onClick={() => setLayout({ overlay: !overlayEnabled })} />
        </Row>

        {overlayEnabled ? (
          <>
            <Row label="Cor overlay">
              <SwatchRow
                value={overlayColor}
                onChange={(hex) => setLayout({ ...(layout as any), overlayColor: hex } as any)}
                onEyedropper={openEyedropperOverlay}
              />
            </Row>

            <Row label="Degradê (ligar ao fundo)">
              <Toggle
                active={overlayGradient}
                onClick={() => setLayout({ ...(layout as any), overlayGradient: !overlayGradient } as any)}
              />
            </Row>

            {/* NOVO: Fade para baixo */}
            <Row label="Fade para baixo (subtil)">
              <Toggle
                active={coverFadeEnabled}
                onClick={() => setLayout({ ...(layout as any), coverFadeEnabled: !coverFadeEnabled } as any)}
              />
            </Row>

            {coverFadeEnabled && (
              <>
                <Row label="Cor do fade">
                  <SwatchRow
                    value={coverFadeColor}
                    onChange={(hex) => setLayout({ ...(layout as any), coverFadeColor: hex } as any)}
                    onEyedropper={openEyedropperFade}
                  />
                </Row>

                <Row label="Intensidade">
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Button onClick={() => setLayout({ ...(layout as any), coverFadeStrength: 35 } as any)}>35%</Button>
                    <Button onClick={() => setLayout({ ...(layout as any), coverFadeStrength: 50 } as any)}>50%</Button>
                    <Button onClick={() => setLayout({ ...(layout as any), coverFadeStrength: 65 } as any)}>65%</Button>
                  </div>
                </Row>

                <Row label="Intensidade (fine)">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={coverFadeStrength}
                    onChange={(e) =>
                      setLayout({ ...(layout as any), coverFadeStrength: Number(e.target.value) } as any)
                    }
                  />
                </Row>

                <Row label="Altura (px)">
                  <input
                    type="number"
                    min={20}
                    max={320}
                    value={coverFadeHeightPx}
                    onChange={(e) =>
                      setLayout({ ...(layout as any), coverFadeHeightPx: Number(e.target.value) } as any)
                    }
                    style={{ width: 90 }}
                  />
                </Row>
              </>
            )}

            <Row label="Opacidade">
              <div style={{ display: 'flex', gap: 10 }}>
                <Button onClick={() => setLayout({ overlayOpacity: 0.15 })}>15%</Button>
                <Button onClick={() => setLayout({ overlayOpacity: 0.25 })}>25%</Button>
                <Button onClick={() => setLayout({ overlayOpacity: 0.35 })}>35%</Button>
              </div>
            </Row>

            <Row label="Opacidade (fine)">
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={overlayOpacity}
                onChange={(e) => setLayout({ overlayOpacity: Number(e.target.value) })}
              />
            </Row>
          </>
        ) : null}

        <Row label="Largura">
          <Button onClick={() => setLayout({ widthMode: 'full' })}>Full</Button>
          <Button onClick={() => setLayout({ widthMode: 'fixed' })}>Fixa</Button>
          <Button onClick={() => setLayout({ widthMode: 'custom' })}>Custom</Button>
        </Row>

        {layout.widthMode === 'custom' && (
          <Row label="Largura (px)">
            <input
              type="number"
              min={200}
              max={1920}
              value={layout.customWidthPx ?? 720}
              onChange={(e) => setLayout({ customWidthPx: Number(e.target.value) })}
              style={{ width: 90 }}
            />
          </Row>
        )}
      </Section>

      {/* NOVO: Badge */}
      <Section title="Badge (marca/logo)">
        <Row label="Ativar">
          <Toggle
            active={badgeEnabled}
            onClick={() => setLayout({ ...(layout as any), badge: { ...badge, enabled: !badgeEnabled } } as any)}
          />
        </Row>

        {badgeEnabled ? (
          <>
            <Row label="Upload">
              <Button onClick={() => badgeRef.current?.click()}>
                {uploadingBadge ? 'A enviar...' : '📷 Upload badge'}
              </Button>

              <input
                ref={badgeRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) onPickBadge(f)
                }}
              />
            </Row>

            <Row label="URL (opcional)">
              <input
                value={settings.badgeImage ?? ''}
                onChange={(e) => onChange({ ...settings, badgeImage: e.target.value })}
                style={{ width: 260 }}
                placeholder="https://..."
              />
            </Row>

            <Row label="Posição">
              <select
                value={badgePos}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, position: e.target.value } } as any)}
                style={{ width: 170 }}
              >
                <option value="top-left">Topo esquerdo</option>
                <option value="top-right">Topo direito</option>
                <option value="bottom-left">Baixo esquerdo</option>
                <option value="bottom-right">Baixo direito</option>
              </select>
            </Row>

            <Row label="Tamanho (px)">
              <input
                type="number"
                min={16}
                max={220}
                value={badgeSizePx}
                onChange={(e) =>
                  setLayout({ ...(layout as any), badge: { ...badge, sizePx: Number(e.target.value) } } as any)
                }
                style={{ width: 90 }}
              />
            </Row>

            <Row label="Offset X (px)">
              <input
                type="number"
                value={badgeOffsetX}
                onChange={(e) =>
                  setLayout({ ...(layout as any), badge: { ...badge, offsetX: Number(e.target.value) } } as any)
                }
                style={{ width: 90 }}
              />
            </Row>

            <Row label="Offset Y (px)">
              <input
                type="number"
                value={badgeOffsetY}
                onChange={(e) =>
                  setLayout({ ...(layout as any), badge: { ...badge, offsetY: Number(e.target.value) } } as any)
                }
                style={{ width: 90 }}
              />
            </Row>

            <Row label="Fundo (pill)">
              <Toggle
                active={badgeBgEnabled}
                onClick={() =>
                  setLayout({ ...(layout as any), badge: { ...badge, bgEnabled: !badgeBgEnabled } } as any)
                }
              />
            </Row>

            {badgeBgEnabled ? (
              <Row label="Cor do fundo">
                                <SwatchRow
                  value={badgeBgColor}
                  onChange={(hex) =>
                    setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any)
                  }
                  onEyedropper={openEyedropperBadgeBg}
                />
              </Row>
            ) : null}

            <Row label="Raio (px)">
              <input
                type="number"
                min={0}
                max={64}
                value={badgeRadiusPx}
                onChange={(e) =>
                  setLayout({ ...(layout as any), badge: { ...badge, radiusPx: Number(e.target.value) } } as any)
                }
                style={{ width: 90 }}
              />
            </Row>

            <Row label="Sombra">
              <Toggle
                active={badgeShadow}
                onClick={() =>
                  setLayout({ ...(layout as any), badge: { ...badge, shadow: !badgeShadow } } as any)
                }
              />
            </Row>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Liga para colocar uma marca/logo por cima do header.
          </div>
        )}
      </Section>

      <Section title="Avatar (layout)">
        <Row label="Posição">
          <Button onClick={() => setLayout({ avatarDock: 'overlap' })}>Overlap</Button>
          <Button onClick={() => setLayout({ avatarDock: 'inline' })}>Inline</Button>
        </Row>
      </Section>
    </div>
  )
}

function Section({ title, children }: any) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <strong>{title}</strong>
      {children}
    </div>
  )
}

function Row({ label, children }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span>{label}</span>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,0.10)',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 700,
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 52,
        height: 28,
        borderRadius: 999,
        background: active ? 'var(--color-primary)' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: active ? 26 : 4,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </button>
  )
}
