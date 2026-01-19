'use client'

import React, { useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Image from 'next/image'
import { Section, Row, Toggle, input, select, rightNum } from '@/components/editor/ui'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { useColorPicker } from '@/components/editor/ColorPickerContext'

export type InfoItemType =
  | 'address'
  | 'wifi'
  | 'image_button'
  | 'link'
  | 'hours_text'
  | 'reviews_embed'

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

  // compat (o bloco usa isto)
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

export default function InfoUtilitiesBlockEditor({
  cardId,
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
}: Props) {
  const { openPicker } = useColorPicker()

  const s = settings || {}
  const st = style || {}
  const items = useMemo(() => s.items || [], [s.items])

  // ✅ helper: abre SEMPRE o eyedropper com lupa
  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  const updateSettings = (patch: Partial<InfoUtilitiesSettings>) => {
    onChangeSettings({ ...s, ...patch })
  }

  const updateStyle = (patch: Partial<InfoUtilitiesStyle>) => {
    if (!onChangeStyle) return
    onChangeStyle({ ...st, ...patch })
  }

  const addItem = (type: InfoItemType) => {
    const newItem: InfoItem = {
      id: uid(),
      type,
      enabled: true,
      label: '',
      iconMode: 'default',
      iconImageSrc: '',
    }
    updateSettings({ items: [...items, newItem] })
  }

  const removeItem = (id: string) => {
    updateSettings({ items: items.filter((i) => i.id !== id) })
  }

  const updateItem = (id: string, patch: Partial<InfoItem>) => {
    updateSettings({ items: items.map((i) => (i.id === id ? { ...i, ...patch } : i)) })
  }

  // Upload image (igual ao DecorationBlockEditor)
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

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true,
        contentType: file.type,
        cacheControl: '3600',
      })
      if (upErr) throw upErr

      const { data } = supabase.storage.from(bucket).getPublicUrl(path)
      const publicUrl = data?.publicUrl
      if (!publicUrl) throw new Error('Não foi possível obter o URL público da imagem.')

      const current = items.find((i) => i.id === targetId)

      // Se o item estiver em modo "imagem", grava em iconImageSrc
      if ((current?.iconMode ?? 'default') === 'image') {
        updateItem(targetId, { iconImageSrc: publicUrl })
      } else {
        // mantém compatibilidade com image_button (e outros usos antigos)
        updateItem(targetId, { imageSrc: publicUrl })
      }
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload da imagem.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />

      <Section title="Conteúdo">
        <Row label="Título">
          <input
            value={s.heading ?? 'Utilidades'}
            onChange={(e) => updateSettings({ heading: e.target.value })}
            style={input}
            placeholder="Título do bloco"
          />
        </Row>

        <Row label="Layout">
          <select
            value={s.layout ?? 'grid'}
            onChange={(e) => updateSettings({ layout: e.target.value as 'grid' | 'list' })}
            style={select}
          >
            <option value="grid">Grelha</option>
            <option value="list">Lista</option>
          </select>
        </Row>

        <Row label="Adicionar item">
          <select
            onChange={(e) => {
              if (e.target.value) {
                addItem(e.target.value as InfoItemType)
                e.target.value = ''
              }
            }}
            style={select}
            defaultValue=""
          >
            <option value="" disabled>
              Seleciona tipo...
            </option>
            <option value="address">Morada</option>
            <option value="wifi">WiFi</option>
            <option value="image_button">Botão com imagem</option>
            <option value="link">Link simples</option>
            <option value="hours_text">Texto horário</option>
            <option value="reviews_embed">Avaliações Google</option>
          </select>
        </Row>

        {items.length === 0 && <div style={{ opacity: 0.7 }}>Nenhum item adicionado.</div>}

        {items.map((item, idx) => {
          const enabled = item.enabled !== false
          const iconMode = item.iconMode ?? 'default'
          const hasIconImage = typeof item.iconImageSrc === 'string' && item.iconImageSrc.trim().length > 0

          return (
            <div
              key={item.id}
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
                <strong style={{ fontSize: 14 }}>
                  {String(item?.type || 'item').replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())} #{idx + 1}
                </strong>
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

              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateItem(item.id, { enabled: e.target.checked })}
                />
                <span>Ativo</span>
              </label>

              {/* Ícone custom (para TODOS os tipos) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.75 }}>Ícone</span>

                <select
                  value={iconMode}
                  onChange={(e) => updateItem(item.id, { iconMode: e.target.value as any })}
                  style={select}
                >
                  <option value="default">Padrão</option>
                  <option value="image">Imagem (upload)</option>
                </select>

                {iconMode === 'image' && (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => pickFileFor(item.id)}
                      style={{
                        height: 36,
                        padding: '0 12px',
                        borderRadius: 10,
                        border: '1px solid rgba(0,0,0,0.12)',
                        background: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      Upload ícone
                    </button>

                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                      {hasIconImage ? '✅ imagem definida' : '⚠️ sem imagem'}
                    </div>

                    {hasIconImage ? (
                      <button
                        type="button"
                        onClick={() => updateItem(item.id, { iconImageSrc: '' })}
                        style={{
                          height: 36,
                          padding: '0 12px',
                          borderRadius: 10,
                          border: '1px solid rgba(229, 62, 62, 0.25)',
                          background: 'rgba(229, 62, 62, 0.08)',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: 12,
                          color: '#e53e3e',
                        }}
                      >
                        Limpar
                      </button>
                    ) : null}
                  </div>
                )}

                {iconMode === 'image' && hasIconImage ? (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <img
                      src={item.iconImageSrc}
                      alt=""
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        objectFit: 'cover',
                        border: '1px solid rgba(0,0,0,0.08)',
                      }}
                    />
                    <div style={{ fontSize: 12, opacity: 0.7, wordBreak: 'break-all' }}>{item.iconImageSrc}</div>
                  </div>
                ) : null}
              </div>

              {/* Campos específicos por tipo */}
              {item.type === 'address' && (
                <>
                  <label>
                    <span>Texto da morada</span>
                    <input
                      type="text"
                      value={item.value ?? ''}
                      onChange={(e) => updateItem(item.id, { value: e.target.value })}
                      style={input}
                      placeholder="Ex: Rua ABC, 123, Lisboa"
                    />
                  </label>
                  <label>
                    <span>Link Google Maps (opcional)</span>
                    <input
                      type="url"
                      value={item.url ?? ''}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      style={input}
                      placeholder="https://maps.google.com/..."
                    />
                  </label>
                </>
              )}

              {item.type === 'wifi' && (
                <>
                  <label>
                    <span>SSID (nome da rede)</span>
                    <input
                      type="text"
                      value={item.ssid ?? ''}
                      onChange={(e) => updateItem(item.id, { ssid: e.target.value })}
                      style={input}
                      placeholder="Ex: MinhaRedeWifi"
                    />
                  </label>
                  <label>
                    <span>Senha</span>
                    <input
                      type="text"
                      value={item.password ?? ''}
                      onChange={(e) => updateItem(item.id, { password: e.target.value })}
                      style={input}
                      placeholder="Senha WiFi"
                    />
                  </label>
                </>
              )}

              {item.type === 'image_button' && (
                <>
                  <button type="button" onClick={() => pickFileFor(item.id)} style={{ marginBottom: 8 }}>
                    Upload de imagem
                  </button>
                  {item.imageSrc && (
                    <Image
                      src={item.imageSrc}
                      alt={item.imageAlt ?? ''}
                      width={60}
                      height={60}
                      style={{ borderRadius: 8 }}
                    />
                  )}
                  <label>
                    <span>Texto do botão</span>
                    <input
                      type="text"
                      value={item.label ?? ''}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      style={input}
                      placeholder="Ex: Visitar site"
                    />
                  </label>
                  <label>
                    <span>URL do botão</span>
                    <input
                      type="url"
                      value={item.url ?? ''}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      style={input}
                      placeholder="https://..."
                    />
                  </label>
                </>
              )}

              {item.type === 'link' && (
                <>
                  <label>
                    <span>Texto do link</span>
                    <input
                      type="text"
                      value={item.label ?? ''}
                      onChange={(e) => updateItem(item.id, { label: e.target.value })}
                      style={input}
                      placeholder="Ex: Site oficial"
                    />
                  </label>
                  <label>
                    <span>URL do link</span>
                    <input
                      type="url"
                      value={item.url ?? ''}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      style={input}
                      placeholder="https://..."
                    />
                  </label>
                </>
              )}

              {item.type === 'hours_text' && (
                <label>
                  <span>Texto do horário</span>
                  <textarea
                    value={item.value ?? ''}
                    onChange={(e) => updateItem(item.id, { value: e.target.value })}
                    style={{ ...input, height: 60, resize: 'vertical' }}
                    placeholder="Ex: Segunda a Sexta, 09h às 18h"
                  />
                </label>
              )}

              {item.type === 'reviews_embed' && (
                <>
                  <label>
                    <span>Embed HTML (iframe do Google Reviews)</span>
                    <textarea
                      value={item.embedHtml ?? ''}
                      onChange={(e) => updateItem(item.id, { embedHtml: e.target.value })}
                      style={{ ...input, height: 80, resize: 'vertical' }}
                      placeholder="Cole o iframe aqui"
                    />
                  </label>
                  <label>
                    <span>Link para avaliações no Google</span>
                    <input
                      type="url"
                      value={item.url ?? ''}
                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                      style={input}
                      placeholder="https://..."
                    />
                  </label>
                </>
              )}
            </div>
          )
        })}
      </Section>

      <Section title="Título">
        <Row label="Cor do título">
          <SwatchRow
            value={st.headingColor ?? '#111827'}
            onChange={(hex) => updateStyle({ headingColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ headingColor: hex }))}
          />
        </Row>

        <Row label="Tamanho do título (px)">
          <input
            type="number"
            min={10}
            max={40}
            value={st.headingFontSize ?? 16}
            onChange={(e) => updateStyle({ headingFontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Alinhamento do título">
          <select
            value={st.headingAlign ?? 'left'}
            onChange={(e) => updateStyle({ headingAlign: e.target.value as 'left' | 'center' | 'right' })}
            style={select}
          >
            <option value="left">Esquerda</option>
            <option value="center">Centro</option>
            <option value="right">Direita</option>
          </select>
        </Row>

        <Row label="Fonte do título">
          <select
            value={st.headingFontFamily ?? ''}
            onChange={(e) => updateStyle({ headingFontFamily: e.target.value || undefined })}
            style={select}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Negrito">
          <Toggle
            active={st.headingBold !== false}
            onClick={() => updateStyle({ headingBold: !(st.headingBold !== false) })}
          />
        </Row>

        <Row label="Peso do título">
          <select
            value={String(st.headingFontWeight ?? 900)}
            onChange={(e) => updateStyle({ headingFontWeight: Number(e.target.value) })}
            style={select}
          >
            <option value="500">Medium (500)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>
      </Section>

      <Section title="Tipografia (texto)">
        <Row label="Cor do texto">
          <SwatchRow
            value={st.textColor ?? '#111827'}
            onChange={(hex) => updateStyle({ textColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ textColor: hex }))}
          />
        </Row>

        <Row label="Tamanho do texto (px)">
          <input
            type="number"
            min={10}
            max={22}
            value={st.textFontSize ?? 14}
            onChange={(e) => updateStyle({ textFontSize: Number(e.target.value) })}
            style={input}
          />
        </Row>

        <Row label="Fonte do texto">
          <select
            value={st.textFontFamily ?? ''}
            onChange={(e) => updateStyle({ textFontFamily: e.target.value || undefined })}
            style={select}
          >
            <option value="">Padrão</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Row>

        <Row label="Peso do texto">
          <select
            value={String(st.textFontWeight ?? 600)}
            onChange={(e) => updateStyle({ textFontWeight: Number(e.target.value) })}
            style={select}
          >
            <option value="400">Normal (400)</option>
            <option value="600">Semi (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra (800)</option>
            <option value="900">Black (900)</option>
          </select>
        </Row>
      </Section>

      <Section title="Linhas e ícones">
        <Row label="Espaçamento entre linhas (px)">
          <input
            type="range"
            min={4}
            max={18}
            step={1}
            value={st.rowGapPx ?? 12}
            onChange={(e) => updateStyle({ rowGapPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.rowGapPx ?? 12}px</span>
        </Row>

        <Row label="Padding das linhas (px)">
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={st.rowPaddingPx ?? 8}
            onChange={(e) => updateStyle({ rowPaddingPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.rowPaddingPx ?? 8}px</span>
        </Row>

        <Row label="Borda das linhas (px)">
          <input
            type="range"
            min={0}
            max={4}
            step={1}
            value={st.rowBorderWidth ?? 0}
            onChange={(e) => updateStyle({ rowBorderWidth: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.rowBorderWidth ?? 0}px</span>
        </Row>

        <Row label="Cor da borda das linhas">
          <SwatchRow
            value={st.rowBorderColor ?? '#e5e7eb'}
            onChange={(hex) => updateStyle({ rowBorderColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ rowBorderColor: hex }))}
          />
        </Row>

        <Row label="Raio das linhas (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.rowRadiusPx ?? 10}
            onChange={(e) => updateStyle({ rowRadiusPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.rowRadiusPx ?? 10}px</span>
        </Row>

        <Row label="Tamanho do ícone (px)">
          <input
            type="range"
            min={12}
            max={48}
            step={1}
            value={st.iconSizePx ?? 24}
            onChange={(e) => updateStyle({ iconSizePx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.iconSizePx ?? 24}px</span>
        </Row>

        <Row label="Cor do ícone">
          <SwatchRow
            value={st.iconColor ?? '#111827'}
            onChange={(hex) => updateStyle({ iconColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ iconColor: hex }))}
          />
        </Row>

        <Row label="Fundo do ícone">
          <SwatchRow
            value={st.iconBgColor ?? 'transparent'}
            onChange={(hex) => updateStyle({ iconBgColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ iconBgColor: hex }))}
          />
        </Row>

        <Row label="Raio do ícone (px)">
          <input
            type="range"
            min={0}
            max={24}
            step={1}
            value={st.iconRadiusPx ?? 6}
            onChange={(e) => updateStyle({ iconRadiusPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.iconRadiusPx ?? 6}px</span>
        </Row>
      </Section>

      <Section title="Botões (se aplicável)">
        <Row label="Cor do texto do botão">
          <SwatchRow
            value={st.buttonTextColor ?? '#111827'}
            onChange={(hex) => updateStyle({ buttonTextColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonTextColor: hex }))}
          />
        </Row>

        <Row label="Fundo do botão">
          <SwatchRow
            value={st.buttonBgColor ?? '#f0f0f0'}
            onChange={(hex) => updateStyle({ buttonBgColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonBgColor: hex }))}
          />
        </Row>

        <Row label="Borda do botão (px)">
          <input
            type="range"
            min={0}
            max={6}
            step={1}
            value={st.buttonBorderWidth ?? 0}
            onChange={(e) => updateStyle({ buttonBorderWidth: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.buttonBorderWidth ?? 0}px</span>
        </Row>

        <Row label="Cor da borda do botão">
          <SwatchRow
            value={st.buttonBorderColor ?? '#e5e7eb'}
            onChange={(hex) => updateStyle({ buttonBorderColor: hex })}
            onEyedropper={() => pickEyedropper((hex) => updateStyle({ buttonBorderColor: hex }))}
          />
        </Row>

        <Row label="Raio do botão (px)">
          <input
            type="range"
            min={0}
            max={32}
            step={1}
            value={st.buttonRadiusPx ?? 10}
            onChange={(e) => updateStyle({ buttonRadiusPx: Number(e.target.value) })}
          />
          <span style={rightNum}>{st.buttonRadiusPx ?? 10}px</span>
        </Row>
      </Section>
    </div>
  )
}
