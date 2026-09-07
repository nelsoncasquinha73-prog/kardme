'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerProUnified from '@/components/editor/ColorPickerProUnified'
import FontPicker from '@/components/editor/FontPicker'

type CustomLeadField = {
  id: string
  label: string
  placeholder?: string
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea'
  required?: boolean
  enabled?: boolean
}

type LeadFormSettings = {
  title?: string
  description?: string
  buttonLabel?: string
  fields?: { name?: boolean; email?: boolean; phone?: boolean; message?: boolean; zone?: boolean }

  requiredFields?: { name?: boolean; email?: boolean; phone?: boolean; message?: boolean; zone?: boolean }
  labels?: { name?: string; email?: string; phone?: string; message?: string; zone?: string }
  placeholders?: { name?: string; email?: string; phone?: string; message?: string; zone?: string }

  customFields?: CustomLeadField[]
  fieldOrder?: string[]
  consentCheckboxEnabled?: boolean
  consentCheckboxText?: string
  marketingCheckboxEnabled?: boolean
  marketingCheckboxText?: string
}

type LeadFormStyle = {
  offsetY?: number
  heading?: { fontFamily?: string; fontWeight?: number; color?: string; align?: 'left' | 'center' | 'right'; fontSize?: number }
  container?: { enabled?: boolean; bgColor?: string; radius?: number; padding?: number; borderWidth?: number; borderColor?: string; shadow?: boolean; widthMode?: 'full' | 'custom'; customWidthPx?: number }
  inputs?: { bgColor?: string; textColor?: string; borderColor?: string; radius?: number; fontSize?: number; paddingY?: number; paddingX?: number; labelColor?: string; labelSize?: number; placeholderColor?: string }
     button?: {
    bgColor?: string
    textColor?: string
    radius?: number
    height?: number
    fontWeight?: number
    borderWidth?: number
    borderColor?: string
    shadow?: boolean
  }
  consentCheckbox?: {
    textColor?: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: number
  }
}

type Props = {
  settings: LeadFormSettings
  style?: LeadFormStyle
  onChangeSettings: (s: LeadFormSettings) => void
  onChangeStyle: (s: LeadFormStyle) => void
  onBlurFlushSave?: () => void
}

export default function LeadFormBlockEditor({ settings, style, onChangeSettings, onChangeStyle, onBlurFlushSave }: Props) {
  const { openPicker } = useColorPicker()
  const [activeSection, setActiveSection] = useState<string | null>('content')

  const s = settings || {}
  const st = style || {}
  const fields = s.fields || {}
  const requiredFields = s.requiredFields || {}
  const labels = s.labels || {}
  const placeholders = s.placeholders || {}
  const customFields = Array.isArray(s.customFields) ? s.customFields : []

  const baseFieldIds = ['name', 'email', 'phone', 'message', 'zone']

  const allFieldIds = [
    ...baseFieldIds,
    ...customFields.map((f) => f.id),
  ]

  const completeFieldOrder = [
    ...(Array.isArray(s.fieldOrder) ? s.fieldOrder : baseFieldIds),
    ...allFieldIds.filter(
      (id) => !(Array.isArray(s.fieldOrder) ? s.fieldOrder : baseFieldIds).includes(id)
    ),
  ].filter((id, index, arr) => allFieldIds.includes(id) && arr.indexOf(id) === index)

  const moveField = (id: string, direction: -1 | 1) => {
    const current = [...completeFieldOrder]
    const index = current.indexOf(id)

    if (index < 0) return

    const target = index + direction

    if (target < 0 || target >= current.length) return

    ;[current[index], current[target]] = [current[target], current[index]]

    setSettings({ fieldOrder: current })
  }
  const heading = st.heading || {}
  const container = st.container || {}
  const inputs = st.inputs || {}
  const button = st.button || {}

  const pickEyedropper = (apply: (hex: string) => void) => openPicker({ mode: 'eyedropper', onPick: apply })

  const setSettings = (patch: Partial<LeadFormSettings>) => { onChangeSettings({ ...s, ...patch }); onBlurFlushSave?.() }
  const setStyle = (patch: Partial<LeadFormStyle>) => { onChangeStyle({ ...st, ...patch }); onBlurFlushSave?.() }
  const setHeading = (patch: Partial<LeadFormStyle['heading']>) => setStyle({ heading: { ...heading, ...patch } })
  const setContainer = (patch: Partial<LeadFormStyle['container']>) => setStyle({ container: { ...container, ...patch } })
  const setInputs = (patch: Partial<LeadFormStyle['inputs']>) => setStyle({ inputs: { ...inputs, ...patch } })
  const setButton = (patch: Partial<LeadFormStyle['button']>) => setStyle({ button: { ...button, ...patch } })
  const consentCheckbox = st.consentCheckbox || {}
  const setConsentCheckbox = (patch: Partial<LeadFormStyle['consentCheckbox']>) => setStyle({ consentCheckbox: { ...consentCheckbox, ...patch } })
  const setFields = (patch: Partial<LeadFormSettings['fields']>) => setSettings({ fields: { ...fields, ...patch } })

  const setRequiredFields = (patch: Partial<LeadFormSettings['requiredFields']>) =>
    setSettings({ requiredFields: { ...requiredFields, ...patch } })
  const setLabels = (patch: Partial<LeadFormSettings['labels']>) => setSettings({ labels: { ...labels, ...patch } })
  const setPlaceholders = (patch: Partial<LeadFormSettings['placeholders']>) => setSettings({ placeholders: { ...placeholders, ...patch } })

  const addCustomField = () => {
    const next: CustomLeadField = {
      id: `custom_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      label: 'Novo campo',
      placeholder: '',
      type: 'text',
      required: false,
      enabled: true,
    }
    setSettings({
      customFields: [...customFields, next],
      fieldOrder: [...completeFieldOrder, next.id],
    })
  }

  const updateCustomField = (id: string, patch: Partial<CustomLeadField>) => {
    setSettings({
      customFields: customFields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    })
  }

  const removeCustomField = (id: string) => {
    setSettings({
      customFields: customFields.filter((f) => f.id !== id),
      fieldOrder: completeFieldOrder.filter((fieldId) => fieldId !== id),
    })
  }

  const consentCheckboxSettings = s.consentCheckboxEnabled ?? true
  const marketingCheckboxSettings = s.marketingCheckboxEnabled ?? false

  const bgEnabled = (container.bgColor ?? 'transparent') !== 'transparent'
  const borderEnabled = (container.borderWidth ?? 0) > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ========== CONTEÚDO ========== */}
      <CollapsibleSection title="📝 Conteúdo" subtitle="Título, descrição, botão" isOpen={activeSection === 'content'} onToggle={() => setActiveSection(activeSection === 'content' ? null : 'content')}>
        <Row label="Título">
          <input type="text" value={s.title ?? 'Pede informação'} onChange={(e) => setSettings({ title: e.target.value })} placeholder="Título" style={inputStyle} />
        </Row>
        <Row label="Descrição">
          <input type="text" value={s.description ?? 'Deixa os teus dados e eu entro em contacto.'} onChange={(e) => setSettings({ description: e.target.value })} placeholder="Descrição" style={inputStyle} />
        </Row>
        <Row label="Botão">
          <input type="text" value={s.buttonLabel ?? 'Enviar'} onChange={(e) => setSettings({ buttonLabel: e.target.value })} placeholder="Enviar" style={inputStyle} />
        </Row>
      </CollapsibleSection>

      {/* ========== CAMPOS ========== */}
      <CollapsibleSection
        title="📋 Campos"
        subtitle="Ativar, obrigatórios e campos personalizados"
        isOpen={activeSection === 'fields'}
        onToggle={() => setActiveSection(activeSection === 'fields' ? null : 'fields')}
      >
        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
          Campos base
        </div>

        {([
          ['name', 'Nome'],
          ['email', 'Email'],
          ['phone', 'Telefone'],
          ['message', 'Mensagem'],
          ['zone', 'Zona'],
        ] as const).map(([key, title]) => {
          const enabled =
            key === 'zone'
              ? fields[key] === true
              : fields[key] !== false

          const requiredDefault = key === 'name' || key === 'email'

          return (
            <div
              key={key}
              style={{
                padding: 10,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <strong style={{ fontSize: 12 }}>{title}</strong>

                  <button
                    type="button"
                    onClick={() => moveField(key, -1)}
                    disabled={completeFieldOrder.indexOf(key) === 0}
                    style={orderButtonStyle}
                    title="Mover para cima"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() => moveField(key, 1)}
                    disabled={completeFieldOrder.indexOf(key) === completeFieldOrder.length - 1}
                    style={orderButtonStyle}
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                </div>

                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, opacity: 0.65 }}>Ativo</span>
                  <Toggle
                    active={enabled}
                    onClick={() => setFields({ [key]: !enabled })}
                  />
                </div>
              </div>

              {enabled && (
                <>
                  <Row label="Obrigatório">
                    <Toggle
                      active={requiredFields[key] ?? requiredDefault}
                      onClick={() =>
                        setRequiredFields({
                          [key]: !(requiredFields[key] ?? requiredDefault),
                        })
                      }
                    />
                  </Row>

                  <Row label="Label">
                    <input
                      type="text"
                      value={
                        labels[key] ??
                        (key === 'name'
                          ? 'Nome'
                          : key === 'email'
                            ? 'Email'
                            : key === 'phone'
                              ? 'Telefone'
                              : key === 'message'
                                ? 'Mensagem'
                                : 'Zona / Localização')
                      }
                      onChange={(e) => setLabels({ [key]: e.target.value })}
                      style={inputStyle}
                    />
                  </Row>

                  <Row label="Placeholder">
                    <input
                      type="text"
                      value={placeholders[key] ?? ''}
                      onChange={(e) => setPlaceholders({ [key]: e.target.value })}
                      style={inputStyle}
                    />
                  </Row>
                </>
              )}
            </div>
          )
        })}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '8px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800 }}>Campos personalizados</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>Cria perguntas específicas para cada negócio</div>
          </div>

          <Button onClick={addCustomField}>+ Adicionar campo</Button>
        </div>

        {customFields.length === 0 && (
          <div style={{ fontSize: 12, opacity: 0.55, padding: '8px 0' }}>
            Ainda não existem campos personalizados.
          </div>
        )}

        {customFields.map((field, index) => (
          <div
            key={field.id}
            style={{
              padding: 12,
              border: '1px solid rgba(59,130,246,0.18)',
              background: 'rgba(59,130,246,0.03)',
              borderRadius: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ fontSize: 12 }}>Campo #{index + 1}</strong>

                <button
                  type="button"
                  onClick={() => moveField(field.id, -1)}
                  disabled={completeFieldOrder.indexOf(field.id) === 0}
                  style={orderButtonStyle}
                  title="Mover para cima"
                >
                  ↑
                </button>

                <button
                  type="button"
                  onClick={() => moveField(field.id, 1)}
                  disabled={completeFieldOrder.indexOf(field.id) === completeFieldOrder.length - 1}
                  style={orderButtonStyle}
                  title="Mover para baixo"
                >
                  ↓
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeCustomField(field.id)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: 16,
                  fontWeight: 800,
                }}
                title="Eliminar campo"
              >
                ×
              </button>
            </div>

            <Row label="Tipo">
              <select
                value={field.type}
                onChange={(e) =>
                  updateCustomField(field.id, {
                    type: e.target.value as CustomLeadField['type'],
                  })
                }
                style={selectStyle}
              >
                <option value="text">Texto curto</option>
                <option value="textarea">Texto longo</option>
                <option value="email">Email</option>
                <option value="tel">Telefone</option>
                <option value="number">Número</option>
                <option value="date">Data</option>
              </select>
            </Row>

            <Row label="Ativo">
              <Toggle
                active={field.enabled !== false}
                onClick={() =>
                  updateCustomField(field.id, {
                    enabled: field.enabled === false,
                  })
                }
              />
            </Row>

            <Row label="Obrigatório">
              <Toggle
                active={field.required === true}
                onClick={() =>
                  updateCustomField(field.id, {
                    required: !(field.required === true),
                  })
                }
              />
            </Row>

            <Row label="Label">
              <input
                type="text"
                value={field.label}
                onChange={(e) =>
                  updateCustomField(field.id, { label: e.target.value })
                }
                style={inputStyle}
                placeholder="Ex: Zona do corpo"
              />
            </Row>

            {field.type !== 'date' && (
              <Row label="Placeholder">
                <input
                  type="text"
                  value={field.placeholder ?? ''}
                  onChange={(e) =>
                    updateCustomField(field.id, { placeholder: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Ex: Braço, costas..."
                />
              </Row>
            )}
          </div>
        ))}
      </CollapsibleSection>

      {/* ========== TÍTULO (ESTILO) ========== */}
      <CollapsibleSection title="🎨 Título" subtitle="Cor, fonte, alinhamento" isOpen={activeSection === 'heading'} onToggle={() => setActiveSection(activeSection === 'heading' ? null : 'heading')}>
        <Row label="Alinhamento">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((a) => (
              <MiniButton key={a} active={(heading.align ?? 'left') === a} onClick={() => setHeading({ align: a })}>
                {a === 'left' ? '◀' : a === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>
        <Row label="Cor">
          <ColorPickerProUnified value={heading.color ?? '#111827'} onChange={(hex) => setHeading({ color: hex })} onEyedropper={() => pickEyedropper((hex) => setHeading({ color: hex }))} />
        </Row>
        <Row label="Fonte"><FontPicker value={heading.fontFamily ?? ""} onChange={(v) => setHeading({ fontFamily: v || "" })} /></Row>
        <Row label="Peso">
          <select value={String(heading.fontWeight ?? 900)} onChange={(e) => setHeading({ fontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
            <option value="800">Extra</option>
            <option value="900">Black</option>
          </select>
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={28} value={heading.fontSize ?? 14} onChange={(e) => setHeading({ fontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{heading.fontSize ?? 14}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== CONTAINER ========== */}
      <CollapsibleSection title="📦 Container" subtitle="Fundo, borda, padding" isOpen={activeSection === 'container'} onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}>
        <Row label="Ativar">
          <Toggle active={container.enabled !== false} onClick={() => setContainer({ enabled: !(container.enabled !== false) })} />
        </Row>
        <Row label="Fundo">
          <Toggle active={bgEnabled} onClick={() => setContainer({ bgColor: bgEnabled ? 'transparent' : '#ffffff' })} />
        </Row>
        {bgEnabled && (
          <Row label="Cor">
            <ColorPickerProUnified value={container.bgColor ?? '#ffffff'} onChange={(hex) => setContainer({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ bgColor: hex }))} />
          </Row>
        )}
        <Row label="Sombra">
          <Toggle active={container.shadow ?? false} onClick={() => setContainer({ shadow: !container.shadow })} />
        </Row>
        <Row label="Borda">
          <Toggle active={borderEnabled} onClick={() => setContainer({ borderWidth: borderEnabled ? 0 : 1 })} />
        </Row>
        {borderEnabled && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={6} value={container.borderWidth ?? 1} onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{container.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerProUnified value={container.borderColor ?? 'rgba(0,0,0,0.12)'} onChange={(hex) => setContainer({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setContainer({ borderColor: hex }))} />
            </Row>
          </>
        )}
        <Row label="Raio">
          <input type="range" min={0} max={32} value={container.radius ?? 16} onChange={(e) => setContainer({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.radius ?? 16}px</span>
        </Row>
        <Row label="Padding">
          <input type="range" min={0} max={28} value={container.padding ?? 12} onChange={(e) => setContainer({ padding: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{container.padding ?? 12}px</span>
        </Row>
        <Row label="Largura">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton active={(container.widthMode ?? 'full') === 'full'} onClick={() => setContainer({ widthMode: 'full' })}>100%</MiniButton>
            <MiniButton active={container.widthMode === 'custom'} onClick={() => setContainer({ widthMode: 'custom' })}>Custom</MiniButton>
          </div>
        </Row>
        {container.widthMode === 'custom' && (
          <Row label="Largura (px)">
            <input type="range" min={200} max={400} step={5} value={container.customWidthPx ?? 320} onChange={(e) => setContainer({ customWidthPx: Number(e.target.value) })} style={{ flex: 1 }} />
            <span style={rightNum}>{container.customWidthPx ?? 320}px</span>
          </Row>
        )}
      </CollapsibleSection>

      {/* ========== INPUTS ========== */}
      <CollapsibleSection title="✏️ Inputs" subtitle="Cores, tamanhos, bordas" isOpen={activeSection === 'inputs'} onToggle={() => setActiveSection(activeSection === 'inputs' ? null : 'inputs')}>
        <Row label="Cor label">
          <ColorPickerProUnified value={inputs.labelColor ?? 'rgba(17,24,39,0.75)'} onChange={(hex) => setInputs({ labelColor: hex })} onEyedropper={() => pickEyedropper((hex) => setInputs({ labelColor: hex }))} />
        </Row>
        <Row label="Tamanho label">
          <input type="range" min={10} max={18} value={inputs.labelSize ?? 12} onChange={(e) => setInputs({ labelSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{inputs.labelSize ?? 12}px</span>
        </Row>
        <Row label="Cor placeholder">
          <ColorPickerProUnified value={inputs.placeholderColor ?? 'rgba(0,0,0,0.4)'} onChange={(hex) => setInputs({ placeholderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setInputs({ placeholderColor: hex }))} />
        </Row>
        <Row label="Fundo input">
          <ColorPickerProUnified value={inputs.bgColor ?? '#ffffff'} onChange={(hex) => setInputs({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setInputs({ bgColor: hex }))} />
        </Row>
        <Row label="Texto input">
          <ColorPickerProUnified value={inputs.textColor ?? '#111827'} onChange={(hex) => setInputs({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setInputs({ textColor: hex }))} />
        </Row>
        <Row label="Borda input">
          <ColorPickerProUnified value={inputs.borderColor ?? 'rgba(0,0,0,0.14)'} onChange={(hex) => setInputs({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setInputs({ borderColor: hex }))} />
        </Row>
        <Row label="Raio input">
          <input type="range" min={6} max={24} value={inputs.radius ?? 12} onChange={(e) => setInputs({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{inputs.radius ?? 12}px</span>
        </Row>
        <Row label="Tamanho texto">
          <input type="range" min={12} max={18} value={inputs.fontSize ?? 14} onChange={(e) => setInputs({ fontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{inputs.fontSize ?? 14}px</span>
        </Row>
      </CollapsibleSection>

       
      {/* ========== CONSENTIMENTO ========== */}
      <CollapsibleSection title="✔️ Consentimento" subtitle="Ativar, texto" isOpen={activeSection === 'consentimento'} onToggle={() => setActiveSection(activeSection === 'consentimento' ? null : 'consentimento')}>
        <Row label="Ativar"><Toggle active={consentCheckboxSettings} onClick={() => setSettings({ consentCheckboxEnabled: !consentCheckboxSettings })} /></Row>
        <Row label="Texto"><input type="text" value={s.consentCheckboxText ?? 'Concordo em ser contactado(a) para responder ao meu pedido.'} onChange={(e) => setSettings({ consentCheckboxText: e.target.value })} style={inputStyle} /></Row>
      </CollapsibleSection>

      {/* ========== MARKETING / BROADCAST ========== */}
      <CollapsibleSection title="📧 Marketing / Broadcast" subtitle="Ativar, texto" isOpen={activeSection === 'marketing'} onToggle={() => setActiveSection(activeSection === 'marketing' ? null : 'marketing')}>
        <Row label="Ativar"><Toggle active={marketingCheckboxSettings} onClick={() => setSettings({ marketingCheckboxEnabled: !marketingCheckboxSettings })} /></Row>
        <Row label="Texto"><input type="text" value={s.marketingCheckboxText ?? 'Quero receber novidades e oportunidades por email.'} onChange={(e) => setSettings({ marketingCheckboxText: e.target.value })} style={inputStyle} /></Row>
      </CollapsibleSection>

      {/* ========== CHECKBOX CONSENTIMENTO ========== */}
      <CollapsibleSection title="✅ Checkbox Consentimento" subtitle="Cor, fonte, tamanho" isOpen={activeSection === 'consent'} onToggle={() => setActiveSection(activeSection === 'consent' ? null : 'consent')}>
        <Row label="Cor">
          <ColorPickerProUnified value={consentCheckbox.textColor ?? 'rgba(17,24,39,0.75)'} onChange={(hex) => setConsentCheckbox({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setConsentCheckbox({ textColor: hex }))} />
        </Row>
        <Row label="Fonte">
          <FontPicker value={consentCheckbox.fontFamily ?? ""} onChange={(v) => setConsentCheckbox({ fontFamily: v || "" })} />
        </Row>
        <Row label="Tamanho">
          <input type="range" min={10} max={18} value={consentCheckbox.fontSize ?? 12} onChange={(e) => setConsentCheckbox({ fontSize: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{consentCheckbox.fontSize ?? 12}px</span>
        </Row>
        <Row label="Peso">
          <select value={String(consentCheckbox.fontWeight ?? 500)} onChange={(e) => setConsentCheckbox({ fontWeight: Number(e.target.value) })} style={selectStyle}>
            <option value="400">Normal</option>
            <option value="500">Medium</option>
            <option value="600">Semi</option>
            <option value="700">Bold</option>
          </select>
        </Row>
      </CollapsibleSection>

      {/* ========== BOTÃO ========== */}
      <CollapsibleSection title="🔘 Botão" subtitle="Cor, altura, raio, borda, sombra" isOpen={activeSection === 'button'} onToggle={() => setActiveSection(activeSection === 'button' ? null : 'button')}>
        <Row label="Cor fundo">
          <ColorPickerProUnified value={button.bgColor ?? '#3b82f6'} onChange={(hex) => setButton({ bgColor: hex })} onEyedropper={() => pickEyedropper((hex) => setButton({ bgColor: hex }))} />
        </Row>
        <Row label="Cor texto">
          <ColorPickerProUnified value={button.textColor ?? '#ffffff'} onChange={(hex) => setButton({ textColor: hex })} onEyedropper={() => pickEyedropper((hex) => setButton({ textColor: hex }))} />
        </Row>
        <Row label="Altura">
          <input type="range" min={36} max={64} value={button.height ?? 44} onChange={(e) => setButton({ height: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{button.height ?? 44}px</span>
        </Row>
        <Row label="Raio">
          <input type="range" min={8} max={24} value={button.radius ?? 14} onChange={(e) => setButton({ radius: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{button.radius ?? 14}px</span>
        </Row>
        <Row label="Borda">
          <Toggle active={(button.borderWidth ?? 0) > 0} onClick={() => setButton({ borderWidth: (button.borderWidth ?? 0) > 0 ? 0 : 1 })} />
        </Row>
        {(button.borderWidth ?? 0) > 0 && (
          <>
            <Row label="Espessura">
              <input type="range" min={1} max={4} value={button.borderWidth ?? 1} onChange={(e) => setButton({ borderWidth: Number(e.target.value) })} style={{ flex: 1 }} />
              <span style={rightNum}>{button.borderWidth ?? 1}px</span>
            </Row>
            <Row label="Cor borda">
              <ColorPickerProUnified value={button.borderColor ?? 'rgba(0,0,0,0.15)'} onChange={(hex) => setButton({ borderColor: hex })} onEyedropper={() => pickEyedropper((hex) => setButton({ borderColor: hex }))} />
            </Row>
          </>
        )}
        <Row label="Sombra">
          <Toggle active={button.shadow ?? false} onClick={() => setButton({ shadow: !button.shadow })} />
        </Row>
      </CollapsibleSection>


      {/* ========== POSIÇÃO ========== */}
      <CollapsibleSection title="📍 Posição" subtitle="Offset vertical" isOpen={activeSection === 'position'} onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}>
        <Row label="Offset Y">
          <input type="range" min={-80} max={80} step={4} value={st.offsetY ?? 0} onChange={(e) => setStyle({ offsetY: Number(e.target.value) })} style={{ flex: 1 }} />
          <span style={rightNum}>{st.offsetY ?? 0}px</span>
        </Row>
        <Row label="">
          <Button onClick={() => setStyle({ offsetY: 0 })}>Reset</Button>
        </Row>
      </CollapsibleSection>

    </div>
  )
}

// ===== COMPONENTES AUXILIARES =====

const orderButtonStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.10)',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
}

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
