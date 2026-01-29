'use client'

import { useRef, useState } from 'react'
import type { HeaderSettings } from '@/components/blocks/HeaderBlock'
import { uploadCardImage } from '@/lib/uploadCardImage'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import type { CardBg, CardBgV1 } from '@/lib/cardBg'
import { CARD_BG_PRESETS } from '@/lib/bgPresets'
import { bgToStyle } from '@/lib/bgToCss'
import { migrateCardBg } from '@/lib/cardBg'

type BadgePos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type Props = {
  cardId: string
  settings: HeaderSettings
  onChange: (s: HeaderSettings) => void

  cardBg?: CardBgV1
  onChangeCardBg?: (bg: CardBgV1) => void
}

export default function HeaderBlockEditor({ cardId, settings, onChange, cardBg, onChangeCardBg }: Props) {
  const coverRef = useRef<HTMLInputElement>(null)
  const badgeRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadingBadge, setUploadingBadge] = useState(false)

  const { openPicker } = useColorPicker()

  const layout = settings.layout ?? {}

  // ✅ normalizamos sempre para v1 para editar sem dores
const v1 = migrateCardBg(cardBg ?? ({ mode: 'solid', color: '#ffffff', opacity: 1 } as any))


const [recolorA, setRecolorA] = useState('#d8c08a')
const [recolorB, setRecolorB] = useState('#2b2b2b')
const [patternA, setPatternA] = useState('#ffffff')
const [patternB, setPatternB] = useState('#000000')


  // ✅ base gradient “segura” para TS + UI
  const gBase =
    v1.base.kind === 'gradient'
      ? v1.base
      : {
          kind: 'gradient' as const,
          angle: 180,
          stops: [
            { color: '#ffffff', pos: 0 },
            { color: '#f3f4f6', pos: 100 },
          ],
        }

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

  // Fade para baixo
  const coverFadeEnabled = (layout as any)?.coverFadeEnabled === true
  const coverFadeStrength =
    typeof (layout as any)?.coverFadeStrength === 'number' ? (layout as any).coverFadeStrength : 50
  const coverFadeHeightPx =
    typeof (layout as any)?.coverFadeHeightPx === 'number' ? (layout as any).coverFadeHeightPx : 120

  // Fundo do header (bloco)
  const headerBgEnabled = (layout as any)?.headerBgEnabled === true
  const headerBgColor = (layout as any)?.headerBgColor ?? '#ffffff'

  // fallback para a cor do fade
  const fallbackFadeColor = (() => {
    if (headerBgEnabled) return headerBgColor
    if (!cardBg) return '#ffffff'

    // v1
    if ((cardBg as any).version === 1) {
      const b = (cardBg as any).base
      if (b?.kind === 'solid') return b.color ?? '#ffffff'
      if (b?.kind === 'gradient') return (b.stops?.[b.stops.length - 1]?.color ?? '#ffffff')
      return '#ffffff'
    }

    // legacy
    if ((cardBg as any).mode === 'solid') return (cardBg as any).color ?? '#ffffff'
    if ((cardBg as any).mode === 'gradient') return (cardBg as any).to ?? '#ffffff'
    return '#ffffff'
  })()

  const coverFadeColor = (layout as any)?.coverFadeColor ?? fallbackFadeColor

  // Layout (altura/largura)
  const height = typeof (layout as any)?.height === 'number' ? (layout as any).height : 220
  const widthMode = (layout as any)?.widthMode ?? 'full'
  const customWidthPx = typeof (layout as any)?.customWidthPx === 'number' ? (layout as any).customWidthPx : 720

  // Badge settings
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

  // ✅ abrir sempre em eyedropper
  const pickEyedropper = (apply: (hex: string) => void) => {
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })
  }

  function openEyedropperOverlay() {
    pickEyedropper((hex) => setLayout({ ...(layout as any), overlayColor: hex } as any))
  }

  function openEyedropperFade() {
    pickEyedropper((hex) => setLayout({ ...(layout as any), coverFadeColor: hex } as any))
  }

  function openEyedropperBadgeBg() {
    pickEyedropper((hex) => setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any))
  }

  function openEyedropperHeaderBg() {
    pickEyedropper((hex) => setLayout({ ...(layout as any), headerBgColor: hex } as any))
  }
  // =======================
  // Effects (overlays) UI → grava em v1.overlays
  // =======================

  const currentOverlay = (v1.overlays?.[0] ?? null) as any
  const effectsEnabled = !!currentOverlay

  const currentKind: string = currentOverlay?.kind ?? 'none'
  const currentOpacity: number = typeof currentOverlay?.opacity === 'number' ? currentOverlay.opacity : 0.25
  const currentDensity: number = typeof currentOverlay?.density === 'number' ? currentOverlay.density : 0.55
  const currentScale: number = typeof currentOverlay?.scale === 'number' ? currentOverlay.scale : 1
  const currentSoftness: number = typeof currentOverlay?.softness === 'number' ? currentOverlay.softness : 0.5
  const currentBlendMode: string = currentOverlay?.blendMode ?? 'soft-light'

  function setOverlays(next: any[] | undefined) {
    onChangeCardBg?.({
      ...v1,
      overlays: next ?? [],
    })
  }

  function toggleEffects() {
    if (effectsEnabled) {
      setOverlays([])
      return
    }

    // default: dots premium suave
    setOverlays([
      {
        kind: 'dots',
        opacity: 0.25,
        density: 0.6,
        scale: 1,
        softness: 0.5,
        angle: 45,
        blendMode: 'soft-light',
        colorA: patternA,
        colorB: patternB,
      },
    ])
  }

  function setEffectKind(kind: string) {
    if (kind === 'none') {
      setOverlays([])
      return
    }

    const base = currentOverlay
      ? { ...currentOverlay }
      : {
          opacity: 0.25,
          density: 0.6,
          scale: 1,
          softness: 0.5,
          angle: 45,
          blendMode: 'soft-light',
          colorA: patternA,
          colorB: patternB,
        }

    setOverlays([
      {
        ...base,
        kind,
        // garantir que as cores do pattern acompanham
        colorA: patternA,
        colorB: patternB,
      },
    ])
  }

  function patchOverlay(patch: any) {
    if (!effectsEnabled) return
    setOverlays([{ ...(currentOverlay || {}), ...patch }])
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Fundo global do cartão */}
      {cardBg && onChangeCardBg ? (
        <Section title="Fundo do cartão (global)">
          {/* Personalizar preset (recolor rápido) */}
<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
  <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8 }}>Personalizar preset (rápido)</div>

  <Row label="Cor A">
    <SwatchRow
      value={recolorA}
      onChange={(hex) => setRecolorA(hex)}
      onEyedropper={() => pickEyedropper((hex) => setRecolorA(hex))}
    />
  </Row>

  <Row label="Cor B">
    <SwatchRow
      value={recolorB}
      onChange={(hex) => setRecolorB(hex)}
      onEyedropper={() => pickEyedropper((hex) => setRecolorB(hex))}
    />
  </Row>

  <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

  <Row label="Pattern A">
    <SwatchRow
      value={patternA}
      onChange={(hex) => setPatternA(hex)}
      onEyedropper={() => pickEyedropper((hex) => setPatternA(hex))}
    />
  </Row>

  <Row label="Pattern B">
    <SwatchRow
      value={patternB}
      onChange={(hex) => setPatternB(hex)}
      onEyedropper={() => pickEyedropper((hex) => setPatternB(hex))}
    />
  </Row>

  <Button
    onClick={() => {
      // garante base gradient (se estiver solid, converte)
      const base =
        v1.base.kind === 'gradient'
          ? v1.base
          : {
              kind: 'gradient' as const,
              angle: 180,
              stops: [
                { color: '#ffffff', pos: 0 },
                { color: '#f3f4f6', pos: 100 },
              ],
            }

      const nextStops = bg_recolorStops(base.stops, recolorA, recolorB)
const nextOverlays = bg_recolorOverlays(v1.overlays ?? [], patternA, patternB)


      onChangeCardBg?.({
        ...v1,
        base: { ...base, kind: 'gradient', stops: nextStops },
        overlays: nextOverlays,
      })
    }}
  >
    Aplicar cores ao preset
  </Button>

  <div style={{ fontSize: 11, opacity: 0.6 }}>
    Recolore o gradiente (Cor A/B) e também os patterns (Pattern A/B).
  </div>
</div>

<div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '10px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8 }}>Efeitos (patterns)</div>

            <Row label="Ativar efeitos">
              <Toggle active={effectsEnabled} onClick={toggleEffects} />
            </Row>

            <Row label="Tipo">
              <select
                value={effectsEnabled ? currentKind : 'none'}
                onChange={(e) => setEffectKind(e.target.value)}
                style={{
                  width: 190,
                  padding: '8px 10px',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: '#fff',
                  fontWeight: 700,
                }}
              >
                <option value="none">Nenhum</option>
                <option value="dots">Pontinhos</option>
                <option value="noise">Noise</option>
                <option value="diagonal">Linhas diagonais</option>
                <option value="grid">Grelha</option>
                <option value="silk">Silk (premium)</option>
                <option value="marble">Marble</option>
              </select>
            </Row>

            {effectsEnabled ? (
              <>
                <Row label="Blend">
                  <select
                    value={currentBlendMode}
                    onChange={(e) => patchOverlay({ blendMode: e.target.value })}
                    style={{
                      width: 190,
                      padding: '8px 10px',
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.12)',
                      background: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    <option value="soft-light">soft-light (recomendado)</option>
                    <option value="overlay">overlay</option>
                    <option value="multiply">multiply</option>
                    <option value="screen">screen</option>
                    <option value="normal">normal</option>
                  </select>
                </Row>

                <Row label="Intensidade">
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={currentOpacity}
                    onChange={(e) => patchOverlay({ opacity: Number(e.target.value) })}
                  />
                </Row>

                <Row label="Densidade">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={currentDensity}
                    onChange={(e) => patchOverlay({ density: Number(e.target.value) })}
                  />
                </Row>

                <Row label="Escala">
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={currentScale}
                    onChange={(e) => patchOverlay({ scale: Number(e.target.value) })}
                  />
                </Row>

                <Row label="Softness">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={currentSoftness}
                    onChange={(e) => patchOverlay({ softness: Number(e.target.value) })}
                  />
                </Row>

                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  Dica: “Pontinhos” + blend <b>soft-light</b> fica muito parecido ao exemplo da concorrência.
                </div>
              </>
            ) : (
              <div style={{ fontSize: 11, opacity: 0.6 }}>
                Liga os efeitos para veres “pontinhos”, “noise”, etc. (usa as tuas Pattern A/B).
              </div>
            )}
          </div>

          {/* Presets premium */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {CARD_BG_PRESETS.map((p) => {
              const { style } = bgToStyle(p.bg as any)
              return (
                <button
                  key={p.id}
                  onClick={() => onChangeCardBg(p.bg)}
                  style={{
                    borderRadius: 14,
                    border: '1px solid rgba(0,0,0,0.10)',
                    padding: 10,
                    cursor: 'pointer',
                    background: '#fff',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: '1px solid rgba(0,0,0,0.10)',
                      ...style,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ fontWeight: 900, fontSize: 12 }}>{p.name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Preset premium</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

          {/* Tipo base */}
<Row label="Tipo">
  <Button
    onClick={() =>
      onChangeCardBg({
        version: 1,
        opacity: typeof v1.opacity === 'number' ? v1.opacity : 1,
        base: { kind: 'solid', color: v1.base.kind === 'solid' ? v1.base.color : '#ffffff' },
        overlays: v1.overlays ?? [],
      })
    }
  >
    Cor
  </Button>

  <Button
    onClick={() =>
      onChangeCardBg({
        version: 1,
        opacity: typeof v1.opacity === 'number' ? v1.opacity : 1,
        base: gBase,
        overlays: v1.overlays ?? [],
      })
    }
  >
    Degradê
  </Button>

  <Button
    onClick={() =>
      onChangeCardBg({
        version: 1,
        opacity: typeof v1.opacity === 'number' ? v1.opacity : 1,
        base: {
          kind: 'image',
          url: v1.base.kind === 'image' ? v1.base.url : '',
          fit: 'cover',
          position: 'center',
          zoom: 1,
          offsetX: 0,
          offsetY: 0,
          blur: 0,
        },
        imageOverlay: { enabled: true, color: '#000000', opacity: 0.4, gradient: true, gradientDirection: 'to-bottom' },
        overlays: v1.overlays ?? [],
      })
    }
  >
    🖼 Imagem
  </Button>
</Row>


          {/* Editor de cores */}
          {v1.base.kind === 'solid' ? (
            <Row label="Cor">
              <SwatchRow
                value={v1.base.color ?? '#ffffff'}
                onChange={(hex) => onChangeCardBg({ ...v1, base: { kind: 'solid', color: hex } })}
                onEyedropper={() =>
                  pickEyedropper((hex) => onChangeCardBg({ ...v1, base: { kind: 'solid', color: hex } }))
                }
              />
            </Row>
          ) : (
            <>
              <Row label="De">
                <SwatchRow
                  value={gBase.stops?.[0]?.color ?? '#ffffff'}
                  onChange={(hex) => {
                    const stops = [...(gBase.stops ?? [])]
                    if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                    stops[0] = { ...stops[0], color: hex }
                    onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                  }}
                  onEyedropper={() =>
                    pickEyedropper((hex) => {
                      const stops = [...(gBase.stops ?? [])]
                      if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                      stops[0] = { ...stops[0], color: hex }
                      onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                    })
                  }
                />
              </Row>

              <Row label="Para">
                <SwatchRow
                  value={gBase.stops?.[gBase.stops.length - 1]?.color ?? '#f3f4f6'}
                  onChange={(hex) => {
                    const stops = [...(gBase.stops ?? [])]
                    if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                    const last = stops.length - 1
                    stops[last] = { ...stops[last], color: hex }
                    onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                  }}
                  onEyedropper={() =>
                    pickEyedropper((hex) => {
                      const stops = [...(gBase.stops ?? [])]
                      if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                      const last = stops.length - 1
                      stops[last] = { ...stops[last], color: hex }
                      onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                    })
                  }
                />
              </Row>

              <Row label="Ângulo">
                <input
                  type="number"
                  min={0}
                  max={360}
                  value={typeof gBase.angle === 'number' ? gBase.angle : 180}
                  onChange={(e) =>
                    onChangeCardBg({ ...v1, base: { ...gBase, angle: Number(e.target.value) } })
                  }
                  style={{ width: 90 }}
                />
              </Row>
            </>
          )}

          <Row label="Intensidade">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={typeof v1.opacity === 'number' ? v1.opacity : 1}
              onChange={(e) => onChangeCardBg({ ...v1, opacity: Number(e.target.value) })}
            />
          </Row>
        </Section>
      ) : null}

{/* Editor de imagem de fundo */}
{v1.base.kind === 'image' && (
  <>
    <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
    <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Imagem de fundo</div>

    <Row label="Upload">
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          try {
            const { publicUrl } = await uploadCardImage({ cardId, file, kind: 'background' })
            onChangeCardBg?.({
              ...v1,
              base: { ...(v1.base as any), kind: 'image', url: publicUrl },
            })
          } catch (err) {
            console.error('Erro ao fazer upload:', err)
          }
        }}
        style={{ fontSize: 12 }}
      />
    </Row>

    <Row label="URL">
      <input
        type="text"
        value={(v1.base as any).url ?? ''}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', url: e.target.value },
          })
        }
        placeholder="https://..."
        style={{ width: 200, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
      />
    </Row>

    <Row label="Preenchimento">
      <select
        value={(v1.base as any).fit ?? 'cover'}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', fit: e.target.value as any },
          })
        }
        style={{ width: 140, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}
      >
        <option value="cover">Cover (estica)</option>
        <option value="fixed">Fixo (parallax)</option>
        <option value="tile">Repetir (tile)</option>
        <option value="top-fade">Topo + Fade</option>
      </select>
    </Row>

    <Row label="Posição">
      <select
        value={(v1.base as any).position ?? 'center'}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', position: e.target.value as any },
          })
        }
        style={{ width: 140, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}
      >
        <option value="center">Centro</option>
        <option value="top">Topo</option>
        <option value="bottom">Baixo</option>
        <option value="left">Esquerda</option>
        <option value="right">Direita</option>
        <option value="top-left">Topo esquerdo</option>
        <option value="top-right">Topo direito</option>
        <option value="bottom-left">Baixo esquerdo</option>
        <option value="bottom-right">Baixo direito</option>
      </select>
    </Row>

    <Row label="Zoom">
  <input
    type="range"
    min={0.5}
    max={2}
    step={0.05}
    value={(v1.base as any).zoom ?? 1}
    onChange={(e) =>
      onChangeCardBg?.({
        ...v1,
        base: { ...(v1.base as any), kind: 'image', zoom: Number(e.target.value) },
      })
    }
  />
  <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{Math.round(((v1.base as any).zoom ?? 1) * 100)}%</span>
</Row>


    <Row label="Offset Y">
      <input
        type="range"
        min={-100}
        max={100}
        step={5}
        value={(v1.base as any).offsetY ?? 0}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', offsetY: Number(e.target.value) },
          })
        }
      />
      <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{(v1.base as any).offsetY ?? 0}px</span>
    </Row>

    <Row label="Offset X">
      <input
        type="range"
        min={-100}
        max={100}
        step={5}
        value={(v1.base as any).offsetX ?? 0}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', offsetX: Number(e.target.value) },
          })
        }
      />
      <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{(v1.base as any).offsetX ?? 0}px</span>
    </Row>

    <Row label="Blur">
      <input
        type="range"
        min={0}
        max={20}
        step={1}
        value={(v1.base as any).blur ?? 0}
        onChange={(e) =>
          onChangeCardBg?.({
            ...v1,
            base: { ...(v1.base as any), kind: 'image', blur: Number(e.target.value) },
          })
        }
      />
      <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{(v1.base as any).blur ?? 0}px</span>
    </Row>

    {(v1.base as any).fit === 'top-fade' && (
      <>
        <Row label="Fade para cor">
          <SwatchRow
            value={(v1.base as any).fadeToColor ?? '#000000'}
            onChange={(hex) =>
              onChangeCardBg?.({
                ...v1,
                base: { ...(v1.base as any), kind: 'image', fadeToColor: hex },
              })
            }
            onEyedropper={() =>
              pickEyedropper((hex) =>
                onChangeCardBg?.({
                  ...v1,
                  base: { ...(v1.base as any), kind: 'image', fadeToColor: hex },
                })
              )
            }
          />
        </Row>

        <Row label="Altura do fade">
          <input
            type="range"
            min={100}
            max={500}
            step={10}
            value={(v1.base as any).fadeHeight ?? 300}
            onChange={(e) =>
              onChangeCardBg?.({
                ...v1,
                base: { ...(v1.base as any), kind: 'image', fadeHeight: Number(e.target.value) },
              })
            }
          />
          <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{(v1.base as any).fadeHeight ?? 300}px</span>
        </Row>
      </>
    )}

    <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
    <div style={{ fontWeight: 900, fontSize: 12, opacity: 0.8, marginBottom: 8 }}>Overlay (escurecer)</div>

    <Row label="Ativar">
      <Toggle
        active={v1.imageOverlay?.enabled ?? false}
        onClick={() =>
          onChangeCardBg?.({
            ...v1,
            imageOverlay: { ...v1.imageOverlay, enabled: !(v1.imageOverlay?.enabled ?? false) },
          })
        }
      />
    </Row>

    {v1.imageOverlay?.enabled && (
      <>
        <Row label="Cor">
          <SwatchRow
            value={v1.imageOverlay?.color ?? '#000000'}
            onChange={(hex) =>
              onChangeCardBg?.({
                ...v1,
                imageOverlay: { ...v1.imageOverlay, color: hex },
              })
            }
            onEyedropper={() =>
              pickEyedropper((hex) =>
                onChangeCardBg?.({
                  ...v1,
                  imageOverlay: { ...v1.imageOverlay, color: hex },
                })
              )
            }
          />
        </Row>

        <Row label="Opacidade">
          <input
            type="range"
            min={0}
            max={0.9}
            step={0.05}
            value={v1.imageOverlay?.opacity ?? 0.4}
            onChange={(e) =>
              onChangeCardBg?.({
                ...v1,
                imageOverlay: { ...v1.imageOverlay, opacity: Number(e.target.value) },
              })
            }
          />
          <span style={{ fontSize: 12, opacity: 0.7, minWidth: 40 }}>{Math.round((v1.imageOverlay?.opacity ?? 0.4) * 100)}%</span>
        </Row>

        <Row label="Gradiente">
          <Toggle
            active={v1.imageOverlay?.gradient ?? false}
            onClick={() =>
              onChangeCardBg?.({
                ...v1,
                imageOverlay: { ...v1.imageOverlay, gradient: !(v1.imageOverlay?.gradient ?? false) },
              })
            }
          />
        </Row>

        {v1.imageOverlay?.gradient && (
          <Row label="Direção">
            <select
              value={v1.imageOverlay?.gradientDirection ?? 'to-bottom'}
              onChange={(e) =>
                onChangeCardBg?.({
                  ...v1,
                  imageOverlay: { ...v1.imageOverlay, gradientDirection: e.target.value as any },
                })
              }
              style={{ width: 140, padding: '8px 10px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontWeight: 700 }}
            >
              <option value="to-bottom">Para baixo</option>
              <option value="to-top">Para cima</option>
              <option value="radial">Radial</option>
            </select>
          </Row>
        )}
      </>
    )}
  </>
)}

        {/* Cor da barra do browser (mobile) */}
        <Row label="Cor da barra (mobile)">
          <SwatchRow
            value={v1.browserBarColor ?? "#000000"}
            onChange={(hex) =>
              onChangeCardBg?.({
                ...v1,
                browserBarColor: hex,
              })
            }
            onEyedropper={openEyedropperOverlay}
          />
        </Row>



      {/* Fundo do header (bloco) */}
      <Section title="Fundo do header (bloco)">
        <Row label="Ativar">
          <Toggle
            active={headerBgEnabled}
            onClick={() => setLayout({ ...(layout as any), headerBgEnabled: !headerBgEnabled } as any)}
          />
        </Row>

        {headerBgEnabled ? (
          <Row label="Cor">
            <SwatchRow
              value={headerBgColor}
              onChange={(hex) => setLayout({ ...(layout as any), headerBgColor: hex } as any)}
              onEyedropper={openEyedropperHeaderBg}
            />
          </Row>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Ativa para definir uma cor base do header (fica por trás do cover).
          </div>
        )}
      </Section>

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

      <Section title="Cover (moldura + layout)">
        <Row label="Modo">
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'full' } as any)}>Full</Button>
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'tile' } as any)}>Moldura</Button>
          <Button onClick={() => setLayout({ ...(layout as any), coverMode: 'auto' } as any)}>Auto</Button>
        </Row>

        {(layout as any)?.coverMode === 'auto' && (
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
            Auto mostra a imagem inteira e preenche o fundo com blur.
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
          <div style={{ fontSize: 12, opacity: 0.7 }}>Full: a cover ocupa a largura toda do cartão.</div>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)' }} />

        <Row label="Altura">
          <Button onClick={() => setLayout({ height: 180 })}>180</Button>
          <Button onClick={() => setLayout({ height: 220 })}>220</Button>
          <Button onClick={() => setLayout({ height: 260 })}>260</Button>
        </Row>

        <Row label="Altura (fine)">
          <input
            type="range"
            min={120}
            max={420}
            step={5}
            value={height}
            onChange={(e) => setLayout({ height: Number(e.target.value) } as any)}
          />
        </Row>

        <Row label="Overlay">
          <Toggle active={overlayEnabled} onClick={() => setLayout({ overlay: !overlayEnabled } as any)} />
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

            <Row label="Degradê">
              <Toggle
                active={overlayGradient}
                onClick={() => setLayout({ ...(layout as any), overlayGradient: !overlayGradient } as any)}
              />
            </Row>

            <Row label="Fade para baixo">
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

               <Row label="Intensidade (fine)">
  <input
    type="range"
    min={0}
    max={100}
    step={1}
    value={coverFadeStrength}
    onChange={(e) => {
      const nextLayout = {
        ...layout,
        coverFadeStrength: Number(e.target.value),
      }
      setLayout(nextLayout)
    }}
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

            <Row label="Opacidade (fine)">
              <input
                type="range"
                min={0}
                max={0.8}
                step={0.05}
                value={overlayOpacity}
                onChange={(e) => setLayout({ overlayOpacity: Number(e.target.value) } as any)}
              />
            </Row>
          </>
        ) : null}

        <Row label="Largura">
          <Button onClick={() => setLayout({ widthMode: 'full' } as any)}>Full</Button>
          <Button onClick={() => setLayout({ widthMode: 'fixed' } as any)}>Fixa</Button>
          <Button onClick={() => setLayout({ widthMode: 'custom' } as any)}>Custom</Button>
        </Row>

        {widthMode === 'custom' && (
          <Row label="Largura (px)">
            <input
              type="number"
              min={200}
              max={1920}
              value={customWidthPx}
              onChange={(e) => setLayout({ customWidthPx: Number(e.target.value) } as any)}
              style={{ width: 90 }}
            />
          </Row>
        )}
      </Section>

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
                onChange={(e) =>
                  setLayout({ ...(layout as any), badge: { ...badge, position: e.target.value } } as any)
                }
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
                onClick={() => setLayout({ ...(layout as any), badge: { ...badge, bgEnabled: !badgeBgEnabled } } as any)}
              />
            </Row>

            {badgeBgEnabled ? (
              <Row label="Cor do fundo">
                <SwatchRow
                  value={badgeBgColor}
                  onChange={(hex) => setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any)}
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
                onClick={() => setLayout({ ...(layout as any), badge: { ...badge, shadow: !badgeShadow } } as any)}
              />
            </Row>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.7 }}>Liga para colocar uma marca/logo por cima do header.</div>
        )}
      </Section>

      <Section title="Avatar (layout)">
        <Row label="Posição">
          <Button onClick={() => setLayout({ avatarDock: 'overlap' } as any)}>Overlap</Button>
          <Button onClick={() => setLayout({ avatarDock: 'inline' } as any)}>Inline</Button>
        </Row>
      </Section>
    </div>
  )
}

// =======================
// BG recolor helpers (single source)
// =======================

function bg_hexToRgb(hex: string) {
  const h = hex.replace('#', '').trim()
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function bg_rgbToHex(r: number, g: number, b: number) {
  const to = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

function bg_lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

/** Recolore os stops mantendo posições (CorA no 0% → CorB no 100%) */
function bg_recolorStops(stops: { color: string; pos?: number }[], colorA: string, colorB: string) {
  const A = bg_hexToRgb(colorA)
  const B = bg_hexToRgb(colorB)

  return (stops || []).map((s) => {
    const p = typeof s.pos === 'number' ? s.pos : 0
    const t = Math.max(0, Math.min(1, p / 100))
    return {
      ...s,
      color: bg_rgbToHex(
        bg_lerp(A.r, B.r, t),
        bg_lerp(A.g, B.g, t),
        bg_lerp(A.b, B.b, t)
      ),
    }
  })
}

/** Aplica Pattern A/B em overlays que suportem colorA/colorB */
function bg_recolorOverlays(overlays: any[] | undefined, patternA: string, patternB: string) {
  return (overlays || []).map((ov) => ({
    ...ov,
    colorA: patternA,
    colorB: patternB,
  }))
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
