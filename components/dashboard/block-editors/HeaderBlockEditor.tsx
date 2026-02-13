'use client'

import { useRef, useState } from 'react'
import type { HeaderSettings } from '@/components/blocks/HeaderBlock'
import { uploadCardImage } from '@/lib/uploadCardImage'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import type { CardBgV1 } from '@/lib/cardBg'
import { CARD_BG_PRESETS } from '@/lib/bgPresets'
import { bgToStyle } from '@/lib/bgToCss'
import { migrateCardBg } from '@/lib/cardBg'
import { useLanguage } from '@/components/language/LanguageProvider'

type BadgePos = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

type Props = {
  cardId: string
  settings: HeaderSettings
  onChange: (s: HeaderSettings) => void
  cardBg?: CardBgV1
  onChangeCardBg?: (bg: CardBgV1) => void
}

// Lista expandida de patterns/efeitos
const PATTERN_OPTIONS = [
  { value: 'none', label: 'Nenhum', category: 'none' },
  // Geométricos
  { value: 'dots', label: 'Pontinhos', category: 'geometric' },
  { value: 'grid', label: 'Grelha', category: 'geometric' },
  { value: 'diagonal', label: 'Linhas diagonais', category: 'geometric' },
  { value: 'hexagons', label: 'Hexágonos', category: 'geometric' },
  { value: 'triangles', label: 'Triângulos', category: 'geometric' },
  { value: 'squares', label: 'Quadrados', category: 'geometric' },
  { value: 'diamonds', label: 'Diamantes', category: 'geometric' },
  { value: 'chevrons', label: 'Chevrons', category: 'geometric' },
  // Orgânicos
  { value: 'noise', label: 'Noise', category: 'organic' },
  { value: 'marble', label: 'Mármore', category: 'organic' },
  { value: 'silk', label: 'Silk', category: 'organic' },
  { value: 'waves', label: 'Ondas', category: 'organic' },
  { value: 'clouds', label: 'Nuvens', category: 'organic' },
  { value: 'smoke', label: 'Fumo', category: 'organic' },
  // Decorativos
  { value: 'confetti', label: 'Confetti', category: 'decorative' },
  { value: 'stars', label: 'Estrelas', category: 'decorative' },
  { value: 'sparkles', label: 'Brilhos', category: 'decorative' },
  { value: 'bubbles', label: 'Bolhas', category: 'decorative' },
  { value: 'circles', label: 'Círculos', category: 'decorative' },
  // Linhas
  { value: 'horizontal', label: 'Linhas horizontais', category: 'lines' },
  { value: 'vertical', label: 'Linhas verticais', category: 'lines' },
  { value: 'crosshatch', label: 'Crosshatch', category: 'lines' },
  { value: 'zigzag', label: 'Zigzag', category: 'lines' },
]

const BLEND_MODES = [
  { value: 'soft-light', label: 'Soft Light (recomendado)' },
  { value: 'overlay', label: 'Overlay' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
  { value: 'color-dodge', label: 'Color Dodge' },
  { value: 'color-burn', label: 'Color Burn' },
  { value: 'hard-light', label: 'Hard Light' },
  { value: 'difference', label: 'Difference' },
  { value: 'exclusion', label: 'Exclusion' },
  { value: 'normal', label: 'Normal' },
]

export default function HeaderBlockEditor({ cardId, settings, onChange, cardBg, onChangeCardBg }: Props) {
  const coverRef = useRef<HTMLInputElement>(null)
  const badgeRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadingBadge, setUploadingBadge] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('base')

  const { openPicker } = useColorPicker()
  const { t } = useLanguage()

  const layout = settings.layout ?? {}

  const v1 = migrateCardBg(cardBg ?? ({ mode: 'solid', color: '#ffffff', opacity: 1 } as any))

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
      layout: { ...layout, ...patch },
    })

  const pickEyedropper = (apply: (hex: string) => void) => {
    openPicker({ mode: 'eyedropper', onPick: apply })
  }

  // Upload handlers
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

  // Pattern/Effects helpers
  const currentOverlay = (v1.overlays?.[0] ?? null) as any
  const effectsEnabled = !!currentOverlay
  const currentKind: string = currentOverlay?.kind ?? 'none'
  const currentOpacity: number = currentOverlay?.opacity ?? 0.25
  const currentDensity: number = currentOverlay?.density ?? 0.55
  const currentScale: number = currentOverlay?.scale ?? 1
  const currentSoftness: number = currentOverlay?.softness ?? 0.5
  const currentBlendMode: string = currentOverlay?.blendMode ?? 'soft-light'
  const currentColorA: string = currentOverlay?.colorA ?? '#ffffff'
  const currentColorB: string = currentOverlay?.colorB ?? '#000000'
  const currentAngle: number = currentOverlay?.angle ?? 45

  function setOverlays(next: any[] | undefined) {
    onChangeCardBg?.({ ...v1, overlays: next ?? [] })
  }

  function setEffectKind(kind: string) {
    if (kind === 'none') {
      setOverlays([])
      return
    }
    const base = currentOverlay ?? {
      opacity: 0.25,
      density: 0.6,
      scale: 1,
      softness: 0.5,
      angle: 45,
      blendMode: 'soft-light',
      colorA: '#ffffff',
      colorB: '#000000',
    }
    setOverlays([{ ...base, kind }])
  }

  function patchOverlay(patch: any) {
    if (!currentOverlay) {
      setOverlays([{ kind: 'dots', opacity: 0.25, density: 0.6, scale: 1, softness: 0.5, angle: 45, blendMode: 'soft-light', colorA: '#ffffff', colorB: '#000000', ...patch }])
      return
    }
    setOverlays([{ ...currentOverlay, ...patch }])
  }

  // Layout values
  const coverMode = (layout as any)?.coverMode ?? 'tile'
  const tileRadius = (layout as any)?.tileRadius ?? 18
  const tilePadding = (layout as any)?.tilePadding ?? 10
  const overlayEnabled = layout?.overlay === true
  const overlayOpacity = layout?.overlayOpacity ?? 0.25
  const overlayColor = (layout as any)?.overlayColor ?? '#000000'
  const overlayGradient = (layout as any)?.overlayGradient === true
  const coverFadeEnabled = (layout as any)?.coverFadeEnabled === true
  const coverFadeStrength = (layout as any)?.coverFadeStrength ?? 50
  const coverFadeHeightPx = (layout as any)?.coverFadeHeightPx ?? 120
  const headerBgEnabled = (layout as any)?.headerBgEnabled === true
  const headerBgColor = (layout as any)?.headerBgColor ?? '#ffffff'
  const height = (layout as any)?.height ?? 220
  const widthMode = (layout as any)?.widthMode ?? 'full'
  const customWidthPx = (layout as any)?.customWidthPx ?? 720

  // Badge
  const badge = (layout as any)?.badge ?? {}
  const badgeEnabled = badge?.enabled === true
  const badgePos: BadgePos = badge?.position ?? 'top-right'
  const badgeSizePx = badge?.sizePx ?? 56
  const badgeOffsetX = badge?.offsetX ?? 10
  const badgeOffsetY = badge?.offsetY ?? 10
  const badgeBgEnabled = badge?.bgEnabled === true
  const badgeBgColor = badge?.bgColor ?? 'rgba(255,255,255,0.85)'
  const badgeRadiusPx = badge?.radiusPx ?? 12
  const badgeShadow = badge?.shadow === true

  const fallbackFadeColor = (() => {
    if (headerBgEnabled) return headerBgColor
    if (v1.base.kind === 'solid') return v1.base.color ?? '#ffffff'
    if (v1.base.kind === 'gradient') return v1.base.stops?.[v1.base.stops.length - 1]?.color ?? '#ffffff'
    return '#ffffff'
  })()
  const coverFadeColor = (layout as any)?.coverFadeColor ?? fallbackFadeColor

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== SECÇÃO 1: BASE DO FUNDO ========== */}
      {cardBg && onChangeCardBg && (
        <CollapsibleSection
          title="🎨 Base do fundo"
          subtitle={t('header_editor.section_base_subtitle')}
          isOpen={activeSection === 'base'}
          onToggle={() => setActiveSection(activeSection === 'base' ? null : 'base')}
        >
          {/* Tipo de fundo */}
          <Row label={t('header_editor.label_type')}>
            <div style={{ display: 'flex', gap: 6 }}>
              <MiniButton
                active={v1.base.kind === 'solid'}
                onClick={() =>
                  onChangeCardBg({
                    ...v1,
                    base: { kind: 'solid', color: v1.base.kind === 'solid' ? v1.base.color : '#ffffff' },
                  })
                }
              >
                Cor
              </MiniButton>
              <MiniButton
                active={v1.base.kind === 'gradient'}
                onClick={() => onChangeCardBg({ ...v1, base: gBase })}
              >
                Degradê
              </MiniButton>
              <MiniButton
                active={v1.base.kind === 'image'}
                onClick={() =>
                  onChangeCardBg({
                    ...v1,
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
                  })
                }
              >
                🖼 Imagem
              </MiniButton>
            </div>
          </Row>

          {/* Cor sólida */}
          {v1.base.kind === 'solid' && (
            <Row label={t('header_editor.label_color')}>
              <ColorPickerPro
                value={v1.base.color ?? '#ffffff'}
                onChange={(val) => onChangeCardBg({ ...v1, base: { kind: 'solid', color: val } })}
                onEyedropper={() => pickEyedropper((hex) => onChangeCardBg({ ...v1, base: { kind: 'solid', color: hex } }))}
              />
            </Row>
          )}

          {/* Degradê */}
          {v1.base.kind === 'gradient' && (
            <>
              <Row label={t('header_editor.label_start_color')}>
                <ColorPickerPro
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

              <Row label={t('header_editor.label_end_color')}>
                <ColorPickerPro
                  value={gBase.stops?.[gBase.stops.length - 1]?.color ?? '#f3f4f6'}
                  onChange={(hex) => {
                    const stops = [...(gBase.stops ?? [])]
                    if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                    stops[stops.length - 1] = { ...stops[stops.length - 1], color: hex }
                    onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                  }}
                  onEyedropper={() =>
                    pickEyedropper((hex) => {
                      const stops = [...(gBase.stops ?? [])]
                      if (!stops.length) stops.push({ color: '#ffffff', pos: 0 }, { color: '#f3f4f6', pos: 100 })
                      stops[stops.length - 1] = { ...stops[stops.length - 1], color: hex }
                      onChangeCardBg({ ...v1, base: { ...gBase, stops } })
                    })
                  }
                />
              </Row>

              <Row label="Ângulo">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={gBase.angle ?? 180}
                  onChange={(e) => onChangeCardBg({ ...v1, base: { ...gBase, angle: Number(e.target.value) } })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{gBase.angle ?? 180}°</span>
              </Row>
            </>
          )}

          {/* Imagem */}
          {v1.base.kind === 'image' && (
            <>
              <Row label={t('header_editor.label_upload')}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    try {
                      const { publicUrl } = await uploadCardImage({ cardId, file, kind: 'background' })
                      onChangeCardBg({ ...v1, base: { ...(v1.base as any), kind: 'image', url: publicUrl } })
                    } catch (err) {
                      console.error('Erro ao fazer upload:', err)
                    }
                  }}
                  style={{ fontSize: 12 }}
                />
              </Row>

              <Row label={t('header_editor.label_fill')}>
                <select
                  value={(v1.base as any).fit ?? 'cover'}
                  onChange={(e) => onChangeCardBg({ ...v1, base: { ...(v1.base as any), fit: e.target.value } })}
                  style={selectStyle}
                >
                  <option value="cover">{t('header_editor.option_cover')}</option>
                  <option value="fixed">Fixo (parallax)</option>
                  <option value="tile">Repetir</option>
                  <option value="top-fade">Topo + Fade</option>
                </select>
              </Row>

              <Row label={t('header_editor.label_position')}>
                <select
                  value={(v1.base as any).position ?? 'center'}
                  onChange={(e) => onChangeCardBg({ ...v1, base: { ...(v1.base as any), position: e.target.value } })}
                  style={selectStyle}
                >
                  <option value="center">Centro</option>
                  <option value="top">Topo</option>
                  <option value="bottom">Baixo</option>
                </select>
              </Row>

              <Row label={t('header_editor.label_zoom')}>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={(v1.base as any).zoom ?? 1}
                  onChange={(e) => onChangeCardBg({ ...v1, base: { ...(v1.base as any), zoom: Number(e.target.value) } })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{Math.round(((v1.base as any).zoom ?? 1) * 100)}%</span>
              </Row>

              <Row label={t('header_editor.label_blur')}>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={1}
                  value={(v1.base as any).blur ?? 0}
                  onChange={(e) => onChangeCardBg({ ...v1, base: { ...(v1.base as any), blur: Number(e.target.value) } })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{(v1.base as any).blur ?? 0}px</span>
              </Row>

              {/* Image overlay */}
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />
              <Row label={t('header_editor.label_darken_image')}>
                <Toggle
                  active={v1.imageOverlay?.enabled ?? false}
                  onClick={() => onChangeCardBg({ ...v1, imageOverlay: { ...v1.imageOverlay, enabled: !(v1.imageOverlay?.enabled ?? false) } })}
                />
              </Row>

              {v1.imageOverlay?.enabled && (
                <>
                  <Row label={t('header_editor.label_overlay_color')}>
                    <ColorPickerPro
                      value={v1.imageOverlay?.color ?? '#000000'}
                      onChange={(hex) => onChangeCardBg({ ...v1, imageOverlay: { ...v1.imageOverlay, color: hex } })}
                      onEyedropper={() => pickEyedropper((hex) => onChangeCardBg({ ...v1, imageOverlay: { ...v1.imageOverlay, color: hex } }))}
                    />
                  </Row>
                  <Row label={t('header_editor.label_opacity')}>
                    <input
                      type="range"
                      min={0}
                      max={0.9}
                      step={0.05}
                      value={v1.imageOverlay?.opacity ?? 0.4}
                      onChange={(e) => onChangeCardBg({ ...v1, imageOverlay: { ...v1.imageOverlay, opacity: Number(e.target.value) } })}
                      style={{ flex: 1 }}
                    />
                    <span style={rightNum}>{Math.round((v1.imageOverlay?.opacity ?? 0.4) * 100)}%</span>
                  </Row>
                </>
              )}
            </>
          )}

          {/* Opacidade geral */}
          <Row label={t('header_editor.label_overall_intensity')}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={v1.opacity ?? 1}
              onChange={(e) => onChangeCardBg({ ...v1, opacity: Number(e.target.value) })}
              style={{ flex: 1 }}
            />
            <span style={rightNum}>{Math.round((v1.opacity ?? 1) * 100)}%</span>
          </Row>

          {/* Cor da barra do browser */}
          <Row label={t('header_editor.label_mobile_bar_color')}>
            <ColorPickerPro
              value={v1.browserBarColor ?? '#000000'}
              onChange={(hex) => onChangeCardBg({ ...v1, browserBarColor: hex })}
              onEyedropper={() => pickEyedropper((hex) => onChangeCardBg({ ...v1, browserBarColor: hex }))}
            />
          </Row>
        </CollapsibleSection>
      )}

      {/* ========== SECÇÃO 2: PATTERNS/EFEITOS ========== */}
      {cardBg && onChangeCardBg && (
        <CollapsibleSection
          title="✨ Patterns & Efeitos"
          subtitle={t('header_editor.section_patterns_subtitle')}
          isOpen={activeSection === 'patterns'}
          onToggle={() => setActiveSection(activeSection === 'patterns' ? null : 'patterns')}
        >
          <Row label={t('header_editor.label_effect')}>
            <select
              value={currentKind}
              onChange={(e) => setEffectKind(e.target.value)}
              style={{ ...selectStyle, width: '100%' }}
            >
              <optgroup label="— Sem efeito —">
                <option value="none">{t('header_editor.option_none')}</option>
              </optgroup>
              <optgroup label="🔷 Geométricos">
                {PATTERN_OPTIONS.filter(p => p.category === 'geometric').map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="🌊 Orgânicos">
                {PATTERN_OPTIONS.filter(p => p.category === 'organic').map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="🎉 Decorativos">
                {PATTERN_OPTIONS.filter(p => p.category === 'decorative').map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
              <optgroup label="📏 Linhas">
                {PATTERN_OPTIONS.filter(p => p.category === 'lines').map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </optgroup>
            </select>
          </Row>

          {effectsEnabled && (
            <>
              <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

              <Row label={t('header_editor.label_color_a')}>
                <ColorPickerPro
                  value={currentColorA}
                  onChange={(hex) => patchOverlay({ colorA: hex })}
                  onEyedropper={() => pickEyedropper((hex) => patchOverlay({ colorA: hex }))}
                />
              </Row>

              <Row label={t('header_editor.label_color_b')}>
                <ColorPickerPro
                  value={currentColorB}
                  onChange={(hex) => patchOverlay({ colorB: hex })}
                  onEyedropper={() => pickEyedropper((hex) => patchOverlay({ colorB: hex }))}
                />
              </Row>

              <Row label={t('header_editor.label_blend_mode')}>
                <select
                  value={currentBlendMode}
                  onChange={(e) => patchOverlay({ blendMode: e.target.value })}
                  style={selectStyle}
                >
                  {BLEND_MODES.map(b => (
                    <option key={b.value} value={b.value}>{b.label}</option>
                  ))}
                </select>
              </Row>

              <Row label={t('header_editor.label_opacity')}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={currentOpacity}
                  onChange={(e) => patchOverlay({ opacity: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{Math.round(currentOpacity * 100)}%</span>
              </Row>

              <Row label={t('header_editor.label_density')}>
                <input
                  type="range"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={currentDensity}
                  onChange={(e) => patchOverlay({ density: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{Math.round(currentDensity * 100)}%</span>
              </Row>

              <Row label={t('header_editor.label_scale')}>
                <input
                  type="range"
                  min={0.3}
                  max={3}
                  step={0.1}
                  value={currentScale}
                  onChange={(e) => patchOverlay({ scale: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{currentScale.toFixed(1)}x</span>
              </Row>

              <Row label={t('header_editor.label_smoothness')}>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={currentSoftness}
                  onChange={(e) => patchOverlay({ softness: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{Math.round(currentSoftness * 100)}%</span>
              </Row>

              <Row label="Ângulo">
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={currentAngle}
                  onChange={(e) => patchOverlay({ angle: Number(e.target.value) })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{currentAngle}°</span>
              </Row>

              <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
                {t('header_editor.tip_dots')}
              </div>
            </>
          )}
        </CollapsibleSection>
      )}

      {/* ========== SECÇÃO 3: PRESETS RÁPIDOS ========== */}
      {cardBg && onChangeCardBg && (
        <CollapsibleSection
          title="⚡ Presets rápidos"
          subtitle={t('header_editor.section_presets_subtitle')}
          isOpen={activeSection === 'presets'}
          onToggle={() => setActiveSection(activeSection === 'presets' ? null : 'presets')}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {CARD_BG_PRESETS.map((p) => {
              const { style } = bgToStyle(p.bg as any)
              return (
                <button
                  key={p.id}
                  onClick={() => onChangeCardBg(p.bg)}
                  style={{
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.10)',
                    padding: 8,
                    cursor: 'pointer',
                    background: '#fff',
                    textAlign: 'left',
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.10)',
                      flexShrink: 0,
                      ...style,
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.5 }}>Preset</div>
                  </div>
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 8 }}>
            {t('header_editor.tip_presets')}
          </div>
        </CollapsibleSection>
      )}

      {/* ========== SECÇÃO 4: COVER (IMAGEM DO HEADER) ========== */}
      <CollapsibleSection
        title="🖼 Cover do header"
        subtitle={t('header_editor.section_cover_subtitle')}
        isOpen={activeSection === 'cover'}
        onToggle={() => setActiveSection(activeSection === 'cover' ? null : 'cover')}
      >
        <Row label={t('header_editor.label_show_cover')}>
          <Toggle active={layout?.showCover !== false} onClick={() => setLayout({ showCover: !(layout?.showCover !== false) })} />
        </Row>

        {layout?.showCover !== false && (
          <>
            <Row label={t('header_editor.label_image')}>
              <Button onClick={() => coverRef.current?.click()}>
                {uploading ? 'A enviar...' : '📷 Alterar'}
              </Button>
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
            </Row>

            <Row label={t('header_editor.label_mode')}>
              <div style={{ display: 'flex', gap: 6 }}>
                <MiniButton active={coverMode === 'full'} onClick={() => setLayout({ ...(layout as any), coverMode: 'full' } as any)}>Full</MiniButton>
                <MiniButton active={coverMode === 'tile'} onClick={() => setLayout({ ...(layout as any), coverMode: 'tile' } as any)}>Moldura</MiniButton>
                <MiniButton active={coverMode === 'auto'} onClick={() => setLayout({ ...(layout as any), coverMode: 'auto' } as any)}>Auto</MiniButton>
              </div>
            </Row>

            {coverMode === 'tile' && (
              <>
                <Row label={t('header_editor.label_radius')}>
                  <input
                    type="range"
                    min={0}
                    max={32}
                    step={1}
                    value={tileRadius}
                    onChange={(e) => setLayout({ ...(layout as any), tileRadius: Number(e.target.value) } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{tileRadius}px</span>
                </Row>
                <Row label={t('header_editor.label_padding')}>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    step={1}
                    value={tilePadding}
                    onChange={(e) => setLayout({ ...(layout as any), tilePadding: Number(e.target.value) } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{tilePadding}px</span>
                </Row>
              </>
            )}

            <Row label={t('header_editor.label_height')}>
              <input
                type="range"
                min={120}
                max={420}
                step={10}
                value={height}
                onChange={(e) => setLayout({ height: Number(e.target.value) } as any)}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{height}px</span>
            </Row>

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

            <Row label={t('header_editor.label_dark_overlay')}>
              <Toggle active={overlayEnabled} onClick={() => setLayout({ overlay: !overlayEnabled } as any)} />
            </Row>

            {overlayEnabled && (
              <>
                <Row label={t('header_editor.label_overlay_color')}>
                  <ColorPickerPro
                    value={overlayColor}
                    onChange={(hex) => setLayout({ ...(layout as any), overlayColor: hex } as any)}
                    onEyedropper={() => pickEyedropper((hex) => setLayout({ ...(layout as any), overlayColor: hex } as any))}
                  />
                </Row>

                <Row label={t('header_editor.label_opacity')}>
                  <input
                    type="range"
                    min={0}
                    max={0.8}
                    step={0.05}
                    value={overlayOpacity}
                    onChange={(e) => setLayout({ overlayOpacity: Number(e.target.value) } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{Math.round(overlayOpacity * 100)}%</span>
                </Row>

                <Row label={t('header_editor.label_gradient')}>
                  <Toggle
                    active={overlayGradient}
                    onClick={() => setLayout({ ...(layout as any), overlayGradient: !overlayGradient } as any)}
                  />
                </Row>
              </>
            )}

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

            <Row label={t('header_editor.label_fade_down')}>
              <Toggle
                active={coverFadeEnabled}
                onClick={() => setLayout({ ...(layout as any), coverFadeEnabled: !coverFadeEnabled } as any)}
              />
            </Row>

            {coverFadeEnabled && (
              <>
                <Row label={t('header_editor.label_fade_color')}>
                  <ColorPickerPro
                    value={coverFadeColor}
                    onChange={(hex) => setLayout({ ...(layout as any), coverFadeColor: hex } as any)}
                    onEyedropper={() => pickEyedropper((hex) => setLayout({ ...(layout as any), coverFadeColor: hex } as any))}
                  />
                </Row>

                <Row label={t('header_editor.label_intensity')}>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={coverFadeStrength}
                    onChange={(e) => setLayout({ ...(layout as any), coverFadeStrength: Number(e.target.value) } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{coverFadeStrength}%</span>
                </Row>

                <Row label={t('header_editor.label_fade_height')}>
                  <input
                    type="range"
                    min={20}
                    max={320}
                    step={10}
                    value={coverFadeHeightPx}
                    onChange={(e) => setLayout({ ...(layout as any), coverFadeHeightPx: Number(e.target.value) } as any)}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{coverFadeHeightPx}px</span>
                </Row>
              </>
            )}

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

            <Row label={t('header_editor.label_width')}>
              <div style={{ display: 'flex', gap: 6 }}>
                <MiniButton active={widthMode === 'full'} onClick={() => setLayout({ widthMode: 'full' } as any)}>Full</MiniButton>
                <MiniButton active={widthMode === 'fixed'} onClick={() => setLayout({ widthMode: 'fixed' } as any)}>Fixa</MiniButton>
                <MiniButton active={widthMode === 'custom'} onClick={() => setLayout({ widthMode: 'custom' } as any)}>Custom</MiniButton>
              </div>
            </Row>

            {widthMode === 'custom' && (
              <Row label={t('header_editor.label_width_px')}>
                <input
                  type="number"
                  min={200}
                  max={1920}
                  value={customWidthPx}
                  onChange={(e) => setLayout({ customWidthPx: Number(e.target.value) } as any)}
                  style={{ width: 90, padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)' }}
                />
              </Row>
            )}
          </>
        )}
      </CollapsibleSection>

      {/* ========== SECÇÃO 5: FUNDO DO HEADER (BLOCO) ========== */}
      <CollapsibleSection
        title="🎯 Fundo do bloco header"
        subtitle={t('header_editor.section_backdrop_subtitle')}
        isOpen={activeSection === 'headerBg'}
        onToggle={() => setActiveSection(activeSection === 'headerBg' ? null : 'headerBg')}
      >
        <Row label={t('header_editor.label_enable')}>
          <Toggle
            active={headerBgEnabled}
            onClick={() => setLayout({ ...(layout as any), headerBgEnabled: !headerBgEnabled } as any)}
          />
        </Row>

        {headerBgEnabled && (
          <Row label={t('header_editor.label_color')}>
            <ColorPickerPro
              value={headerBgColor}
              onChange={(hex) => setLayout({ ...(layout as any), headerBgColor: hex } as any)}
              onEyedropper={() => pickEyedropper((hex) => setLayout({ ...(layout as any), headerBgColor: hex } as any))}
            />
          </Row>
        )}

        {!headerBgEnabled && (
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            Ativa para definir uma cor base do header (fica por trás do cover).
          </div>
        )}
      </CollapsibleSection>

      {/* ========== SECÇÃO 6: BADGE ========== */}
      <CollapsibleSection
        title="🏷 Badge / Logo"
        subtitle={t('header_editor.section_watermark_subtitle')}
        isOpen={activeSection === 'badge'}
        onToggle={() => setActiveSection(activeSection === 'badge' ? null : 'badge')}
      >
        <Row label={t('header_editor.label_enable')}>
          <Toggle
            active={badgeEnabled}
            onClick={() => setLayout({ ...(layout as any), badge: { ...badge, enabled: !badgeEnabled } } as any)}
          />
        </Row>

        {badgeEnabled ? (
          <>
            <Row label={t('header_editor.label_upload')}>
              <Button onClick={() => badgeRef.current?.click()}>
                {uploadingBadge ? 'A enviar...' : '📷 Upload'}
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
                placeholder="https://..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', fontSize: 12 }}
              />
            </Row>

            <Row label={t('header_editor.label_position')}>
              <select
                value={badgePos}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, position: e.target.value } } as any)}
                style={selectStyle}
              >
                <option value="top-left">Topo esquerdo</option>
                <option value="top-right">Topo direito</option>
                <option value="bottom-left">Baixo esquerdo</option>
                <option value="bottom-right">Baixo direito</option>
              </select>
            </Row>

            <Row label={t('header_editor.label_size')}>
              <input
                type="range"
                min={24}
                max={120}
                step={4}
                value={badgeSizePx}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, sizePx: Number(e.target.value) } } as any)}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{badgeSizePx}px</span>
            </Row>

            <Row label={t('header_editor.label_offset_x')}>
              <input
                type="range"
                min={-20}
                max={40}
                step={2}
                value={badgeOffsetX}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, offsetX: Number(e.target.value) } } as any)}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{badgeOffsetX}px</span>
            </Row>

            <Row label={t('header_editor.label_offset_y')}>
              <input
                type="range"
                min={-20}
                max={40}
                step={2}
                value={badgeOffsetY}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, offsetY: Number(e.target.value) } } as any)}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{badgeOffsetY}px</span>
            </Row>

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

            <Row label={t('header_editor.label_pill_bg')}>
              <Toggle
                active={badgeBgEnabled}
                onClick={() => setLayout({ ...(layout as any), badge: { ...badge, bgEnabled: !badgeBgEnabled } } as any)}
              />
            </Row>

            {badgeBgEnabled && (
              <Row label={t('header_editor.label_bg_color')}>
                <ColorPickerPro
                  value={badgeBgColor}
                  onChange={(hex) => setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any)}
                  onEyedropper={() => pickEyedropper((hex) => setLayout({ ...(layout as any), badge: { ...badge, bgColor: hex } } as any))}
                />
              </Row>
            )}

            <Row label={t('header_editor.label_radius')}>
              <input
                type="range"
                min={0}
                max={64}
                step={2}
                value={badgeRadiusPx}
                onChange={(e) => setLayout({ ...(layout as any), badge: { ...badge, radiusPx: Number(e.target.value) } } as any)}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{badgeRadiusPx}px</span>
            </Row>

            <Row label={t('header_editor.label_shadow')}>
              <Toggle
                active={badgeShadow}
                onClick={() => setLayout({ ...(layout as any), badge: { ...badge, shadow: !badgeShadow } } as any)}
              />
            </Row>
          </>
        ) : (
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            Liga para colocar uma marca/logo por cima do header.
          </div>
        )}
      </CollapsibleSection>

      {/* ========== SECÇÃO 7: AVATAR LAYOUT ========== */}
      <CollapsibleSection
        title="👤 Layout do avatar"
        subtitle={t('header_editor.section_avatar_position_subtitle')}
        isOpen={activeSection === 'avatar'}
        onToggle={() => setActiveSection(activeSection === 'avatar' ? null : 'avatar')}
      >
        <Row label={t('header_editor.label_position')}>
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton
              active={(layout as any)?.avatarDock === 'overlap' || !(layout as any)?.avatarDock}
              onClick={() => setLayout({ avatarDock: 'overlap' } as any)}
            >
              Overlap
            </MiniButton>
            <MiniButton
              active={(layout as any)?.avatarDock === 'inline'}
              onClick={() => setLayout({ avatarDock: 'inline' } as any)}
            >
              Inline
            </MiniButton>
          </div>
        </Row>
        <div style={{ fontSize: 11, opacity: 0.6 }}>
          Overlap: avatar sobrepõe o cover. Inline: avatar abaixo do cover.
        </div>
      </CollapsibleSection>

    </div>
  )
}

// =======================
// Componentes auxiliares
// =======================

const rightNum: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  minWidth: 45,
  textAlign: 'right',
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontWeight: 600,
  fontSize: 12,
  minWidth: 130,
}

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.10)',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 12,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)',
        background: active ? 'rgba(59,130,246,0.1)' : '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 11,
        color: active ? '#3b82f6' : '#333',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: active ? '#3b82f6' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}
