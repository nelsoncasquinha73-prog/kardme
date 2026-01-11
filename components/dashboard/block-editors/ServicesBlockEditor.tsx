'use client'

import React, { useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
import SwatchRow from '@/components/editor/SwatchRow'

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
  items?: ServiceItem[]
}

export type ServicesStyle = {
  offsetY?: number
  container?: {
    bgColor?: string // 'transparent' = OFF
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
  headingColor?: string
  headingFontWeight?: number
  headingFontSize?: number
  headingAlign?: 'left' | 'center' | 'right'
  textColor?: string
  textFontWeight?: number
  textFontSize?: number

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
}

type Props = {
  cardId?: string
  settings: ServicesSettings
  style?: ServicesStyle
  onChangeSettings: (s: ServicesSettings) => void
  onChangeStyle?: (s: ServicesStyle) => void
}

function uid(prefix = 'service') {
  return `\${prefix}-\${Date.now().toString(36)}-\${Math.random().toString(36).slice(2, 9)}`
}

const safe = (v: string) => v.replace(/[^a-zA-Z0-9/_-]/g, '-')

export default function ServicesBlockEditor({
  cardId,
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
}: Props) {
  const s = settings || {}
  const st = style || {}
  const items = useMemo(() => s.items || [], [s.items])

  const updateSettings = (patch: Partial<ServicesSettings>) => {
    onChangeSettings({ ...s, ...patch })
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

  const removeItem = (id: string) => {
    updateSettings({ items: items.filter((i) => i.id !== id) })
  }

  const updateItem = (id: string, patch: Partial<ServiceItem>) => {
    updateSettings({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  }

  // Upload image
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

      const safeCardId = safe(cardId || 'no-card')
      const safeTargetId = safe(targetId)
      const path = `\${safeCardId}/\${safeTargetId}.\${ext}`

      console.log('[UPLOAD]', { bucket, path, safeCardId, safeTargetId, ext, fileName: file.name })

      if (!/^[a-zA-Z0-9/_\-.]+$/.test(path)) {
        console.error('[UPLOAD] invalid key computed:', path)
        alert(`Invalid key computed: \${path}`)
        return
      }

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl

      if (!publicUrl) {
        throw new Error('Não foi possível obter o URL público da imagem.')
      }

      updateItem(targetId, { imageSrc: publicUrl })
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload da imagem.')
    }
  }

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
          />
        </Row>

        <Row label="Layout">
          <select
            value={s.layout ?? 'grid'}
            onChange={(e) => updateSettings({ layout: e.target.value as any })}
            style={select}
          >
            <option value="grid">Grelha</option>
            <option value="list">Lista</option>
          </select>
        </Row>

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
              >
                ×
              </button>
            </div>

            <label>
              <input
                type="checkbox"
                checked={item.enabled !== false}
                onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
              />{' '}
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
              />
            </label>

            <label>
              <span>Descrição curta</span>
              <textarea
                value={item.description ?? ''}
                onChange={(e) => updateItem(item.id, { description: e.target.value })}
                style={{ ...input, height: 60, resize: 'vertical' }}
                placeholder="Descrição breve do serviço ou produto"
              />
            </label>

            <label>
              <span>Imagem (upload)</span>
              <button
                type="button"
                onClick={() => pickFileFor(item.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  border: '1px solid rgba(0,0,0,0.12)',
                  backgroundColor: '#f0f0f0',
                  cursor: 'pointer',
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Upload de imagem
              </button>
              {item.imageSrc && (
                <Image src={item.imageSrc} alt={item.imageAlt ?? ''} width={120} height={80} style={{ borderRadius: 8 }} />
              )}
            </label>

            <label>
              <span>Tipo de ação ao clicar</span>
              <select
                value={item.actionType}
                onChange={(e) => updateItem(item.id, { actionType: e.target.value as any })}
                style={select}
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
                  />
                </label>
                <label>
                  <span>Detalhes (texto no popup)</span>
                  <textarea
                    value={item.details ?? ''}
                    onChange={(e) => updateItem(item.id, { details: e.target.value })}
                    style={{ ...input, height: 80, resize: 'vertical' }}
                    placeholder="Texto detalhado para o popup"
                  />
                </label>
                <label>
                  <span>Características / bullets (separados por linha)</span>
                  <textarea
                    value={item.features?.join('\n') ?? ''}
                    onChange={(e) =>
                      updateItem(item.id, {
                        features: e.target.value
                          .split('\n')
                          .map((l) => l.trim())
                          .filter(Boolean),
                      })
                    }
                    style={{ ...input, height: 80, resize: 'vertical' }}
                    placeholder="Ex: 3 quartos\n2 casas de banho\nPiscina"
                  />
                </label>
              </>
            )}
          </div>
        ))}
      </Section>

      <Section title="Estilos">
        {/* Container (bloco) */}
        <Row label="Fundo do bloco">
          <Toggle
            active={(st.container?.bgColor ?? '#ffffff') !== 'transparent'}
            onClick={() => {
              const cur = st.container?.bgColor ?? '#ffffff'
              const next = cur === 'transparent' ? '#ffffff' : 'transparent'
              onChangeStyle &&
                onChangeStyle({
                  ...st,
                  container: { ...(st.container ?? {}), bgColor: next },
                })
            }}
          />
        </Row>

        {(st.container?.bgColor ?? '#ffffff') !== 'transparent' && (
          <Row label="Cor do fundo do bloco">
            <SwatchRow
              value={st.container?.bgColor ?? '#ffffff'}
              onChange={(hex) =>
                onChangeStyle &&
                onChangeStyle({
                  ...st,
                  container: { ...(st.container ?? {}), bgColor: hex },
                })
              }
              onEyedropper={() => {}}
            />
          </Row>
        )}

        <Row label="Sombra do bloco">
          <Toggle
            active={st.container?.shadow === true}
            onClick={() =>
              onChangeStyle &&
              onChangeStyle({
                ...st,
                container: { ...(st.container ?? {}), shadow: !(st.container?.shadow === true) },
              })
            }
          />
        </Row>

        <Row label="Raio do bloco (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.container?.radius ?? 12}
            onChange={(e) =>
              onChangeStyle &&
              onChangeStyle({
                ...st,
                container: { ...(st.container ?? {}), radius: Number(e.target.value) },
              })
            }
          />
          <span style={rightNum}>{st.container?.radius ?? 12}px</span>
        </Row>

        <Row label="Padding do bloco (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.container?.padding ?? 16}
            onChange={(e) =>
              onChangeStyle &&
              onChangeStyle({
                ...st,
                container: { ...(st.container ?? {}), padding: Number(e.target.value) },
              })
            }
          />
          <span style={rightNum}>{st.container?.padding ?? 16}px</span>
        </Row>

        <Row label="Borda do bloco (px)">
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={st.container?.borderWidth ?? 0}
            onChange={(e) =>
              onChangeStyle &&
              onChangeStyle({
                ...st,
                container: { ...(st.container ?? {}), borderWidth: Number(e.target.value) },
              })
            }
          />
          <span style={rightNum}>{st.container?.borderWidth ?? 0}px</span>
        </Row>

        {(st.container?.borderWidth ?? 0) > 0 && (
          <Row label="Cor da borda do bloco">
            <SwatchRow
              value={st.container?.borderColor ?? '#e5e7eb'}
              onChange={(hex) =>
                onChangeStyle &&
                onChangeStyle({
                  ...st,
                  container: { ...(st.container ?? {}), borderColor: hex },
                })
              }
              onEyedropper={() => {}}
            />
          </Row>
        )}

        {/* Cartões */}
        <Row label="Fundo dos cartões">
          <Toggle
            active={(st.cardBgColor ?? '#ffffff') !== 'transparent'}
            onClick={() => {
              const cur = st.cardBgColor ?? '#ffffff'
              const next = cur === 'transparent' ? '#ffffff' : 'transparent'
              onChangeStyle && onChangeStyle({ ...st, cardBgColor: next })
            }}
          />
        </Row>

        {(st.cardBgColor ?? '#ffffff') !== 'transparent' && (
          <Row label="Cor do fundo dos cartões">
            <SwatchRow
              value={st.cardBgColor ?? '#ffffff'}
              onChange={(hex) => onChangeStyle && onChangeStyle({ ...st, cardBgColor: hex })}
              onEyedropper={() => {}}
            />
          </Row>
        )}

        <Row label="Sombra dos cartões">
          <Toggle
            active={st.cardShadow ?? true}
            onClick={() => onChangeStyle && onChangeStyle({ ...st, cardShadow: !(st.cardShadow ?? true) })}
          />
        </Row>

        <Row label="Raio dos cartões (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.cardRadiusPx ?? 12}
            onChange={(e) => onChangeStyle && onChangeStyle({ ...st, cardRadiusPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.cardRadiusPx ?? 12}px</span>
        </Row>
        <Row label="Cor da borda dos cartões">
          <SwatchRow
            value={st.cardBorderColor ?? '#e5e7eb'}
            onChange={(hex) => onChangeStyle && onChangeStyle({ ...st, cardBorderColor: hex })}
            onEyedropper={() => {}}
          />
        </Row>

        <Row label="Largura da borda dos cartões (px)">
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={st.cardBorderWidth ?? 1}
            onChange={(e) => onChangeStyle && onChangeStyle({ ...st, cardBorderWidth: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.cardBorderWidth ?? 1}px</span>
        </Row>

        <Row label="Raio das imagens (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.imageRadiusPx ?? 8}
            onChange={(e) => onChangeStyle && onChangeStyle({ ...st, imageRadiusPx: Number(e.target.value) })}
            style={input}
          />
          <span style={rightNum}>{st.imageRadiusPx ?? 8}px</span>
        </Row>

        <Row label="Proporção da imagem (largura/altura)">
          <input
            type="number"
            min={0.5}
            max={3}
            step={0.1}
            value={st.imageAspectRatio ?? 1.5}
            onChange={(e) => onChangeStyle && onChangeStyle({ ...st, imageAspectRatio: Number(e.target.value) })}
            style={input}
          />
        </Row>
      </Section>
    </div>
  )
}
