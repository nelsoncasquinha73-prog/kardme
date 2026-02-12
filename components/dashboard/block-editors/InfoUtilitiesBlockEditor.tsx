'use client'

import React, { useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import { FONT_OPTIONS } from '@/lib/fontes'
import { useColorPicker } from '@/components/editor/ColorPickerContext'

export type InfoItemType = 'address' | 'wifi' | 'image_button' | 'link' | 'hours_text' | 'reviews_embed'

export type InfoItem = {
  id: string
  type: InfoItemType
  enabled: boolean
  label?: string
  value?: string
  url?: string
  ssid?: string
  password?: string
  imageSrc?: string
  imageAlt?: string
  embedHtml?: string
  iconMode?: 'default' | 'image'
  iconImageSrc?: string
}

export type InfoUtilitiesSettings = {
  heading?: string
  layout?: 'grid' | 'list'
  items?: InfoItem[]
}

export type InfoUtilitiesStyle = {
  offsetY?: number
  container?: {
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    widthMode?: 'full' | 'custom'
    customWidthPx?: number
  }
  headingColor?: string
  headingBold?: boolean
  headingFontFamily?: string
  headingFontWeight?: number
  headingFontSize?: number
  headingAlign?: 'left' | 'center' | 'right'
  textColor?: string
  textFontFamily?: string
  textFontWeight?: number
  textFontSize?: number
  iconSizePx?: number
  iconColor?: string
  iconBgColor?: string
  iconRadiusPx?: number
  rowGapPx?: number
  rowPaddingPx?: number
  rowBorderWidth?: number
  rowBorderColor?: string
  rowRadiusPx?: number
  rowBgColor?: string
  buttonBgColor?: string
  buttonTextColor?: string
  buttonBorderWidth?: number
  buttonBorderColor?: string
  buttonRadiusPx?: number
}

type Props = {
  cardId?: string
  settings: InfoUtilitiesSettings
  style?: InfoUtilitiesStyle
  onChangeSettings: (s: InfoUtilitiesSettings) => void
  onChangeStyle?: (s: InfoUtilitiesStyle) => void
}

function uid(prefix = 'info') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

const ITEM_TYPES: Array<{ value: InfoItemType; label: string; icon: string }> = [
  { value: 'address', label: 'Morada', icon: '📍' },
  { value: 'wifi', label: 'WiFi', icon: '📶' },
  { value: 'image_button', label: 'Botão com imagem', icon: '🖼️' },
  { value: 'link', label: 'Link simples', icon: '🔗' },
  { value: 'hours_text', label: 'Texto horário', icon: '🕐' },
  { value: 'reviews_embed', label: 'Avaliações Google', icon: '⭐' },
]

export default function InfoUtilitiesBlockEditor({ cardId, settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()
  const [activeSection, setActiveSection] = useState<string | null>('items')

  const s = settings || {}
  const st = style || {}
  const items = useMemo(() => s.items || [], [s.items])

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const updateSettings = (patch: Partial<InfoUtilitiesSettings>) => onChangeSettings({ ...s, ...patch })
  const updateStyle = (patch: Partial<InfoUtilitiesStyle>) => onChangeStyle?.({ ...st, ...patch })

  const addItem = (type: InfoItemType) => {
    const newItem: InfoItem = { id: uid(), type, enabled: true, label: '', iconMode: 'default', iconImageSrc: '' }
    updateSettings({ items: [...items, newItem] })
  }

  const removeItem = (id: string) => updateSettings({ items: items.filter((i) => i.id !== id) })
  const updateItem = (id: string, patch: Partial<InfoItem>) => updateSettings({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pickFileFor = (id: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.targetId = id
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
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
      const bucket = 'decorations'
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const safeCardId = String(cardId || 'no-card').replace(/[^a-zA-Z0-9/_-]/g, '-')
      const safeTargetId = String(targetId).replace(/[^a-zA-Z0-9/_-]/g, '-')
      const path = `${safeCardId}/${safeTargetId}.${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type, cacheControl: '3600' })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Não foi possível obter o URL público da imagem.')

      const current = items.find((i) => i.id === targetId)
      if ((current?.iconMode ?? 'default') === 'image') {
        updateItem(targetId, { iconImageSrc: publicUrl })
      } else {
        updateItem(targetId, { imageSrc: publicUrl })
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload da imagem.')
    }
  }

  const container = st.container || {}
  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0
  const customWidth = (container.widthMode ?? 'full') === 'custom'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

      {/* ========== ITEMS ========== */}
      <CollapsibleSection title="📋 Items" subtitle="Morada, WiFi, links, etc." isOpen={activeSection === 'items'} onToggle={() => setActiveSection(activeSection === 'items' ? null : 'items')}>
        <Row label="Título">
          <input type="text" value={s.heading ?? 'Utilidades'} onChange={(e) => updateSettings({ heading: e.target.value })} placeholder="Título do bloco" style={inputStyle} />
        </Row>
        <Row label="Layout">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(s.layout ?? 'grid') === 'grid'} onClick={() => updateSettings({ layout: 'grid' })}>Grelha</MiniButton>
            <MiniButton active={s.layout === 'list'} onClick={() => updateSettings({ layout: 'list' })}>Lista</MiniButton>
          </div>
        </Row>
        <Row label="Adicionar">
          <select onChange={(e) => { if (e.target.value) { addItem(e.target.value as InfoItemType); e.target.value = '' } }} style={selectStyle} defaultValue="">
            <option value="" disabled>Seleciona tipo...</option>
            {ITEM_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.icon} {t.label}</option>))}
          </select>
        </Row>

        {items.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>Nenhum item adicionado.</div>}

        {items.map((item, idx) => {
          const enabled = item.enabled !== false
          const iconMode = item.iconMode ?? 'default'
          const hasIconImage = typeof item.iconImageSrc === 'string' && item.iconImageSrc.trim().length > 0
          const typeInfo = ITEM_TYPES.find((t) => t.value === item.type)

          return (
            <div key={item.id} style={{ padding: 12, background: enabled ? 'rgba(59,130,246,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, border: enabled ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{typeInfo?.icon} {typeInfo?.label} #{idx + 1}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Toggle active={enabled} onClick={() => updateItem(item.id, { enabled: !enabled })} />
                  <button onClick={() => removeItem(item.id)} style={{ color: '#e53e3e', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>×</button>
                </div>
              </div>

              {/* Ícone custom */}
              <Row label="Ícone">
                <div style={{ display: 'flex', gap: 6 }}>
                  <MiniButton active={iconMode === 'default'} onClick={() => updateItem(item.id, { iconMode: 'default' })}>Padrão</MiniButton>
                  <MiniButton active={iconMode === 'image'} onClick={() => updateItem(item.id, { iconMode: 'image' })}>Imagem</MiniButton>
                </div>
              </Row>
              {iconMode === 'image' && (
                <Row label="">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Button onClick={() => pickFileFor(item.id)}>Upload</Button>
                    {hasIconImage && <Button onClick={() => updateItem(item.id, { iconImageSrc: '' })}>Limpar</Button>}
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{hasIconImage ? '✅' : '⚠️'}</span>
                  </div>
                </Row>
              )}
              {iconMode === 'image' && hasIconImage && (
                <img src={item.iconImageSrc} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.08)' }} />
              )}

              {/* Campos por tipo */}
              {item.type === 'address' && (
                <>
                  <Row label="Morada"><input type="text" value={item.value ?? ''} onChange={(e) => updateItem(item.id, { value: e.target.value })} placeholder="Rua ABC, 123, Lisboa" style={inputStyle} /></Row>
                  <Row label="Maps URL"><input type="url" value={item.url ?? ''} onChange={(e) => updateItem(item.id, { url: e.target.value })} placeholder="https://maps.google.com/..." style={inputStyle} /></Row>
                </>
              )}
              {item.type === 'wifi' && (
                <>
                  <Row label="SSID"><input type="text" value={item.ssid ?? ''} onChange={(e) => updateItem(item.id, { ssid: e.target.value })} placeholder="Nome da rede" style={inputStyle} /></Row>
                  <Row label="Senha"><input type="text" value={item.password ?? ''} onChange={(e) => updateItem(item.id, { password: e.target.value })} placeholder="Senha WiFi" style={inputStyle} /></Row>
                </>
              )}
              {item.type === 'image_button' && (
                <>
                  <Row label="Imagem"><Button onClick={() => pickFileFor(item.id)}>Upload</Button></Row>
                  {item.imageSrc && <Image src={item.imageSrc} alt={item.imageAlt ?? ''} width={60} height={60} style={{ borderRadius: 8 }} />}
                  <Row label="Texto"><input type="text" value={item.label ?? ''} onChange={(e) => updateItem(item.id, { label: e.target.value })} placeholder="Visitar site" style={inputStyle} /></Row>
                  <Row label="URL"><input type="url" value={item.url ?? ''} onChange={(e) => updateItem(item.id, { url: e.target.value })} placeholder="https://..." style={inputStyle} /></Row>
                </>
              )}
              {item.type === 'link' && (
                <>
                  <Row label="Texto"><input type="text" value={item.label ?? ''} onChange={(e) => updateItem(item.id, { label: e.target.value })} placeholder="Site oficial" style={inputStyle} /></Row>
                  <Row label="URL"><input type="url" value={item.url ?? ''} onChange={(e) => updateItem(item.id, { url: e.target.value })} placeholder="https://..." style={inputStyle} /></Row>
                </>
              )}
              {item.type === 'hours_text' && (
                <Row label="Horário"><textarea value={item.value ?? ''} onChange={(e) => updateItem(item.id, { value: e.target.value })} placeholder="Segunda a Sexta, 09h às 18h" style={{ ...inputStyle, height: 60, resize: 'vertical' }} /></Row>
              )}
              {item.type === 'reviews_embed' && (
                <>
                  <Row label="Embed"><textarea value={item.embedHtml ?? ''} onChange={(e) => updateItem(item.id, { embedHtml: e.target.value })} placeholder="Cole o iframe aqui" style={{ ...inputStyle, height: 60, resize: 'vertical' }} /></Row>
                  <Row label="URL"><input type="url" value={item.url ?? ''} onChange={(e) => updateItem(item.id, { url: e.target.value })} placeholder="https://..." style={inputStyle} /></Row>
                </>
              )}
            </div>
          )
        })}
      </CollapsibleSection>

      {/* ========== TÍTULO ========== */}
      <CollapsibleSection title="📝 Título" subtitle="Cor, fonte, alinhamento" isOpen={activeSection === 'title'} onToggle={() => setActiveSection(activeSection === 'title' ? null : 'title')}>
        <Row label="Cor">
          <ColorPickerPro value={st.headingColor ?? '#111827'} onChange={(hex) => updateStyle({ headingColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ headingColor: hex }))} />
        </Row>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(st.headingAlign ?? 'left') === a} onClick={() => updateStyle({ headingAlign: a })}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Negrito">
          <Toggle active={st.headingBold !== false} onClick={() => updateStyle({ headingBold: !(st.headingBold !== false) })} />
        </Row>
        <Row label="Fonte">
          <select value={st.headingFontFamily ?? ''} onChange={(e) => updateStyle({ headingFontFamily: e.target.value || undefined })} style={selectStyle}>
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (<option key={o.label} value={o.value}>{o.label}</option>))}
          </select>
        </Row>
        <Row label="Peso">
          <select value={String(st.headingFontWeight ?? 900)} onChange={(e) => updateStyle({ headingFontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="500">Medium</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={32} value={st.headingFontSize ?? 16} onChange={(e) => updateStyle({ headingFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.headingFontSize ?? 16}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== TEXTO ========== */}
      <CollapsibleSection title="✏️ Texto" subtitle="Cor, fonte, tamanho" isOpen={activeSection === 'text'} onToggle={() => setActiveSection(activeSection === 'text' ? null : 'text')}>
        <Row label="Cor">
          <ColorPickerPro value={st.textColor ?? '#111827'} onChange={(hex) => updateStyle({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ textColor: hex }))} />
        </Row>
        <Row label="Fonte">
          <select value={st.textFontFamily ?? ''} onChange={(e) => updateStyle({ textFontFamily: e.target.value || undefined })} style={selectStyle}>
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (<option key={o.label} value={o.value}>{o.label}</option>))}
          </select>
        </Row>
        <Row label="Peso">
          <select value={String(st.textFontWeight ?? 600)} onChange={(e) => updateStyle({ textFontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
          </select>
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={22} value={st.textFontSize ?? 14} onChange={(e) => updateStyle({ textFontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.textFontSize ?? 14}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, padding" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => updateStyle({ container: { ...container, bgColor: bgEnabled ? 'transparent' : '#ffffff' } })} />
        </Row>
        {bgEnabled && (
          <Row label="Cor">
            <ColorPickerPro value={container.bgColor ?? '#ffffff'} onChange={(hex) => updateStyle({ container: { ...container, bgColor: hex } })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ container: { ...container, bgColor: hex } }))} />
          </Row>
        )}
        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => updateStyle({ container: { ...container, shadow: !container.shadow } })} />
        </Row>
        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => updateStyle({ container: { ...container, borderWidth: borderEnabled ? 0 : 1 } })} />
        </Row>
        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} value={container.borderWidth ?? 1} onChange={(e) => updateStyle({ container: { ...container, borderWidth: Number(e.target.value) } })} style={{ flex: 1 }} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerPro value={container.borderColor ?? 'rgba(0,0,0,0.08)'} onChange={(hex) => updateStyle({ container: { ...container, borderColor: hex } })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ container: { ...container, borderColor: hex } }))} />
            </Row>
          </>
        )}
        <Row label="Raio">
          <input type="range" min={0} max={32} value={container.radius ?? 14} onChange={(e) => updateStyle({ container: { ...container, radius: Number(e.target.value) } })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.radius ?? 14}px</span>
        </Row>
        <Row label="Padding">
          <input type="range" min={0} max={28} value={container.padding ?? 16} onChange={(e) => updateStyle({ container: { ...container, padding: Number(e.target.value) } })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.padding ?? 16}px</span>
        </Row>
        <Row label="Largura custom">
          <Toggle active={customWidth} onClick={() => updateStyle({ container: { ...container, widthMode: customWidth ? 'full' : 'custom', customWidthPx: container.customWidthPx ?? 340 } })} />
        </Row>
        {customWidth && (
          <Row label="Largura">
            <input type="range" min={200} max={400} step={5} value={container.customWidthPx ?? 340} onChange={(e) => updateStyle({ container: { ...container, customWidthPx: Number(e.target.value) } })} style={{ flex: 1 }} />
            <span style={rightNum}>{container.customWidthPx ?? 340}px</span>
          </Row>
        )}
      </CollapsibleSection>

      {/* ========== LINHAS ========== */}
      <CollapsibleSection title="📏 Linhas" subtitle="Espaçamento, borda, raio" isOpen={activeSection === 'rows'} onToggle={() => setActiveSection(activeSection === 'rows' ? null : 'rows')}>
        <Row label="Espaçamento">
          <input type="range" min={4} max={18} value={st.rowGapPx ?? 12} onChange={(e) => updateStyle({ rowGapPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.rowGapPx ?? 12}px</span>
        </Row>
        <Row label="Padding">
          <input type="range" min={0} max={20} value={st.rowPaddingPx ?? 8} onChange={(e) => updateStyle({ rowPaddingPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.rowPaddingPx ?? 8}px</span>
        </Row>
        <Row label="Borda">
          <input type="range" min={0} max={4} value={st.rowBorderWidth ?? 0} onChange={(e) => updateStyle({ rowBorderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.rowBorderWidth ?? 0}px</span>
        </Row>
        {(st.rowBorderWidth ?? 0) > 0 && (
          <Row label="Cor borda">
            <ColorPickerPro value={st.rowBorderColor ?? '#e5e7eb'} onChange={(hex) => updateStyle({ rowBorderColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ rowBorderColor: hex }))} />
          </Row>
        )}
        <Row label="Raio">
          <input type="range" min={0} max={32} value={st.rowRadiusPx ?? 10} onChange={(e) => updateStyle({ rowRadiusPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.rowRadiusPx ?? 10}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== ÍCONES ========== */}
      <CollapsibleSection title="🎯 Ícones" subtitle="Tamanho, cor, fundo" isOpen={activeSection === 'icons'} onToggle={() => setActiveSection(activeSection === 'icons' ? null : 'icons')}>
        <Row label="Tamanho">
          <input type="range" min={12} max={48} value={st.iconSizePx ?? 24} onChange={(e) => updateStyle({ iconSizePx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.iconSizePx ?? 24}px</span>
        </Row>
        <Row label="Cor">
          <ColorPickerPro value={st.iconColor ?? '#111827'} onChange={(hex) => updateStyle({ iconColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ iconColor: hex }))} />
        </Row>
        <Row label="Fundo">
          <ColorPickerPro value={st.iconBgColor ?? 'transparent'} onChange={(hex) => updateStyle({ iconBgColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ iconBgColor: hex }))} />
        </Row>
        <Row label="Raio">
          <input type="range" min={0} max={24} value={st.iconRadiusPx ?? 6} onChange={(e) => updateStyle({ iconRadiusPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.iconRadiusPx ?? 6}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== BOTÕES ========== */}
      <CollapsibleSection title="🔘 Botões" subtitle="Cor, borda, raio" isOpen={activeSection === 'buttons'} onToggle={() => setActiveSection(activeSection === 'buttons' ? null : 'buttons')}>
        <Row label="Cor texto">
          <ColorPickerPro value={st.buttonTextColor ?? '#111827'} onChange={(hex) => updateStyle({ buttonTextColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonTextColor: hex }))} />
        </Row>
        <Row label="Fundo">
          <ColorPickerPro value={st.buttonBgColor ?? '#f0f0f0'} onChange={(hex) => updateStyle({ buttonBgColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonBgColor: hex }))} />
        </Row>
        <Row label="Borda">
          <input type="range" min={0} max={6} value={st.buttonBorderWidth ?? 0} onChange={(e) => updateStyle({ buttonBorderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.buttonBorderWidth ?? 0}px</span>
        </Row>
        {(st.buttonBorderWidth ?? 0) > 0 && (
          <Row label="Cor borda">
            <ColorPickerPro value={st.buttonBorderColor ?? '#e5e7eb'} onChange={(hex) => updateStyle({ buttonBorderColor: hex })} onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonBorderColor: hex }))} />
          </Row>
        )}
        <Row label="Raio">
          <input type="range" min={0} max={32} value={st.buttonRadiusPx ?? 10} onChange={(e) => updateStyle({ buttonRadiusPx: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.buttonRadiusPx ?? 10}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y">
          <input type="range" min={-80} max={80} step={4} value={st.offsetY ?? 0} onChange={(e) => updateStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
        <Row label="">
          <Button onClick={() => updateStyle({ offsetY: 0 })}>Reset</Button>
        </Row>
      </CollapsibleSection>

    </div>
  )
}

// ===== COMPONENTES AUXILIARES =====

const rightNum: React.CSSProperties = { fontSize: 12, opacity: 0.7, minWidth: 45, textAlign: 'right' }
const selectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontWeight: 600, fontSize: 12, minWidth: 110 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13 }

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: { title: string; subtitle?: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
      <button onClick={onToggle} style={{ width: '100%', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</div>
      </button>
      {isOpen && <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8, minWidth: 80 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ padding: '8px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.10)', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 12 }}>
      {children}
    </button>
  )
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} style={{ padding: '6px 14px', borderRadius: 10, border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)', background: active ? 'rgba(59,130,246,0.1)' : '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 11, color: active ? '#3b82f6' : '#333', minWidth: 50, whiteSpace: 'nowrap' }}>
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 999, background: active ? '#3b82f6' : '#e5e7eb', position: 'relative', border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}>
      <span style={{ position: 'absolute', top: 2, left: active ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  )
}
