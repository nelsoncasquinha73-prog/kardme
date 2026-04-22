'use client'

import { useState } from 'react'
import type { BannerSettings } from '@/components/blocks/types/banner'
import { uploadCardImage } from '@/lib/uploadCardImage'
import ColorPickerProUnified from '@/components/editor/ColorPickerProUnified'
import { useColorPicker } from '@/components/editor/ColorPickerContext'

type Props = {
  cardId: string
  settings: BannerSettings
  onChange: (settings: BannerSettings) => void
}

function normalize(input: Partial<BannerSettings>): BannerSettings {
  return {
    enabled: input.enabled ?? true,
    mode: input.mode ?? 'separator',
    height: input.height ?? 150,
    fullWidth: input.fullWidth ?? true,
    borderRadius: input.borderRadius ?? 0,
    margin: input.margin ?? { top: 0, bottom: 0 },
    backgroundType: input.backgroundType ?? 'solid',
    backgroundImage: input.backgroundImage ?? '',
    backgroundColor: input.backgroundColor ?? '#3b82f6',
    backgroundGradient: input.backgroundGradient ?? {
      angle: 180,
      stops: [
        { color: '#3b82f6', position: 0 },
        { color: '#1e40af', position: 100 },
      ],
    },
    logoUrl: input.logoUrl ?? '',
    logoSize: input.logoSize ?? 60,
    logoPosition: input.logoPosition ?? 'center',
    logoShape: input.logoShape ?? 'circle',
    fadeTopEnabled: input.fadeTopEnabled ?? false,
    fadeTopSize: input.fadeTopSize ?? 20,
    fadeBottomEnabled: input.fadeBottomEnabled ?? false,
    fadeBottomSize: input.fadeBottomSize ?? 20,
    overlayColor: input.overlayColor ?? 'rgba(0,0,0,0)',
    overlayOpacity: input.overlayOpacity ?? 0,
    vignetteEnabled: input.vignetteEnabled ?? false,
    grainEnabled: input.grainEnabled ?? false,
    parallaxEnabled: input.parallaxEnabled ?? false,
    blurContentBelow: input.blurContentBelow ?? false,
    stickyZIndex: input.stickyZIndex ?? 10,
    offsetX: input.offsetX ?? 0,
    offsetY: input.offsetY ?? 0,
  }
}

export default function BannerBlockEditor({ cardId, settings, onChange }: Props) {
  const s = normalize(settings)
  const { openPicker } = useColorPicker()
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>('layout')

  const update = (partial: Partial<BannerSettings>) => {
    onChange(normalize({ ...s, ...partial }))
  }

  const pickEyedropper = (callback: (hex: string) => void) => {
    openPicker({
      mode: 'eyedropper',
      onPick: callback,
    })
  }

  const Accordion = ({
    title,
    id,
    children,
  }: {
    title: string
    id: string
    children: React.ReactNode
  }) => (
    <div style={{ borderBottom: '1px solid #e5e7eb' }}>
      <button
        onClick={() => setExpandedAccordion(expandedAccordion === id ? null : id)}
        style={{
          width: '100%',
          padding: '12px',
          background: '#f9fafb',
          border: 'none',
          textAlign: 'left',
          fontSize: 13,
          fontWeight: 600,
          color: '#374151',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {title}
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          {expandedAccordion === id ? '▼' : '▶'}
        </span>
      </button>
      {expandedAccordion === id && (
        <div style={{ padding: '12px', background: '#fff' }}>{children}</div>
      )}
    </div>
  )

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>{label}</label>
      {children}
    </div>
  )

  

const Slider = ({
    value,
    min,
    max,
    onChange: onSliderChange,
  }: {
    value: number
    min: number
    max: number
    onChange: (v: number) => void
  }) => (
    <div
      style={{ display: 'flex', gap: 8, alignItems: 'center' }}
    >
      <input
        type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()}
        min={min}
        max={max} step={1} value={value}
        onChange={(e) => onSliderChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
      <input
        type="number"
        value={value}
        onChange={(e) => onSliderChange(Number(e.target.value))}
        style={{ flex: 1 }}
      />
    </div>
  )

  const Toggle = ({
    label,
    checked,
    onChange: onToggleChange,
  }: {
    label: string
    checked: boolean
    onChange: (v: boolean) => void
  }) => (
    <div style={{ flex: 1 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggleChange(e.target.checked)}
        style={{ flex: 1 }}
      />
      <label style={{ flex: 1 }}>{label}</label>
    </div>
  )

  return (
    <div style={{ flex: 1 }}>
      {/* MODO */}
      <Accordion title="🎯 Modo" id="mode">
        <Row label="Tipo">
          <div style={{ flex: 1 }}>
            <button
              onClick={() => update({ mode: 'separator' })}
              style={{ flex: 1 }}
            >
              Separador
            </button>
            <button
              onClick={() => update({ mode: 'sticky' })}
              style={{ flex: 1 }}
            >
              Sticky (Bandeira)
            </button>
          </div>
        </Row>
      </Accordion>

      {/* LAYOUT */}
      <Accordion title="📐 Layout" id="layout">
        <Row label="Altura (px)">
          <input
            type="range"
            min={80}
            max={300}
            value={s.height}
            onChange={(e) => update({ height: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.height}</span>
        </Row>
        <Row label="Raio da borda (px)">
          <input
            type="range"
            min={0}
            max={50}
            value={s.borderRadius || 0}
            onChange={(e) => update({ borderRadius: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.borderRadius || 0}</span>
        </Row>
        <Toggle
          label="Largura completa"
          checked={s.fullWidth}
          onChange={(v) => update({ fullWidth: v })}
        />
        <Row label="Offset X (px)">
          <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={-500} max={500} step={1} value={s.offsetX || 0} onChange={(e) => update({ offsetX: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.offsetX || 0}</span>
        </Row>
        <Row label="Offset Y (px)">
          <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={-500} max={500} step={1} value={s.offsetY || 0} onChange={(e) => update({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.offsetY || 0}</span>
        </Row>
        {s.mode === 'separator' && (
          <>
            <Row label="Margem superior (px)">
              <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={0} max={60} step={1} value={s.margin!.top} onChange={(e) => update({ margin: { top: Number(e.target.value), bottom: s.margin!.bottom } })} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, minWidth: 50 }}>{s.margin!.top}</span>
            </Row>
            <Row label="Margem inferior (px)">
              <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={0} max={60} step={1} value={s.margin!.bottom} onChange={(e) => update({ margin: { top: s.margin!.top, bottom: Number(e.target.value) } })} style={{ flex: 1 }} />
              <span style={{ fontSize: 12, minWidth: 50 }}>{s.margin!.bottom}</span>
            </Row>
          </>
        )}
        <Row label="Z-Index (sobreposição)">
          <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={1} max={100} step={1} value={s.stickyZIndex || 10} onChange={(e) => update({ stickyZIndex: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.stickyZIndex || 10}</span>
        </Row>
      </Accordion>

      {/* BACKGROUND */}
      <Accordion title="🎨 Background" id="background">
        <Row label="Tipo">
          <select
            value={s.backgroundType}
            onChange={(e) => update({ backgroundType: e.target.value as any })}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: 12,
            }}
          >
            <option value="solid">Cor sólida</option>
            <option value="gradient">Gradiente</option>
            <option value="image">Imagem</option>
            <option value="pattern">Padrão</option>
          </select>
        </Row>

        {s.backgroundType === 'solid' && (
          <Row label="Cor">
            <ColorPickerProUnified
              value={s.backgroundColor || '#3b82f6'}
              onChange={(c) => update({ backgroundColor: c })}
              onEyedropper={() => pickEyedropper((hex) => update({ backgroundColor: hex }))}
              supportsGradient={false}
            />
          </Row>
        )}

        {s.backgroundType === 'image' && (
          <Row label="Imagem">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0]
                if (file) {
                  const { publicUrl } = await uploadCardImage({ cardId, file, kind: "background" })
                  update({ backgroundImage: publicUrl })
                }
              }}
              style={{ flex: 1 }}
            />
          </Row>
        )}
      </Accordion>

      {/* FADE & OVERLAYS */}
      <Accordion title="✨ Fade & Overlays" id="fade">
        <Toggle
          label="Fade superior"
          checked={s.fadeTopEnabled}
          onChange={(v) => update({ fadeTopEnabled: v })}
        />
        {s.fadeTopEnabled && (
          <Row label="Tamanho fade superior (px)">
            <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={5} max={100} step={1} value={s.fadeTopSize} onChange={(e) => update({ fadeTopSize: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: 12, minWidth: 50 }}>{s.fadeTopSize}</span>
          </Row>
        )}

        <Toggle
          label="Fade inferior"
          checked={s.fadeBottomEnabled}
          onChange={(v) => update({ fadeBottomEnabled: v })}
        />
        {s.fadeBottomEnabled && (
          <Row label="Tamanho fade inferior (px)">
            <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={5} max={100} step={1} value={s.fadeBottomSize} onChange={(e) => update({ fadeBottomSize: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: 12, minWidth: 50 }}>{s.fadeBottomSize}</span>
          </Row>
        )}

        <Row label="Overlay cor">
          <ColorPickerProUnified
            value={s.overlayColor || 'rgba(0,0,0,0)'}
            onChange={(c) => update({ overlayColor: c })}
            onEyedropper={() => pickEyedropper((hex) => update({ overlayColor: hex }))}
            supportsGradient={false}
            supportsAlpha={true}
          />
        </Row>

        <Row label="Opacidade overlay (%)">
          <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={0} max={100} step={1} value={s.overlayOpacity} onChange={(e) => update({ overlayOpacity: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={{ fontSize: 12, minWidth: 50 }}>{s.overlayOpacity}</span>
        </Row>

        <Toggle
          label="Vignette (escurecer cantos)"
          checked={s.vignetteEnabled}
          onChange={(v) => update({ vignetteEnabled: v })}
        />

        <Toggle
          label="Grain (textura suave)"
          checked={s.grainEnabled}
          onChange={(v) => update({ grainEnabled: v })}
        />
      </Accordion>

      {/* LOGO (sticky) */}
      {s.mode === 'sticky' && (
        <Accordion title="🎭 Logo" id="logo">
          <Row label="Imagem do logo">
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.currentTarget.files?.[0]
                if (file) {
                  const { publicUrl } = await uploadCardImage({ cardId, file, kind: "background" })
                  update({ logoUrl: publicUrl })
                }
              }}
              style={{ flex: 1 }}
            />
          </Row>

          <Row label="Tamanho (px)">
            <input type="range"
            onPointerDownCapture={(e) => e.stopPropagation()}
            onMouseDownCapture={(e) => e.stopPropagation()}
            onTouchStartCapture={(e) => e.stopPropagation()} min={40} max={280} step={1} value={s.logoSize} onChange={(e) => update({ logoSize: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={{ fontSize: 12, minWidth: 50 }}>{s.logoSize}</span>
          </Row>

          <Row label="Posição">
            <div style={{ display: 'flex', gap: 8 }}>
              {['left', 'center', 'right'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => update({ logoPosition: pos as any })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: s.logoPosition === pos ? '#3b82f6' : '#e5e7eb',
                    color: s.logoPosition === pos ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                
 >
                  {pos === 'left' ? '◀' : pos === 'center' ? '●' : '▶'} {pos}
                </button>
              ))}
            </div>
          </Row>

          <Row label="Forma">
            <div style={{ display: 'flex', gap: 8 }}>
              {['circle', 'rounded', 'square'].map((shape) => (
                <button
                  key={shape}
                  onClick={() => update({ logoShape: shape as any })}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: s.logoShape === shape ? '#3b82f6' : '#e5e7eb',
                    color: s.logoShape === shape ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {shape === 'circle' ? '●' : shape === 'rounded' ? '◆' : '■'} {shape}
                </button>
              ))}
            </div>
          </Row>
        </Accordion>
      )}
    </div>
  )
}
