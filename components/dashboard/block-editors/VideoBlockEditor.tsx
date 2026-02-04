'use client'

import React, { useMemo } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'

type VideoSettings = {
  url: string
  title?: string
  thumbnailUrl?: string
}

type VideoStyle = {
  offsetY?: number
  aspectRatio?: '16:9' | '9:16' | '4:3' | '1:1'
  borderRadius?: number
  shadow?: boolean

  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    widthMode?: 'full' | 'custom'
    customWidthPx?: number
  }

  titleColor?: string
  titleFontSize?: number
  titleAlign?: 'left' | 'center' | 'right'
  showTitle?: boolean
}

type Props = {
  settings: VideoSettings
  style?: VideoStyle
  onChangeSettings: (s: VideoSettings) => void
  onChangeStyle: (s: VideoStyle) => void
}

function parseVideoUrl(url: string): { type: string; videoId?: string; thumbnailUrl?: string } {
  if (!url) return { type: 'unknown' }

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    return {
      type: 'youtube',
      videoId: ytMatch[1],
      thumbnailUrl: `https://img.youtube.com/vi/${ytMatch[1]}/maxresdefault.jpg`,
    }
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return { type: 'vimeo', videoId: vimeoMatch[1] }
  }

  if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
    return { type: 'direct' }
  }

  return { type: 'unknown' }
}

export default function VideoBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()

  const s: VideoStyle = style || {}
  const c = s.container || {}

  const videoInfo = useMemo(() => parseVideoUrl(settings?.url || ''), [settings?.url])

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  const setContainer = (patch: Partial<NonNullable<VideoStyle['container']>>) => {
    onChangeStyle({
      ...s,
      container: { ...c, ...patch },
    })
  }

  const setStyle = (patch: Partial<VideoStyle>) => onChangeStyle({ ...s, ...patch })
  const setSettings = (patch: Partial<VideoSettings>) => onChangeSettings({ ...settings, ...patch })

  const bgEnabled = (c.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (c.borderWidth ?? 0) > 0
  const widthCustom = c.widthMode === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Section title="Vídeo">
        <label style={{ fontSize: 12, opacity: 0.7 }}>URL do vídeo</label>
        <input
          type="text"
          value={settings.url || ''}
          onChange={(e) => setSettings({ url: e.target.value })}
          placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
          style={{
            width: '100%',
            fontSize: 14,
            padding: 10,
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            outline: 'none',
          }}
        />

        {videoInfo.type !== 'unknown' && settings.url && (
          <div style={{ fontSize: 12, color: '#22c55e', marginTop: 4 }}>
            ✓ {videoInfo.type === 'youtube' ? 'YouTube' : videoInfo.type === 'vimeo' ? 'Vimeo' : 'Vídeo direto'} detetado
          </div>
        )}

        {settings.url && videoInfo.type === 'unknown' && (
          <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>
            ⚠ URL não reconhecido. Usa YouTube, Vimeo ou link direto (.mp4, .webm)
          </div>
        )}

        <label style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Título (opcional)</label>
        <input
          type="text"
          value={settings.title || ''}
          onChange={(e) => setSettings({ title: e.target.value })}
          placeholder="Título do vídeo"
          style={{
            width: '100%',
            fontSize: 14,
            padding: 10,
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            outline: 'none',
          }}
        />

        <label style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>Thumbnail personalizada (opcional)</label>
        <input
          type="text"
          value={settings.thumbnailUrl || ''}
          onChange={(e) => setSettings({ thumbnailUrl: e.target.value })}
          placeholder="URL da imagem de capa"
          style={{
            width: '100%',
            fontSize: 14,
            padding: 10,
            borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            outline: 'none',
          }}
        />
        {videoInfo.thumbnailUrl && !settings.thumbnailUrl && (
          <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>
            Thumbnail automática do YouTube será usada
          </div>
        )}
      </Section>

      <Section title="Aparência">
        <Row label="Proporção">
          <select
            value={s.aspectRatio ?? '16:9'}
            onChange={(e) => setStyle({ aspectRatio: e.target.value as any })}
            style={{ fontSize: 14, padding: 6, borderRadius: 6 }}
          >
            <option value="16:9">16:9 (Paisagem)</option>
            <option value="9:16">9:16 (Vertical)</option>
            <option value="4:3">4:3 (Clássico)</option>
            <option value="1:1">1:1 (Quadrado)</option>
          </select>
        </Row>

        <Row label="Cantos arredondados">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={s.borderRadius ?? 12}
            onChange={(e) => setStyle({ borderRadius: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{s.borderRadius ?? 12}px</span>
        </Row>

        <Row label="Sombra">
          <Toggle active={s.shadow !== false} onClick={() => setStyle({ shadow: s.shadow === false })} />
        </Row>
      </Section>

      {settings.title && (
        <Section title="Título">
          <Row label="Mostrar título">
            <Toggle active={s.showTitle !== false} onClick={() => setStyle({ showTitle: s.showTitle === false })} />
          </Row>

          {s.showTitle !== false && (
            <>
              <Row label="Cor">
                <SwatchRow
                  value={s.titleColor ?? '#111827'}
                  onChange={(hex) => setStyle({ titleColor: hex })}
                  onEyedropper={() => pickEyedropper((hex) => setStyle({ titleColor: hex }))}
                />
              </Row>

              <Row label="Tamanho">
                <input
                  type="range"
                  min={12}
                  max={24}
                  step={1}
                  value={s.titleFontSize ?? 14}
                  onChange={(e) => setStyle({ titleFontSize: Number(e.target.value) })}
                />
                <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{s.titleFontSize ?? 14}px</span>
              </Row>

              <Row label="Alinhamento">
                <Button onClick={() => setStyle({ titleAlign: 'left' })} active={s.titleAlign === 'left'}>
                  Esq
                </Button>
                <Button onClick={() => setStyle({ titleAlign: 'center' })} active={(s.titleAlign ?? 'left') === 'center'}>
                  Centro
                </Button>
                <Button onClick={() => setStyle({ titleAlign: 'right' })} active={s.titleAlign === 'right'}>
                  Dir
                </Button>
              </Row>
            </>
          )}
        </Section>
      )}

      <Section title="Bloco (fundo, borda)">
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>

        {bgEnabled && (
          <Row label="Cor fundo">
            <SwatchRow
              value={c.bgColor ?? '#ffffff'}
              onChange={(hex) => setContainer({ bgColor: hex })}
              onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))}
            />
          </Row>
        )}

        <Row label="Sombra bloco">
          <Toggle active={c.shadow === true} onClick={() => setContainer({ shadow: !(c.shadow === true) })} />
        </Row>

        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
        </Row>

        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input
                type="range"
                min={1}
                max={6}
                step={1}
                value={c.borderWidth ?? 1}
                onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })}
              />
              <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.borderWidth ?? 1}px</span>
            </Row>

            <Row label="Cor borda">
              <SwatchRow
                value={c.borderColor ?? '#e5e7eb'}
                onChange={(hex) => setContainer({ borderColor: hex })}
                onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Raio bloco">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={c.radius ?? 0}
            onChange={(e) => setContainer({ radius: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.radius ?? 0}px</span>
        </Row>

        <Row label="Padding">
          <input
            type="range"
            min={0}
            max={28}
            step={1}
            value={c.padding ?? 0}
            onChange={(e) => setContainer({ padding: Number(e.target.value) })}
          />
          <span style={{ width: 36, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.padding ?? 0}px</span>
        </Row>

        <Row label="Largura personalizada">
          <Toggle active={widthCustom} onClick={() => setContainer({ widthMode: widthCustom ? 'full' : 'custom', customWidthPx: widthCustom ? undefined : 320 })} />
        </Row>

        {widthCustom && (
          <Row label="Largura">
            <input
              type="range"
              min={200}
              max={400}
              step={10}
              value={c.customWidthPx ?? 320}
              onChange={(e) => setContainer({ customWidthPx: Number(e.target.value) })}
            />
            <span style={{ width: 42, textAlign: 'right', fontSize: 12, opacity: 0.7 }}>{c.customWidthPx ?? 320}px</span>
          </Row>
        )}
      </Section>

      <Section title="Posição">
        <Row label="Mover (Y)">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button type="button" onClick={() => setStyle({ offsetY: (s.offsetY ?? 0) - 4 })} style={miniBtn}>
              ⬆️
            </button>
            <button type="button" onClick={() => setStyle({ offsetY: (s.offsetY ?? 0) + 4 })} style={miniBtn}>
              ⬇️
            </button>
            <button type="button" onClick={() => setStyle({ offsetY: 0 })} style={miniBtn}>
              Reset
            </button>
            <span style={{ fontSize: 12, opacity: 0.7, width: 70, textAlign: 'right' }}>{s.offsetY ?? 0}px</span>
          </div>
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
        padding: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <strong style={{ fontSize: 13 }}>{title}</strong>
      {children}
    </div>
  )
}

function Row({ label, children }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick, active }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.12)',
        background: active ? 'rgba(0,0,0,0.06)' : '#fff',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 12,
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: any) {
  return (
    <button
      type="button"
      onPointerDown={(e) => e.preventDefault()}
      onClick={() => onClick?.()}
      style={{
        width: 46,
        height: 26,
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
          left: active ? 22 : 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </button>
  )
}

const miniBtn: React.CSSProperties = {
  padding: '6px 8px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 12,
}
