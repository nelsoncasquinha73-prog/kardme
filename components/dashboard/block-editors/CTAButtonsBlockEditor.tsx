'use client'

import React, { useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'
import { useColorPicker } from '@/components/editor/ColorPickerContext'

type IconMode = 'none' | 'library' | 'upload'

type ActionType = 'link' | 'phone' | 'whatsapp'

type CtaButton = {
  actionType?: ActionType
  phone?: string
  whatsappMessage?: string
  id: string
  label: string
  url: string
  openInNewTab?: boolean
  icon?: {
    mode: IconMode
    libraryName?: string
    uploadUrl?: string
    sizePx?: number
    position?: 'left' | 'right'
  }
}

type CTAButtonsSettings = {
  buttons: CtaButton[]
  layout?: 'stack' | 'row'
  align?: 'left' | 'center' | 'right'
  gapPx?: number
}

type CTAButtonsStyle = {
  offsetY?: number

  button?: {
    heightPx?: number
    radius?: number
    bgColor?: string
    textColor?: string
    fontFamily?: string
    fontSize?: number
    bold?: boolean
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    iconGapPx?: number
    widthMode?: "full" | "auto" | "custom"
    customWidthPx?: number
  }

  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
    widthMode?: "full" | "custom"
    customWidthPx?: number
  }
}

type Props = {
  cardId?: string
  settings: CTAButtonsSettings
  style?: CTAButtonsStyle
  onChangeSettings: (s: CTAButtonsSettings) => void
  onChangeStyle?: (s: CTAButtonsStyle) => void
}

function uid(prefix = 'cta') {
  return `\${prefix}-\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2, 9)}`
}

function safeSeg(v: any) {
  return String(v || '').replace(/[^a-zA-Z0-9/_-]/g, '-')
}

export default function CTAButtonsBlockEditor({ cardId, settings, style, onChangeSettings, onChangeStyle }: Props) {
  const { openPicker } = useColorPicker()

  const s: CTAButtonsSettings = settings || { buttons: [] }
  const st: CTAButtonsStyle = style || {}
  const buttons = useMemo(() => (Array.isArray(s.buttons) ? s.buttons : []), [s.buttons])

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  const updateSettings = (patch: Partial<CTAButtonsSettings>) => onChangeSettings({ ...s, ...patch })
  const updateStyle = (patch: Partial<CTAButtonsStyle>) => {
    if (!onChangeStyle) return
    onChangeStyle({ ...st, ...patch })
  }

  const updateButton = (id: string, patch: Partial<CtaButton>) => {
    updateSettings({ buttons: buttons.map((b) => (b.id === id ? { ...b, ...patch } : b)) })
  }

  const addButton = () => {
    const next: CtaButton = {
      id: uid(),
      label: 'Marcar visita',
      url: 'https://',
      openInNewTab: true,
      icon: { mode: 'none', sizePx: 18, position: 'left' },
    }
    updateSettings({ buttons: [...buttons, next].slice(0, 4) })
  }

  const removeButton = (id: string) => updateSettings({ buttons: buttons.filter((b) => b.id !== id) })

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const pickFileFor = (buttonId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.dataset.targetId = buttonId
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

      const bucket = 'icons'
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const safeCardId = safeSeg(cardId || 'no-card')
      const safeTargetId = safeSeg(targetId)
      const path = `cards/\${safeCardId}/cta-icons/\${safeTargetId}-\${Date.now()}.\${ext}`

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Não foi possível obter o URL público do ícone.')

      const prev = buttons.find((b) => b.id === targetId)
      const prevIcon = prev?.icon || { mode: 'upload', sizePx: 18, position: 'left' }

      updateButton(targetId, {
        icon: {
          ...prevIcon,
          mode: 'upload',
          uploadUrl: publicUrl,
        },
      })
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload do ícone.')
    }
  }

  const btn = st.button || {}
  const updateBtnStyle = (patch: Partial<NonNullable<CTAButtonsStyle['button']>>) =>
    updateStyle({ button: { ...(st.button || {}), ...patch } })

  const container = st.container || {}
  const updateContainer = (patch: Partial<NonNullable<CTAButtonsStyle["container"]>>) =>
    updateStyle({ container: { ...(st.container || {}), ...patch } })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

      <Section title="Botões">
        <Row label="Disposição">
          <select value={s.layout ?? 'stack'} onChange={(e) => updateSettings({ layout: e.target.value as any })} style={select}>
            <option value="stack">Vertical</option>
            <option value="row">Horizontal</option>
          </select>
        </Row>

        <Row label="Alinhamento">
          <select value={s.align ?? 'center'} onChange={(e) => updateSettings({ align: e.target.value as any })} style={select}>
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Espaçamento entre botões (px)">
          <input
            type="range"
            min={4}
            max={24}
            step={1}
            value={s.gapPx ?? 10}
            onChange={(e) => updateSettings({ gapPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{s.gapPx ?? 10}px</span>
        </Row>

        <Row label="Adicionar botão">
          <button
            type="button"
            onClick={addButton}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: 12,
            }}
          >
            Adicionar botão
          </button>
          <div style={{ marginLeft: 10, fontSize: 12, opacity: 0.7 }}>Até 4 botões</div>
        </Row>

        {buttons.length === 0 && <div style={{ opacity: 0.7 }}>Sem botões — adiciona o primeiro CTA</div>}

        {buttons.map((b, idx) => {
          const icon = b.icon || { mode: 'none', sizePx: 18, position: 'left' }
          const hasUpload = !!(icon.uploadUrl && icon.uploadUrl.trim())

          return (
            <div
              key={b.id}
              style={{
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                padding: 12,
                marginBottom: 12,
                backgroundColor: '#fff',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: 14 }}>Botão #{idx + 1}</strong>
                <button
                  type="button"
                  onClick={() => removeButton(b.id)}
                  style={{ cursor: 'pointer', color: '#e53e3e', border: 'none', background: 'none', fontWeight: 'bold', fontSize: 16 }}
                  title="Remover botão"
                >
                  ×
                </button>
              </div>

              <Row label="Texto do botão">
                <input value={b.label ?? ''} onChange={(e) => updateButton(b.id, { label: e.target.value })} style={input} placeholder="Ex.: Marcar visita" />
              </Row>

              <Row label="Tipo de ação">
                <select value={b.actionType ?? "link"} onChange={(e) => updateButton(b.id, { actionType: e.target.value as any })} style={select}>
                  <option value="link">Link (URL)</option>
                  <option value="phone">Ligar (Telefone)</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </Row>

              {(b.actionType ?? "link") === "link" && (
                <>
                  <Row label="URL">
                    <input value={b.url ?? ""} onChange={(e) => updateButton(b.id, { url: e.target.value })} style={input} placeholder="https://exemplo.com" />
                  </Row>
                  <Row label="Abrir em nova aba">
                    <Toggle active={b.openInNewTab === true} onClick={() => updateButton(b.id, { openInNewTab: !(b.openInNewTab === true) })} />
                  </Row>
                </>
              )}

              {b.actionType === "phone" && (
                <Row label="Número de telefone">
                  <input value={b.phone ?? ""} onChange={(e) => updateButton(b.id, { phone: e.target.value })} style={input} placeholder="+351 912 345 678" />
                </Row>
              )}

              {b.actionType === "whatsapp" && (
                <>
                  <Row label="Número WhatsApp">
                    <input value={b.phone ?? ""} onChange={(e) => updateButton(b.id, { phone: e.target.value })} style={input} placeholder="+351912345678" />
                  </Row>
                  <Row label="Mensagem pré-definida">
                    <input value={b.whatsappMessage ?? ""} onChange={(e) => updateButton(b.id, { whatsappMessage: e.target.value })} style={input} placeholder="Olá, gostava de saber mais..." />
                  </Row>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.75 }}>Ícone</span>

                <select
                  value={icon.mode ?? 'none'}
                  onChange={(e) => updateButton(b.id, { icon: { ...icon, mode: e.target.value as any } })}
                  style={select}
                >
                  <option value="none">Sem ícone</option>
                  <option value="upload">Upload</option>
                  <option value="library">Biblioteca (em breve)</option>
                </select>

                {icon.mode === 'upload' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => pickFileFor(b.id)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 12,
                      }}
                    >
                      Carregar ícone
                    </button>

                    <div style={{ fontSize: 12, opacity: 0.7 }}>{hasUpload ? '✅ ícone definido' : '⚠️ sem ícone'}</div>

                    {hasUpload ? (
                      <button
                        type="button"
                        onClick={() => updateButton(b.id, { icon: { ...icon, uploadUrl: '' } })}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(229, 62, 62, 0.25)',
                          background: 'rgba(229, 62, 62, 0.08)',
                          cursor: 'pointer',
                          fontWeight: 900,
                          fontSize: 12,
                          color: '#e53e3e',
                        }}
                      >
                        Limpar
                      </button>
                    ) : null}
                  </div>
                )}

                {icon.mode === 'upload' && hasUpload ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img
                      src={icon.uploadUrl}
                      alt=""
                      style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'contain', border: '1px solid rgba(0,0,0,0.08)', background: '#fff' }}
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>{icon.uploadUrl}</div>
                  </div>
                ) : null}

                <Row label="Tamanho do ícone (px)">
                  <input
                    type="range"
                    min={12}
                    max={40}
                    step={1}
                    value={icon.sizePx ?? 18}
                    onChange={(e) => updateButton(b.id, { icon: { ...icon, sizePx: Number(e.target.value) } })}
                  />
                  <span style={rightNum}>{icon.sizePx ?? 18}px</span>
                </Row>

                <Row label="Posição">
                  <select value={icon.position ?? 'left'} onChange={(e) => updateButton(b.id, { icon: { ...icon, position: e.target.value as any } })} style={select}>
                    <option value="left">Esquerda</option>
                    <option value="right">Direita</option>
                  </select>
                </Row>
              </div>
            </div>
          )
        })}
      </Section>

      <Section title="Estilo do botão">
        <Row label="Altura (px)">
          <input type="range" min={32} max={64} step={1} value={btn.heightPx ?? 44} onChange={(e) => updateBtnStyle({ heightPx: Number(e.target.value) })} />
          <span style={rightNum}>{btn.heightPx ?? 44}px</span>
        </Row>

        <Row label="Raio (px)">
          <input type="range" min={0} max={32} step={1} value={btn.radius ?? 14} onChange={(e) => updateBtnStyle({ radius: Number(e.target.value) })} />
          <span style={rightNum}>{btn.radius ?? 14}px</span>
        </Row>

        <Row label="Cor de fundo">
          <ColorPickerPro
            value={btn.bgColor ?? '#111827'}
            onChange={(val) => updateBtnStyle({ bgColor: val })}
            onEyedropper={() => pickEyedropper((hex) => updateBtnStyle({ bgColor: hex }))}
            
          />
        </Row>

        <Row label="Cor do texto">
          <ColorPickerPro
            value={btn.textColor ?? '#ffffff'}
            onChange={(val) => updateBtnStyle({ textColor: val })}
            onEyedropper={() => pickEyedropper((hex) => updateBtnStyle({ textColor: hex }))}
          />
        </Row>

        <Row label="Fonte"><FontPicker value={btn.fontFamily ?? ""} onChange={(v) => updateBtnStyle({ fontFamily: v || undefined })} /></Row>

        <Row label="Tamanho do texto (px)">
          <input type="range" min={11} max={22} step={1} value={btn.fontSize ?? 14} onChange={(e) => updateBtnStyle({ fontSize: Number(e.target.value) })} />
          <span style={rightNum}>{btn.fontSize ?? 14}px</span>
        </Row>

        <Row label="Negrito">
          <Toggle active={btn.bold === true} onClick={() => updateBtnStyle({ bold: !(btn.bold === true) })} />
        </Row>

        <Row label="Sombra">
          <Toggle active={btn.shadow === true} onClick={() => updateBtnStyle({ shadow: !(btn.shadow === true) })} />
        </Row>

        <Row label="Borda (px)">
          <input type="range" min={0} max={6} step={1} value={btn.borderWidth ?? 0} onChange={(e) => updateBtnStyle({ borderWidth: Number(e.target.value) })} />
          <span style={rightNum}>{btn.borderWidth ?? 0}px</span>
        </Row>

        <Row label="Cor da borda">
          <ColorPickerPro
            value={btn.borderColor ?? 'rgba(255,255,255,0.25)'}
            onChange={(val) => updateBtnStyle({ borderColor: val })}
            onEyedropper={() => pickEyedropper((hex) => updateBtnStyle({ borderColor: hex }))}
          />
        </Row>

        <Row label="Espaço ícone–texto (px)">
          <input type="range" min={4} max={20} step={1} value={btn.iconGapPx ?? 10} onChange={(e) => updateBtnStyle({ iconGapPx: Number(e.target.value) })} />
          <span style={rightNum}>{btn.iconGapPx ?? 10}px</span>
        </Row>

        <Row label="Largura do botão">
          <select value={btn.widthMode ?? "full"} onChange={(e) => updateBtnStyle({ widthMode: e.target.value as any })} style={select}>
            <option value="full">100%</option>
            <option value="auto">Automática</option>
            <option value="custom">Personalizada</option>
          </select>
        </Row>

        {btn.widthMode === "custom" && (
          <Row label="Largura (px)">
            <input type="range" min={100} max={350} step={5} value={btn.customWidthPx ?? 200} onChange={(e) => updateBtnStyle({ customWidthPx: Number(e.target.value) })} />
            <span style={rightNum}>{btn.customWidthPx ?? 200}px</span>
          </Row>
        )}
      </Section>

      <Section title="Container">
        <Row label="Ativar container">
          <Toggle active={container.enabled !== false} onClick={() => updateContainer({ enabled: !(container.enabled !== false) })} />
        </Row>

        <Row label="Fundo">
          <Toggle
            active={(container.bgColor ?? "transparent") !== "transparent"}
            onClick={() => updateContainer({ bgColor: (container.bgColor ?? "transparent") !== "transparent" ? "transparent" : "#ffffff" })}
          />
        </Row>

        {(container.bgColor ?? "transparent") !== "transparent" && (
          <Row label="Cor do fundo">
            <ColorPickerPro
              value={container.bgColor ?? "#ffffff"}
              onChange={(val) => updateContainer({ bgColor: val })}
              onEyedropper={() => pickEyedropper((hex) => updateContainer({ bgColor: hex }))}
              
            />
          </Row>
        )}

        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => updateContainer({ shadow: !(container.shadow ?? false) })} />
        </Row>

        <Row label="Borda">
          <Toggle
            active={(container.borderWidth ?? 0) > 0}
            onClick={() => updateContainer({ borderWidth: (container.borderWidth ?? 0) > 0 ? 0 : 1 })}
          />
        </Row>

        {(container.borderWidth ?? 0) > 0 && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} step={1} value={container.borderWidth ?? 1} onChange={(e) => updateContainer({ borderWidth: Number(e.target.value) })} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor da borda">
              <ColorPickerPro
                value={container.borderColor ?? "rgba(0,0,0,0.12)"}
                onChange={(val) => updateContainer({ borderColor: val })}
                onEyedropper={() => pickEyedropper((hex) => updateContainer({ borderColor: hex }))}
              />
            </Row>
          </>
        )}

        <Row label="Raio">
          <input type="range" min={0} max={32} step={1} value={container.radius ?? 16} onChange={(e) => updateContainer({ radius: Number(e.target.value) })} />
          <span style={rightNum}>{container.radius ?? 16}px</span>
        </Row>

        <Row label="Padding">
          <input type="range" min={0} max={28} step={1} value={container.padding ?? 12} onChange={(e) => updateContainer({ padding: Number(e.target.value) })} />
          <span style={rightNum}>{container.padding ?? 12}px</span>
        </Row>

        <Row label="Largura">
          <select value={container.widthMode ?? "full"} onChange={(e) => updateContainer({ widthMode: e.target.value as any })} style={select}>
            <option value="full">100%</option>
            <option value="custom">Personalizada</option>
          </select>
        </Row>

        {container.widthMode === "custom" && (
          <Row label="Largura (px)">
            <input type="range" min={200} max={400} step={5} value={container.customWidthPx ?? 320} onChange={(e) => updateContainer({ customWidthPx: Number(e.target.value) })} />
            <span style={rightNum}>{container.customWidthPx ?? 320}px</span>
          </Row>
        )}
      </Section>

      <Section title="Posição">
        <Row label="Deslocamento Y (px)">
          <input type="range" min={-80} max={80} step={1} value={st.offsetY ?? 0} onChange={(e) => updateStyle({ offsetY: Number(e.target.value) })} />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
      </Section>
    </div>
  )
}
