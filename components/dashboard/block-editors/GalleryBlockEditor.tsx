'use client'

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
import { useLanguage } from '@/components/language/LanguageProvider'

type GalleryItem = {
  uid: string
  url: string
  caption?: string
  enabled?: boolean
}

type GallerySettings = {
  heading?: string
  items: GalleryItem[]
  layout?: {
    containerMode?: 'full' | 'moldura' | 'autoadapter'
    gapPx?: number
    sidePaddingPx?: number
    itemWidthPx?: number
    itemHeightPx?: number
    objectFit?: 'cover' | 'contain'
    autoplay?: boolean
    autoplayIntervalMs?: number
  }
}

type GalleryStyle = {
  offsetY?: number
  headingFontSize?: number
  headingFontFamily?: string
  headingFontWeight?: number
  headingColor?: string
  headingBold?: boolean
  headingAlign?: 'left' | 'center' | 'right'

  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
}

type Props = {
  settings: GallerySettings
  style?: GalleryStyle
  onChangeSettings: (s: GallerySettings) => void
  onChangeStyle: (s: GalleryStyle) => void
  onBlurFlushSave?: () => void
}

function clampNum(v: any, fallback: number) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function stop(e: React.PointerEvent | React.MouseEvent) {
  e.stopPropagation?.()
}

function generateUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default function GalleryBlockEditor({
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
  onBlurFlushSave,
}: Props) {
  const { openPicker } = useColorPicker()
  const [uploading, setUploading] = useState(false)
  const { t } = useLanguage()

  const s = settings || ({ items: [] } as any)
  const st = style || {}
  const layout = s.layout || {}
  const container = st.container || {}

  const pick = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setStyle = (patch: Partial<GalleryStyle>) => {
    onChangeStyle({ ...st, ...patch })
    onBlurFlushSave?.()
  }

  const setLayout = (patch: Partial<GallerySettings['layout']>) => {
    onChangeSettings({ ...s, layout: { ...(layout || {}), ...patch } })
    onBlurFlushSave?.()
  }

  const setContainer = (patch: Partial<GalleryStyle['container']>) => {
    onChangeStyle({ ...st, container: { ...(container || {}), ...patch } })
    onBlurFlushSave?.()
  }

  const updateItem = (uid: string, patch: Partial<GalleryItem>) => {
    const prev = Array.isArray(s.items) ? s.items : []
    const next = prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it))
    onChangeSettings({ ...s, items: next })
  }

  const removeItem = (uid: string) => {
    const prev = Array.isArray(s.items) ? s.items : []
    onChangeSettings({ ...s, items: prev.filter((it) => it.uid !== uid) })
    onBlurFlushSave?.()
  }

  async function uploadFileSafe(file: File): Promise<string | null> {
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const fileName = `${generateUid()}.${ext}`
      const filePath = `gallery/${fileName}`

      const { error } = await supabase.storage.from('card-assets').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) {
        console.error('Supabase upload error:', error)
        return null
      }

      const { data } = supabase.storage.from('card-assets').getPublicUrl(filePath)
      return data?.publicUrl ?? null
    } catch (e) {
      console.error('Upload threw:', e)
      return null
    }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    setUploading(true)
    try {
      // ✅ acumula para não depender de "s" stale dentro do loop
      let nextItems = Array.isArray(s.items) ? [...s.items] : []

      for (const file of files) {
        const url = await uploadFileSafe(file)
        if (!url) {
          alert('Erro ao enviar uma das imagens. Vê a consola para detalhes.')
          continue
        }

        const newItem: GalleryItem = { uid: generateUid(), url, enabled: true }
        nextItems = [...nextItems, newItem]
      }

      onChangeSettings({ ...s, items: nextItems })
      onBlurFlushSave?.()
    } finally {
      setUploading(false)
      e.currentTarget.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title={t('editor.content')}>
        <Row label={t('editor.title')}>
          <input
            value={s.heading ?? 'Galeria'}
            onChange={(e) => onChangeSettings({ ...s, heading: e.target.value })}
            onBlur={() => onBlurFlushSave?.()}
            style={input}
            placeholder="Galeria"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label={t('editor.title_alignment')}>
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => setStyle({ headingAlign: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label={t('editor.title_color')}>
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => setStyle({ headingColor: hex })}
            onEyedropper={() => pick((hex) => setStyle({ headingColor: hex }))}
          />
        </Row>

        <Row label={t('editor.bold')}>
          <Toggle active={st.headingBold ?? true} onClick={() => setStyle({ headingBold: !(st.headingBold ?? true) })} />
        </Row>

        <Row label={t('editor.title_font')}>
          <select
            value={st.headingFontFamily ?? ''}
            onChange={(e) => setStyle({ headingFontFamily: e.target.value || '' })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label={t('editor.title_weight')}>
          <select
            value={String(st.headingFontWeight ?? 900)}
            onChange={(e) => setStyle({ headingFontWeight: clampNum(e.target.value, 900) })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>

        <Row label={t('editor.title_size')}>
          <input
            type="number"
            min={10}
            max={32}
            value={st.headingFontSize ?? 13}
            onChange={(e) => setStyle({ headingFontSize: Math.max(10, Math.min(32, Number(e.target.value))) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title={t('editor.images')}>
        <Row label={t('editor.upload')}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onFileChange}
            disabled={uploading}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        {uploading ? <div style={{ fontSize: 12, opacity: 0.7 }}>A enviar imagens…</div> : null}

        {(Array.isArray(s.items) ? s.items : []).map((it) => (
          <div
            key={it.uid}
            style={{
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img
                src={it.url}
                alt={it.caption || 'Imagem da galeria'}
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }}
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeItem(it.uid)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label={t('editor.remove')}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              >
                ×
              </button>
            </div>

            <Row label={t('editor.caption')}>
              <input
                value={it.caption ?? ''}
                onChange={(e) => updateItem(it.uid, { caption: e.target.value })}
                onBlur={() => onBlurFlushSave?.()}
                style={input}
                placeholder="Legenda"
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
            </Row>

            <Row label={t('editor.active')}>
              <Toggle
                active={it.enabled !== false}
                onClick={() => {
                  updateItem(it.uid, { enabled: !(it.enabled !== false) })
                  onBlurFlushSave?.()
                }}
              />
            </Row>
          </div>
        ))}
      </Section>

      <Section title={t('editor.layout_simple')}>
        <Row label={t('editor.container_mode')}>
          <select
            value={layout.containerMode ?? 'full'}
            onChange={(e) => setLayout({ containerMode: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="full">Full</option>
            <option value="moldura">Moldura</option>
            <option value="autoadapter">Auto Adapter</option>
          </select>
        </Row>

        <Row label={t('editor.photo_gap')}>
          <input
            type="range"
            min={0}
            max={64}
            step={1}
            value={layout.gapPx ?? 16}
            onChange={(e) => setLayout({ gapPx: clampNum(e.target.value, 16) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{layout.gapPx ?? 16}px</span>
        </Row>

        <Row label={t('editor.side_padding')}>
          <input
            type="range"
            min={0}
            max={64}
            step={1}
            value={layout.sidePaddingPx ?? (layout.containerMode === 'full' ? 0 : 16)}
            onChange={(e) => setLayout({ sidePaddingPx: clampNum(e.target.value, 16) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{layout.sidePaddingPx ?? (layout.containerMode === 'full' ? 0 : 16)}px</span>
        </Row>

        <Row label={t('editor.width_auto')}>
          <input
            type="number"
            min={40}
            max={600}
            value={layout.itemWidthPx ?? 180}
            onChange={(e) => setLayout({ itemWidthPx: clampNum(e.target.value, 180) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label={t('editor.height_auto')}>
          <input
            type="number"
            min={40}
            max={600}
            value={layout.itemHeightPx ?? 120}
            onChange={(e) => setLayout({ itemHeightPx: clampNum(e.target.value, 120) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>

        <Row label={t('editor.object_fit')}>
          <select
            value={layout.objectFit ?? 'cover'}
            onChange={(e) => setLayout({ objectFit: e.target.value as any })}
            style={select}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
          </select>
        </Row>
      </Section>

      <Section title="Autoplay">
        <Row label="Ativar autoplay">
          <Toggle active={layout.autoplay !== false} onClick={() => setLayout({ autoplay: !(layout.autoplay !== false) })} />
        </Row>

        <Row label="Intervalo (ms)">
          <input
            type="number"
            min={800}
            max={15000}
            step={100}
            value={layout.autoplayIntervalMs ?? 3500}
            onChange={(e) => setLayout({ autoplayIntervalMs: clampNum(e.target.value, 3500) })}
            style={input}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
        </Row>
      </Section>

      <Section title="Aparência do bloco">
        <Row label="Fundo">
          <Toggle
            active={(container.bgColor ?? 'transparent') !== 'transparent'}
            onClick={() =>
              setContainer({
                enabled: true,
                bgColor: (container.bgColor ?? 'transparent') !== 'transparent' ? 'transparent' : '#ffffff',
              })
            }
          />
        </Row>

        {(container.bgColor ?? 'transparent') !== 'transparent' && (
          <Row label="Cor do fundo">
            <SwatchRow
              value={container.bgColor ?? '#ffffff'}
              onChange={(hex) => setContainer({ bgColor: hex })}
              onEyedropper={() => pick((hex) => setContainer({ bgColor: hex }))}
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => setContainer({ shadow: !(container.shadow ?? false) })} />
        </Row>

        <Row label="Borda">
          <Toggle active={(container.borderWidth ?? 0) > 0} onClick={() => setContainer({ borderWidth: (container.borderWidth ?? 0) > 0 ? 0 : 1 })} />
        </Row>

        {(container.borderWidth ?? 0) > 0 && (
          <>
            <Row label="Espessura">
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={container.borderWidth ?? 1}
                onChange={(e) => setContainer({ borderWidth: clampNum(e.target.value, 1) })}
                data-no-block-select="1"
                onPointerDown={stop}
                onMouseDown={stop}
              />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor da borda">
              <SwatchRow
                value={container.borderColor ?? 'rgba(0,0,0,0.08)'}
                onChange={(hex) => setContainer({ borderColor: hex })}
                onEyedropper={() => pick((hex) => setContainer({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={container.radius ?? 14}
            onChange={(e) => setContainer({ radius: clampNum(e.target.value, 14) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>

        <Row label="Padding (moldura)">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={container.padding ?? 16}
            onChange={(e) => setContainer({ padding: clampNum(e.target.value, 16) })}
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
          />

      <Section title="Posição">
        <Row label="Mover (Y)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => setStyle({ offsetY: (st.offsetY ?? 0) - 4 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>⬆️</button>
            <button type="button" onClick={() => setStyle({ offsetY: (st.offsetY ?? 0) + 4 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>⬇️</button>
            <button type="button" onClick={() => setStyle({ offsetY: 0 })} style={{ padding: '6px 8px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 12 }} data-no-block-select="1" onPointerDown={stop} onMouseDown={stop}>Reset</button>
            <span style={rightNum}>{st.offsetY ?? 0}px</span>
          </div>
        </Row>
      </Section>
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
      </Section>
    </div>
  )
}
