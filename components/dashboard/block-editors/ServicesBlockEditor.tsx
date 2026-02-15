// components/dashboard/block-editors/ServicesBlockEditor.tsx
'use client'

import React, { useMemo, useRef, useState } from 'react'

import { supabase } from '@/lib/supabaseClient'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import { useLanguage } from '@/components/language/LanguageProvider'
import SwatchRow from '@/components/editor/SwatchRow'
import FontPicker from '@/components/editor/FontPicker'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'

export type ServiceItem = {
  id: string
  enabled: boolean
  imageSrc?: string
  imageAlt?: string
  title: string
  price?: string
  subtitle?: string
  description?: string
  actionType: 'link' | 'modal' | 'none'
  actionLabel?: string
  actionUrl?: string
  details?: string
  features?: string[]
}

export type ServicesSettings = {
  heading?: string
  layout?: 'grid' | 'list' | 'carousel'
  carousel?: {
    autoplay?: boolean
    autoplayIntervalMs?: number
    showDots?: boolean
    showArrows?: boolean
    arrowsDesktopOnly?: boolean
  }
  items?: ServiceItem[]
}

export type ServicesStyle = {
  offsetY?: number

  // título (igual ao SocialBlock)
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'
  headingFontSize?: number

  container?: {
    bgColor?: string // 'transparent' = OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }

  textColor?: string
  textFontWeight?: number
  textFontSize?: number

  textFontFamily?: string
  titleColor?: string
  titleFontWeight?: number
  titleFontSize?: number
  subtitleColor?: string
  subtitleFontWeight?: number
  subtitleFontSize?: number
  priceColor?: string
  priceFontWeight?: number
  priceFontSize?: number
  descriptionColor?: string
  descriptionFontWeight?: number
  descriptionFontSize?: number
  cardRadiusPx?: number
  cardBorderWidth?: number
  cardBorderColor?: string
  cardShadow?: boolean
  cardBgColor?: string // 'transparent' = OFF

  rowGapPx?: number
  colGapPx?: number

  buttonBgColor?: string
  buttonTextColor?: string
  buttonBorderWidth?: number
  buttonBorderColor?: string
  buttonRadiusPx?: number

  imageRadiusPx?: number
  imageAspectRatio?: number
  imageObjectFit?: 'cover' | 'contain'
  carouselImageAspectRatio?: number

  // carrossel
  carouselCardWidthPx?: number // 260–360
  carouselGapPx?: number
  carouselSidePaddingPx?: number
  carouselDotsColor?: string
  carouselDotsActiveColor?: string
  carouselArrowsBg?: string
  carouselArrowsIconColor?: string
}

type Props = {
  cardId?: string
  settings: ServicesSettings
  style?: ServicesStyle
  onChangeSettings: (s: ServicesSettings) => void
  onChangeStyle?: (s: ServicesStyle) => void
}

function uid(prefix = 'service') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const safe = (v: string) => v.replace(/[^a-zA-Z0-9/_\-.]/g, '-')

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function normalizeSettings(input: ServicesSettings): ServicesSettings {
  const s = input || {}
  return {
    heading: s.heading ?? 'Serviços e Produtos',
    layout: s.layout ?? 'grid',
    carousel: {
      autoplay: s.carousel?.autoplay ?? true,
      autoplayIntervalMs: s.carousel?.autoplayIntervalMs ?? 3500,
      showDots: s.carousel?.showDots ?? true,
      showArrows: s.carousel?.showArrows ?? false,
      arrowsDesktopOnly: s.carousel?.arrowsDesktopOnly ?? true,
    },
    items: Array.isArray(s.items) ? s.items : [],
  }
}

function normalizeStyle(input?: ServicesStyle): ServicesStyle {
  const st = input || {}
  return {
    ...st,

    // título defaults tipo SocialBlock
    headingFontFamily: st.headingFontFamily ?? '',
    headingFontWeight: st.headingFontWeight ?? 900,
    headingColor: st.headingColor ?? '#111827',
    headingBold: st.headingBold ?? true,
    headingAlign: st.headingAlign ?? 'left',
    headingFontSize: st.headingFontSize ?? 13,

    container: {
      bgColor: st.container?.bgColor ?? 'transparent',
      radius: st.container?.radius ?? 12,
      padding: st.container?.padding ?? 16,
      shadow: st.container?.shadow ?? false,
      borderWidth: st.container?.borderWidth ?? 0,
      borderColor: st.container?.borderColor ?? '#e5e7eb',
    },

    cardBgColor: st.cardBgColor ?? '#ffffff',
    cardShadow: st.cardShadow ?? true,
    cardRadiusPx: st.cardRadiusPx ?? 12,
    cardBorderColor: st.cardBorderColor ?? '#e5e7eb',
    cardBorderWidth: st.cardBorderWidth ?? 1,

    rowGapPx: st.rowGapPx ?? 16,
    colGapPx: st.colGapPx ?? 16,

    buttonBgColor: st.buttonBgColor ?? '#0070f3',
    buttonTextColor: st.buttonTextColor ?? '#ffffff',
    buttonBorderWidth: st.buttonBorderWidth ?? 0,
    buttonBorderColor: st.buttonBorderColor ?? 'transparent',
    buttonRadiusPx: st.buttonRadiusPx ?? 8,

    imageRadiusPx: st.imageRadiusPx ?? 8,
    imageAspectRatio: st.imageAspectRatio ?? 1.5,

    // carrossel
    carouselCardWidthPx: clamp(st.carouselCardWidthPx ?? 320, 260, 360),
    carouselGapPx: clamp(st.carouselGapPx ?? (st.colGapPx ?? 16), 0, 32),
    carouselSidePaddingPx: clamp(st.carouselSidePaddingPx ?? 12, 0, 32),
    carouselDotsColor: st.carouselDotsColor ?? 'rgba(0,0,0,0.25)',
    carouselDotsActiveColor: st.carouselDotsActiveColor ?? 'rgba(0,0,0,0.65)',
    carouselArrowsBg: st.carouselArrowsBg ?? 'rgba(255,255,255,0.9)',
    carouselArrowsIconColor: st.carouselArrowsIconColor ?? '#111827',
  }
}

export default function ServicesBlockEditor({
  cardId,
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
}: Props) {
  const { openPicker } = useColorPicker()
  const { t } = useLanguage()

  // 🔒 evita resets enquanto estás a escrever
  const isEditingRef = useRef(false)
  const editEvents = {
    onFocus: () => (isEditingRef.current = true),
    onBlur: () => (isEditingRef.current = false),
  }

  const [localSettings, setLocalSettings] = useState<ServicesSettings>(() =>
    normalizeSettings(settings)
  )
  const [localStyle, setLocalStyle] = useState<ServicesStyle>(() =>
    normalizeStyle(style)
  )

  React.useEffect(() => {
    if (isEditingRef.current) return
    setLocalSettings(normalizeSettings(settings))
    setLocalStyle(normalizeStyle(style))
  }, [settings, style])

  const s = localSettings
  const st = localStyle
  const items = useMemo(() => s.items || [], [s.items])

  const updateSettings = (patch: Partial<ServicesSettings>) => {
    const next = { ...s, ...patch }
    setLocalSettings(next)
    onChangeSettings(next)
  }

  const updateStyle = (patch: Partial<ServicesStyle>) => {
    const next = { ...st, ...patch }
    setLocalStyle(next)
    onChangeStyle?.(next)
  }

  const addItem = () => {
    const newItem: ServiceItem = {
      id: uid(),
      enabled: true,
      title: '',
      price: '',
      subtitle: '',
      description: '',
      actionType: 'none',
      actionLabel: '',
      actionUrl: '',
      details: '',
      features: [],
    }
    updateSettings({ items: [...items, newItem] })
  }

  const removeItem = (id: string) =>
    updateSettings({ items: items.filter((i) => i.id !== id) })

  const updateItem = (id: string, patch: Partial<ServiceItem>) => {
    updateSettings({
      items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })
  }

  // Upload image
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pickFileFor = (id: string) => {
    if (!fileInputRef.current) return
    fileInputRef.current.dataset.targetId = id
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const targetId = e.target.dataset.targetId
    if (!file || !targetId) return

    try {
      if (!file.type.startsWith('image/')) {
        alert('Escolhe um ficheiro de imagem (png/jpg/webp/svg).')
        return
      }

      // ⚠️ se tiveres bucket próprio para serviços, muda aqui
      const bucket = 'decorations'

      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const safeCardId = safe(cardId || 'no-card')
      const safeTargetId = safe(targetId)
      const path = `${safeCardId}/${safeTargetId}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Não foi possível obter o URL público da imagem.')

      updateItem(targetId, { imageSrc: publicUrl })
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload da imagem.')
    }
  }

  const pick = (apply: (hex: string) => void) =>
    openPicker({ mode: 'eyedropper', onPick: apply })

  const headingBoldOn = st.headingBold ?? true
  const layout = s.layout ?? 'grid'
  const isCarousel = layout === 'carousel'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />

      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.heading ?? 'Serviços e Produtos'}
            onChange={(e) => updateSettings({ heading: e.target.value })}
            style={input}
            placeholder="Título do bloco"
            data-no-block-select="1"
            {...editEvents}
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => updateStyle({ headingAlign: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            {...editEvents}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Cor do título">
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => updateStyle({ headingColor: hex })}
            onEyedropper={() => pick((hex) => updateStyle({ headingColor: hex }))}
          />
        </Row>

        <Row label="Negrito">
          <Toggle
            active={headingBoldOn}
            onClick={() => updateStyle({ headingBold: !headingBoldOn })}
          />
        </Row>

        <Row label="Fonte do título">
        <Row label="Fonte do título"><FontPicker value={st.headingFontFamily ?? ""} onChange={(v) => updateStyle({ headingFontFamily: v || "" })} /></Row>
        </Row>

        <Row label="Peso do título">
          <select
            value={String(st.headingFontWeight ?? 900)}
            onChange={(e) => updateStyle({ headingFontWeight: clampNum(e.target.value, 900) })}
            style={select}
            data-no-block-select="1"
            {...editEvents}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>

        <Row label="Tamanho do título (px)">
          <input
            type="number"
            min={10}
            max={32}
            value={st.headingFontSize ?? 13}
            onChange={(e) =>
              updateStyle({
                headingFontSize: clamp(Number(e.target.value), 10, 32),
              })
            }
            style={input}
            data-no-block-select="1"
            {...editEvents}
          />
        </Row>

        <Row label="Layout">
          <select
            value={layout}
            onChange={(e) => updateSettings({ layout: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            {...editEvents}
          >
            <option value="grid">Grelha</option>
            <option value="list">Lista</option>
            <option value="carousel">Carrossel</option>
          </select>
        </Row>

        {isCarousel && (
          <>
            <Row label="Largura do card (px)">
              <input
                type="range"
                min={260}
                max={360}
                step={1}
                value={st.carouselCardWidthPx ?? 320}
                onChange={(e) =>
                  updateStyle({ carouselCardWidthPx: clampNum(e.target.value, 320) })
                }
                data-no-block-select="1"
              />
              <span style={rightNum}>{st.carouselCardWidthPx ?? 320}px</span>
            </Row>

            <Row label="Espaço entre cards (px)">
              <input
                type="range"
                min={0}
                max={32}
                step={1}
                value={st.carouselGapPx ?? 16}
                onChange={(e) => updateStyle({ carouselGapPx: clampNum(e.target.value, 16) })}
                data-no-block-select="1"
              />
              <span style={rightNum}>{st.carouselGapPx ?? 16}px</span>
            </Row>

            <Row label="Padding lateral (px)">
              <input
                type="range"
                min={0}
                max={32}
                step={1}
                value={st.carouselSidePaddingPx ?? 12}
                onChange={(e) =>
                  updateStyle({ carouselSidePaddingPx: clampNum(e.target.value, 12) })
                }
                data-no-block-select="1"
              />
              <span style={rightNum}>{st.carouselSidePaddingPx ?? 12}px</span>
            </Row>

            <Row label="Autoplay">
              <Toggle
                active={s.carousel?.autoplay ?? true}
                onClick={() =>
                  updateSettings({
                    carousel: { ...(s.carousel || {}), autoplay: !(s.carousel?.autoplay ?? true) },
                  })
                }
              />
            </Row>

            <Row label="Intervalo autoplay (ms)">
              <input
                type="number"
                min={800}
                max={20000}
                step={100}
                value={s.carousel?.autoplayIntervalMs ?? 3500}
                onChange={(e) =>
                  updateSettings({
                    carousel: { ...(s.carousel || {}), autoplayIntervalMs: Number(e.target.value) },
                  })
                }
                style={input}
                data-no-block-select="1"
                {...editEvents}
              />
            </Row>

            <Row label="Indicadores (bolinhas)">
              <Toggle
                active={s.carousel?.showDots ?? true}
                onClick={() =>
                  updateSettings({
                    carousel: { ...(s.carousel || {}), showDots: !(s.carousel?.showDots ?? true) },
                  })
                }
              />
            </Row>

            {(s.carousel?.showDots ?? true) && (
              <>
                <Row label="Cor das bolinhas">
                  <SwatchRow
                    value={st.carouselDotsColor ?? 'rgba(0,0,0,0.25)'}
                    onChange={(hex) => updateStyle({ carouselDotsColor: hex })}
                    onEyedropper={() => pick((hex) => updateStyle({ carouselDotsColor: hex }))}
                  />
                </Row>

                <Row label="Cor da bolinha ativa">
                  <SwatchRow
                    value={st.carouselDotsActiveColor ?? 'rgba(0,0,0,0.65)'}
                    onChange={(hex) => updateStyle({ carouselDotsActiveColor: hex })}
                    onEyedropper={() =>
                      pick((hex) => updateStyle({ carouselDotsActiveColor: hex }))
                    }
                  />
                </Row>
              </>
            )}

            <Row label="Botões prev/next">
              <Toggle
                active={s.carousel?.showArrows ?? false}
                onClick={() =>
                  updateSettings({
                    carousel: { ...(s.carousel || {}), showArrows: !(s.carousel?.showArrows ?? false) },
                  })
                }
              />
            </Row>

            {(s.carousel?.showArrows ?? false) && (
              <>
                <Row label="Só no desktop">
                  <Toggle
                    active={s.carousel?.arrowsDesktopOnly ?? true}
                    onClick={() =>
                      updateSettings({
                        carousel: {
                          ...(s.carousel || {}),
                          arrowsDesktopOnly: !(s.carousel?.arrowsDesktopOnly ?? true),
                        },
                      })
                    }
                  />
                </Row>

                <Row label="Fundo das setas">
                  <SwatchRow
                    value={st.carouselArrowsBg ?? 'rgba(255,255,255,0.9)'}
                    onChange={(hex) => updateStyle({ carouselArrowsBg: hex })}
                    onEyedropper={() => pick((hex) => updateStyle({ carouselArrowsBg: hex }))}
                  />
                </Row>

                <Row label="Cor do ícone das setas">
                  <SwatchRow
                    value={st.carouselArrowsIconColor ?? '#111827'}
                    onChange={(hex) => updateStyle({ carouselArrowsIconColor: hex })}
                    onEyedropper={() =>
                      pick((hex) => updateStyle({ carouselArrowsIconColor: hex }))
                    }
                  />
                </Row>
              </>
            )}
          </>
        )}

        <Row label="Adicionar item">
          <button
            type="button"
            onClick={addItem}
            style={{
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid rgba(0,0,0,0.12)',
              backgroundColor: '#f0f0f0',
              cursor: 'pointer',
              fontWeight: 600,
            }}
            data-no-block-select="1"
          >
            + Novo serviço / produto
          </button>
        </Row>

        {items.length === 0 && <div style={{ opacity: 0.7 }}>Nenhum item adicionado.</div>}

        {items.map((item, idx) => (
          <div
            key={item.id}
            style={{
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 12,
              padding: 12,
              marginBottom: 12,
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
            data-no-block-select="1"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 14 }}>Item #{idx + 1}</strong>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                style={{
                  cursor: 'pointer',
                  color: '#e53e3e',
                  border: 'none',
                  background: 'none',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
                title="Remover item"
                data-no-block-select="1"
              >
                ×
              </button>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={item.enabled !== false}
                onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                data-no-block-select="1"
              />
              Ativo
            </label>

            <label>
              <span>Título</span>
              <input
                type="text"
                value={item.title}
                onChange={(e) => updateItem(item.id, { title: e.target.value })}
                style={input}
                placeholder="Ex: Casa rústica no Porto"
                data-no-block-select="1"
                {...editEvents}
              />
            </label>

            <label>
              <span>Preço</span>
              <input
                type="text"
                value={item.price ?? ''}
                onChange={(e) => updateItem(item.id, { price: e.target.value })}
                style={input}
                placeholder="Ex: €250.000,00"
                data-no-block-select="1"
                {...editEvents}
              />
            </label>

            <label>
              <span>Subtítulo (opcional)</span>
              <input
                type="text"
                value={item.subtitle ?? ''}
                onChange={(e) => updateItem(item.id, { subtitle: e.target.value })}
                style={input}
                placeholder="Ex: 3 quartos, 2 casas de banho"
                data-no-block-select="1"
                {...editEvents}
              />
            </label>

            <label>
              <span>Descrição curta</span>
              <textarea
                value={item.description ?? ''}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                style={{ ...input, height: 60, resize: 'vertical' }}
                placeholder="Descrição breve do serviço ou produto"
                data-no-block-select="1"
                {...editEvents}
              />
            </label>

            <label>
              <span>Imagem (upload)</span>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    const bucket = "decorations"
                    const ext = (file.name.split(".").pop() || "png").toLowerCase()
                    const path = `${safe(cardId || "no-card")}/${safe(item.id)}.${ext}`
                    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type })
                    if (error) throw error
                    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
                    if (data?.publicUrl) updateItem(item.id, { imageSrc: data.publicUrl })
                  } catch (err: any) { alert(err?.message || "Erro no upload") }
                  e.target.value = ""
                }}
                style={{ marginBottom: 8 }}
                data-no-block-select="1"
              />

              {item.imageSrc && (
                <img
                  src={item.imageSrc}
                  alt={item.imageAlt ?? ''}
                  
                  
                  style={{ borderRadius: 8 }}
                />
              )}
            </label>

            <label>
              <span>Tipo de ação ao clicar</span>
              <select
                value={item.actionType}
                onChange={(e) => updateItem(item.id, { actionType: e.target.value as any })}
                style={select}
                data-no-block-select="1"
                {...editEvents}
              >
                <option value="none">Nenhuma</option>
                <option value="link">Abrir link</option>
                <option value="modal">Abrir popup</option>
              </select>
            </label>

            {item.actionType === 'link' && (
              <>
                <label>
                  <span>Label do botão</span>
                  <input
                    type="text"
                    value={item.actionLabel ?? ''}
                    onChange={(e) => updateItem(item.id, { actionLabel: e.target.value })}
                    style={input}
                    placeholder="Ex: Ver imóvel"
                    data-no-block-select="1"
                    {...editEvents}
                  />
                </label>
                <label>
                  <span>URL do link</span>
                  <input
                    type="url"
                    value={item.actionUrl ?? ''}
                    onChange={(e) => updateItem(item.id, { actionUrl: e.target.value })}
                    style={input}
                    placeholder="https://..."
                    data-no-block-select="1"
                    {...editEvents}
                  />
                </label>
              </>
            )}

            {item.actionType === 'modal' && (
              <>
                <label>
                  <span>Label do botão</span>
                  <input
                    type="text"
                    value={item.actionLabel ?? ''}
                    onChange={(e) => updateItem(item.id, { actionLabel: e.target.value })}
                    style={input}
                    placeholder="Ex: Mais info"
                    data-no-block-select="1"
                    {...editEvents}
                  />
                </label>
                <label>
                  <span>Detalhes (texto no popup)</span>
                  <textarea
                    value={item.details ?? ''}
                    onChange={(e) => updateItem(item.id, { details: e.target.value })}
                    style={{ ...input, height: 80, resize: 'vertical' }}
                    placeholder="Texto detalhado para o popup"
                    data-no-block-select="1"
                    {...editEvents}
                  />
                </label>
                <label>
                  <span>Características / bullets (separados por linha)</span>
                  <textarea
                    value={item.features?.join('\n') ?? ''}
                    onChange={(e) =>
                      updateItem(item.id, {
                        features: e.target.value.split('\n').map((l) => l.trim()).filter(Boolean),
                      })
                    }
                    style={{ ...input, height: 80, resize: 'vertical' }}
                    placeholder="Ex: 3 quartos\n2 casas de banho\nPiscina"
                    data-no-block-select="1"
                    {...editEvents}
                  />
                </label>
              </>
            )}
          </div>
        ))}
      </Section>
{/* ================== ESTILOS DO CARD ================== */}
      {/* ========== TEXT ========== */}
      <Section title="🔤 Text">
        <Row label={t("editor.text_font_family")}>
          <FontPicker value={st.textFontFamily ?? ""} onChange={(v) => updateStyle({ textFontFamily: v || "" })} />
        </Row>
        <Row label={t("editor.text_size")}>
          <input type="range" min={10} max={20} value={st.textFontSize ?? 14} onChange={(e) => updateStyle({ textFontSize: clampNum(e.target.value, 14) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.textFontSize ?? 14}px</span>
        </Row>
        <Row label={t("editor.text_weight")}>
          <select value={String(st.textFontWeight ?? 600)} onChange={(e) => updateStyle({ textFontWeight: clampNum(e.target.value, 600) })} style={select}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
          </select>
        </Row>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12 }} />

        <Row label={t("editor.title_color")}>
          <ColorPickerPro value={st.titleColor ?? "#111827"} onChange={(hex) => updateStyle({ titleColor: hex })} onEyedropper={() => pick((hex) => updateStyle({ titleColor: hex }))} supportsGradient={false} />
        </Row>
        <Row label={t("editor.title_size")}>
          <input type="range" min={14} max={28} value={st.titleFontSize ?? 18} onChange={(e) => updateStyle({ titleFontSize: clampNum(e.target.value, 18) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.titleFontSize ?? 18}px</span>
        </Row>
        <Row label={t("editor.title_weight")}>
          <select value={String(st.titleFontWeight ?? 800)} onChange={(e) => updateStyle({ titleFontWeight: clampNum(e.target.value, 800) })} style={select}>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12 }} />

        <Row label={t("editor.subtitle_color")}>
          <ColorPickerPro value={st.subtitleColor ?? "#4b5563"} onChange={(hex) => updateStyle({ subtitleColor: hex })} onEyedropper={() => pick((hex) => updateStyle({ subtitleColor: hex }))} supportsGradient={false} />
        </Row>
        <Row label={t("editor.subtitle_size")}>
          <input type="range" min={12} max={18} value={st.subtitleFontSize ?? 14} onChange={(e) => updateStyle({ subtitleFontSize: clampNum(e.target.value, 14) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.subtitleFontSize ?? 14}px</span>
        </Row>
        <Row label={t("editor.subtitle_weight")}>
          <select value={String(st.subtitleFontWeight ?? 600)} onChange={(e) => updateStyle({ subtitleFontWeight: clampNum(e.target.value, 600) })} style={select}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
          </select>
        </Row>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12 }} />

        <Row label={t("editor.price_color")}>
          <ColorPickerPro value={st.priceColor ?? "#111827"} onChange={(hex) => updateStyle({ priceColor: hex })} onEyedropper={() => pick((hex) => updateStyle({ priceColor: hex }))} supportsGradient={false} />
        </Row>
        <Row label={t("editor.price_size")}>
          <input type="range" min={12} max={24} value={st.priceFontSize ?? 16} onChange={(e) => updateStyle({ priceFontSize: clampNum(e.target.value, 16) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.priceFontSize ?? 16}px</span>
        </Row>
        <Row label={t("editor.price_weight")}>
          <select value={String(st.priceFontWeight ?? 800)} onChange={(e) => updateStyle({ priceFontWeight: clampNum(e.target.value, 800) })} style={select}>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>

        <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 12, paddingTop: 12 }} />

        <Row label={t("editor.description_color")}>
          <ColorPickerPro value={st.descriptionColor ?? "#374151"} onChange={(hex) => updateStyle({ descriptionColor: hex })} onEyedropper={() => pick((hex) => updateStyle({ descriptionColor: hex }))} supportsGradient={false} />
        </Row>
        <Row label={t("editor.description_size")}>
          <input type="range" min={12} max={18} value={st.descriptionFontSize ?? 14} onChange={(e) => updateStyle({ descriptionFontSize: clampNum(e.target.value, 14) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.descriptionFontSize ?? 14}px</span>
        </Row>
        <Row label={t("editor.description_weight")}>
          <select value={String(st.descriptionFontWeight ?? 500)} onChange={(e) => updateStyle({ descriptionFontWeight: clampNum(e.target.value, 500) })} style={select}>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi</option>
          </select>
        </Row>
      </Section>

<Section title="Estilos do card">
  <Row label="Fundo do card">
    <Toggle
      active={(st.cardBgColor ?? '#ffffff') !== 'transparent'}
      onClick={() =>
        updateStyle({
          cardBgColor:
            (st.cardBgColor ?? '#ffffff') !== 'transparent'
              ? 'transparent'
              : '#ffffff',
        })
      }
    />
  </Row>

  {(st.cardBgColor ?? '#ffffff') !== 'transparent' && (
    <Row label="Cor do fundo">
      <SwatchRow
        value={st.cardBgColor ?? '#ffffff'}
        onChange={(hex) => updateStyle({ cardBgColor: hex })}
        onEyedropper={() => pick((hex) => updateStyle({ cardBgColor: hex }))}
      />
    </Row>
  )}

  <Row label="Sombra do card">
    <Toggle
      active={st.cardShadow ?? true}
      onClick={() => updateStyle({ cardShadow: !(st.cardShadow ?? true) })}
    />
  </Row>

  <Row label="Raio do card (px)">
    <input
      type="range"
      min={0}
      max={32}
      step={1}
      value={st.cardRadiusPx ?? 12}
      onChange={(e) =>
        updateStyle({ cardRadiusPx: clampNum(e.target.value, 12) })
      }
    />
    <span style={rightNum}>{st.cardRadiusPx ?? 12}px</span>
  </Row>

  <Row label="Borda do card">
    <Toggle
      active={(st.cardBorderWidth ?? 1) > 0}
      onClick={() =>
        updateStyle({
          cardBorderWidth: (st.cardBorderWidth ?? 1) > 0 ? 0 : 1,
        })
      }
    />
  </Row>

  {(st.cardBorderWidth ?? 1) > 0 && (
    <>
      <Row label="Espessura da borda (px)">
        <input
          type="range"
          min={1}
          max={6}
          step={1}
          value={st.cardBorderWidth ?? 1}
          onChange={(e) =>
            updateStyle({ cardBorderWidth: clampNum(e.target.value, 1) })
          }
        />
        <span style={rightNum}>{st.cardBorderWidth ?? 1}px</span>
      </Row>

      <Row label="Cor da borda">
        <SwatchRow
          value={st.cardBorderColor ?? '#e5e7eb'}
          onChange={(hex) => updateStyle({ cardBorderColor: hex })}
          onEyedropper={() =>
            pick((hex) => updateStyle({ cardBorderColor: hex }))
          }
        />
      </Row>
    </>
  )}
</Section>

      {/* Nota: mantivemos o teu "Estilos" noutro bloco do ficheiro anteriormente.
          Se quiseres, cola-o abaixo desta secção e eu também te devolvo “limpo”. */}
    </div>
  )
}
