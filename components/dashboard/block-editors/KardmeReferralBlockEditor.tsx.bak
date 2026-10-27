'use client'

import React, { useState } from 'react'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import ColorPickerProUnified from '@/components/editor/ColorPickerProUnified'

type ReferralSettings = {
  title?: string
  description?: string
  buttonLabel?: string
}

type ReferralStyle = {
  align?: 'left' | 'center' | 'right'
  spacing?: {
    top?: number
    titleDescription?: number
    descriptionButton?: number
    bottom?: number
  }
  button?: {
    bgColor?: string
    textColor?: string
    height?: number
    radius?: number
    width?: 'auto' | 'full'
    fontSize?: number
    fontWeight?: number
  }
}

type Props = {
  settings: ReferralSettings
  style?: ReferralStyle
  onChangeSettings: (s: ReferralSettings) => void
  onChangeStyle: (s: ReferralStyle) => void
}

export default function KardmeReferralBlockEditor({
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
}: Props) {
  const { openPicker } = useColorPicker()

  const s = settings || {}
  const st = style || {}
  const button = st.button || {}
  const spacing = st.spacing || {}

  const [activeSection, setActiveSection] =
    useState<string | null>('content')

  const setSettings = (patch: Partial<ReferralSettings>) =>
    onChangeSettings({ ...s, ...patch })

  const setStyle = (patch: Partial<ReferralStyle>) =>
    onChangeStyle({ ...st, ...patch })

  const setButton = (
    patch: Partial<NonNullable<ReferralStyle['button']>>
  ) =>
    setStyle({
      button: {
        ...button,
        ...patch,
      },
    })

  const setSpacing = (
    patch: Partial<NonNullable<ReferralStyle['spacing']>>
  ) =>
    setStyle({
      spacing: {
        ...spacing,
        ...patch,
      },
    })

  const pickEyedropper = (apply: (hex: string) => void) =>
    openPicker({
      mode: 'eyedropper',
      onPick: apply,
    })

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <CollapsibleSection
        title="Conteúdo"
        subtitle="Texto apresentado no cartão"
        isOpen={activeSection === 'content'}
        onToggle={() =>
          setActiveSection(
            activeSection === 'content' ? null : 'content'
          )
        }
      >
        <Field label="Título">
          <input
            value={s.title ?? 'Gostou deste cartão?'}
            onChange={(e) =>
              setSettings({ title: e.target.value })
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Descrição">
          <textarea
            value={
              s.description ??
              'Também pode ter o seu Kardme.'
            }
            onChange={(e) =>
              setSettings({ description: e.target.value })
            }
            rows={3}
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: 72,
            }}
          />
        </Field>

        <Field label="Botão">
          <input
            value={s.buttonLabel ?? 'Quero saber mais'}
            onChange={(e) =>
              setSettings({ buttonLabel: e.target.value })
            }
            style={inputStyle}
          />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection
        title="Botão"
        subtitle="Cor, tamanho e aparência"
        isOpen={activeSection === 'button'}
        onToggle={() =>
          setActiveSection(
            activeSection === 'button' ? null : 'button'
          )
        }
      >
        <Row label="Cor">
          <ColorPickerProUnified
            value={button.bgColor ?? '#2563eb'}
            onChange={(hex) =>
              setButton({ bgColor: hex })
            }
            onEyedropper={() =>
              pickEyedropper((hex) =>
                setButton({ bgColor: hex })
              )
            }
          />
        </Row>

        <Row label="Texto">
          <ColorPickerProUnified
            value={button.textColor ?? '#ffffff'}
            onChange={(hex) =>
              setButton({ textColor: hex })
            }
            onEyedropper={() =>
              pickEyedropper((hex) =>
                setButton({ textColor: hex })
              )
            }
          />
        </Row>

        <Row label="Altura">
          <input
            type="range"
            min={34}
            max={70}
            value={button.height ?? 46}
            onChange={(e) =>
              setButton({
                height: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {button.height ?? 46}px
          </span>
        </Row>

        <Row label="Largura">
          <div style={{ display: 'flex', gap: 6 }}>
            <MiniButton
              active={(button.width ?? 'auto') === 'auto'}
              onClick={() =>
                setButton({ width: 'auto' })
              }
            >
              Auto
            </MiniButton>

            <MiniButton
              active={button.width === 'full'}
              onClick={() =>
                setButton({ width: 'full' })
              }
            >
              Total
            </MiniButton>
          </div>
        </Row>

        <Row label="Raio">
          <input
            type="range"
            min={0}
            max={40}
            value={button.radius ?? 14}
            onChange={(e) =>
              setButton({
                radius: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {button.radius ?? 14}px
          </span>
        </Row>

        <Row label="Letra">
          <input
            type="range"
            min={10}
            max={24}
            value={button.fontSize ?? 14}
            onChange={(e) =>
              setButton({
                fontSize: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {button.fontSize ?? 14}px
          </span>
        </Row>

        <Row label="Negrito">
          <input
            type="range"
            min={400}
            max={900}
            step={100}
            value={button.fontWeight ?? 800}
            onChange={(e) =>
              setButton({
                fontWeight: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {button.fontWeight ?? 800}
          </span>
        </Row>
      </CollapsibleSection>

      <CollapsibleSection
        title="Espaçamento"
        subtitle="Distância entre os elementos"
        isOpen={activeSection === 'spacing'}
        onToggle={() =>
          setActiveSection(
            activeSection === 'spacing' ? null : 'spacing'
          )
        }
      >
        <Row label="Acima">
          <input
            type="range"
            min={0}
            max={60}
            value={spacing.top ?? 0}
            onChange={(e) =>
              setSpacing({ top: Number(e.target.value) })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{spacing.top ?? 0}px</span>
        </Row>

        <Row label="Título → texto">
          <input
            type="range"
            min={0}
            max={40}
            value={spacing.titleDescription ?? 8}
            onChange={(e) =>
              setSpacing({
                titleDescription: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {spacing.titleDescription ?? 8}px
          </span>
        </Row>

        <Row label="Texto → botão">
          <input
            type="range"
            min={0}
            max={40}
            value={spacing.descriptionButton ?? 8}
            onChange={(e) =>
              setSpacing({
                descriptionButton: Number(e.target.value),
              })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>
            {spacing.descriptionButton ?? 8}px
          </span>
        </Row>

        <Row label="Abaixo">
          <input
            type="range"
            min={0}
            max={60}
            value={spacing.bottom ?? 0}
            onChange={(e) =>
              setSpacing({ bottom: Number(e.target.value) })
            }
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{spacing.bottom ?? 0}px</span>
        </Row>
      </CollapsibleSection>

      <CollapsibleSection
        title="Alinhamento"
        subtitle="Posição do conteúdo"
        isOpen={activeSection === 'align'}
        onToggle={() =>
          setActiveSection(
            activeSection === 'align' ? null : 'align'
          )
        }
      >
        <Row label="Posição">
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map(
              (align) => (
                <MiniButton
                  key={align}
                  active={(st.align ?? 'center') === align}
                  onClick={() =>
                    setStyle({ align })
                  }
                >
                  {align === 'left'
                    ? 'E'
                    : align === 'center'
                    ? 'C'
                    : 'D'}
                </MiniButton>
              )
            )}
          </div>
        </Row>
      </CollapsibleSection>

      <div
        style={{
          padding: 12,
          borderRadius: 12,
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.12)',
          fontSize: 11,
          lineHeight: 1.5,
          color: '#4b5563',
        }}
      >
        O formulário e o tracking são geridos automaticamente
        pelo Kardme. Cada lead fica associada ao cartão onde
        foi gerada.
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontSize: 13,
  boxSizing: 'border-box',
}

const rightNum: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  minWidth: 45,
  textAlign: 'right',
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.8,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  )
}

function Row({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          opacity: 0.8,
          minWidth: 70,
        }}
      >
        {label}
      </span>

      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        {children}
      </div>
    </div>
  )
}

function MiniButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        border: active
          ? '2px solid #3b82f6'
          : '1px solid rgba(0,0,0,0.10)',
        background: active
          ? 'rgba(59,130,246,0.1)'
          : '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 11,
        color: active ? '#3b82f6' : '#333',
      }}
    >
      {children}
    </button>
  )
}

function CollapsibleSection({
  title,
  subtitle,
  isOpen,
  onToggle,
  children,
}: {
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
        type="button"
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
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 11,
                opacity: 0.6,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          )}
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
            transform: isOpen
              ? 'rotate(180deg)'
              : 'rotate(0deg)',
          }}
        >
          V
        </div>
      </button>

      {isOpen && (
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
