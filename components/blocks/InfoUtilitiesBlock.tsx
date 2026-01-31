'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from '@/components/theme/ThemeProvider'

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

function isNonEmpty(v?: string) {
  return typeof v === 'string' && v.trim().length > 0
}

function hasCustomIcon(item: InfoItem) {
  return (item.iconMode ?? 'default') === 'image' && typeof item.iconImageSrc === 'string' && item.iconImageSrc.trim().length > 0
}

function renderCustomIcon(item: InfoItem, iconSize: number, iconRadius: number) {
  return (
    <Image
      src={item.iconImageSrc!}
      alt=""
      width={iconSize}
      height={iconSize}
      style={{ borderRadius: iconRadius, objectFit: 'cover', flexShrink: 0 }}
    />
  )
}

export default function InfoUtilitiesBlock({
  settings,
  style,
}: {
  settings: InfoUtilitiesSettings
  style?: InfoUtilitiesStyle
}) {
  useTheme()

  const s = settings || {}
  const st = style || {}

  const wrapStyle: React.CSSProperties = {}

  const heading = s.heading ?? 'Utilidades'
  const layout = s.layout ?? 'grid'
  const items = s.items || []

  if (items.length === 0) return null

  // Separar itens por tipo para layout híbrido
  const addressItem = items.find((i) => i.type === 'address' && i.enabled)
  const reviewsItem = items.find((i) => i.type === 'reviews_embed' && i.enabled)
  const otherItems = items.filter((i) => i.enabled && i.type !== 'address' && i.type !== 'reviews_embed')

  const iconSize = st.iconSizePx ?? 24
  const iconRadius = st.iconRadiusPx ?? 6
  const iconBg = st.iconBgColor ?? 'transparent'
  const iconColor = st.iconColor ?? '#111827'

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: st.rowPaddingPx ?? 8,
    borderRadius: st.rowRadiusPx ?? 10,
    border: `${st.rowBorderWidth ?? 0}px solid ${st.rowBorderColor ?? 'transparent'}`,
    backgroundColor: st.rowBgColor ?? 'transparent',
  }

  const textStyle: React.CSSProperties = {
    color: st.textColor ?? '#111827',
    fontFamily: st.textFontFamily || undefined,
    fontWeight: st.textFontWeight ?? 600,
    fontSize: st.textFontSize ?? 14,
  }

  return (
    <section style={wrapStyle}>
      {isNonEmpty(heading) && (
        <div
          style={{
            fontWeight: st.headingBold === false ? 500 : (st.headingFontWeight ?? 900),
            fontSize: st.headingFontSize ?? 16,
            marginBottom: 12,
            fontFamily: st.headingFontFamily || undefined,
            color: st.headingColor ?? '#111827',
            textAlign: st.headingAlign ?? 'left',
          }}
        >
          {heading}
        </div>
      )}

      {/* Morada full width */}
      {addressItem && (
        <div style={{ ...rowStyle, marginBottom: st.rowGapPx ?? 12 }}>
          {hasCustomIcon(addressItem) ? (
            renderCustomIcon(addressItem, iconSize, iconRadius)
          ) : (
            <svg
              width={iconSize}
              height={iconSize}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ borderRadius: iconRadius, backgroundColor: iconBg, flexShrink: 0 }}
            >
              <path
                d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                fill={iconColor}
              />
              <circle cx="12" cy="9" r="2.5" fill="white" />
            </svg>
          )}

          <div style={textStyle}>
            {addressItem.url ? (
              <a
                href={addressItem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {addressItem.value}
              </a>
            ) : (
              addressItem.value
            )}
          </div>
        </div>
      )}

      {/* Reviews full width */}
      {reviewsItem && (
        <div style={{ ...rowStyle, marginBottom: st.rowGapPx ?? 12, flexDirection: 'column', gap: 8 }}>
          {reviewsItem.embedHtml ? (
            <div
              dangerouslySetInnerHTML={{ __html: reviewsItem.embedHtml }}
              style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}
            />
          ) : null}

          {/* Linha com ícone + link (custom ou default) */}
          {reviewsItem.url ? (
            <a
              href={reviewsItem.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: st.textColor ?? '#111827',
                fontWeight: 800,
                textDecoration: 'underline',
              }}
            >
              {hasCustomIcon(reviewsItem) ? (
                renderCustomIcon(reviewsItem, iconSize, iconRadius)
              ) : (
                <div
                  style={{
                    width: iconSize,
                    height: iconSize,
                    borderRadius: iconRadius,
                    backgroundColor: iconBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: iconColor,
                    fontWeight: 'bold',
                  }}
                >
                  ★
                </div>
              )}
              <span>Ver avaliações no Google</span>
            </a>
          ) : null}
        </div>
      )}

      {/* Outros itens em grelha 2 colunas */}
      {otherItems.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: layout === 'list' ? '1fr' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: st.rowGapPx ?? 12,
          }}
        >
          {otherItems.map((item) => {
            const useCustom = hasCustomIcon(item)

            switch (item.type) {
              case 'wifi':
                return (
                  <div key={item.id} style={{ ...rowStyle, cursor: 'default' }}>
                    {useCustom ? (
                      renderCustomIcon(item, iconSize, iconRadius)
                    ) : (
                      <svg
                        width={iconSize}
                        height={iconSize}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ borderRadius: iconRadius, backgroundColor: iconBg, flexShrink: 0 }}
                      >
                        <path
                          d="M12 18c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zM6.5 15c.83 0 1.5-.67 1.5-1.5S7.33 12 6.5 12 5 12.67 5 13.5 5.67 15 6.5 15zm11 0c.83 0 1.5-.67 1.5-1.5S18.33 12 17.5 12s-1.5.67-1.5 1.5.67 1.5 1.5 1.5z"
                          fill={iconColor}
                        />
                      </svg>
                    )}

                    <div style={{ flex: 1 }}>
                      <div style={{ ...textStyle, fontWeight: 'bold' }}>{item.ssid}</div>
                      <div style={{ ...textStyle, fontWeight: 'normal', fontSize: (st.textFontSize ?? 14) - 2 }}>
                        Senha: {item.password}
                      </div>
                    </div>
                  </div>
                )

              case 'image_button':
                return (
                  <a
                    key={item.id}
                    href={item.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...rowStyle, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    {/* Se tiver icon custom, usa-o. Senão usa imageSrc (comportamento antigo). */}
                    {useCustom ? (
                      renderCustomIcon(item, iconSize, iconRadius)
                    ) : item.imageSrc ? (
                      <Image
                        src={item.imageSrc}
                        alt={item.imageAlt ?? ''}
                        width={iconSize}
                        height={iconSize}
                        style={{ borderRadius: iconRadius, flexShrink: 0 }}
                      />
                    ) : null}

                    <div style={{ ...textStyle, marginLeft: (useCustom || item.imageSrc) ? 8 : 0 }}>{item.label}</div>
                  </a>
                )

              case 'link':
                return (
                  <a
                    key={item.id}
                    href={item.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...rowStyle, textDecoration: 'none', cursor: 'pointer' }}
                  >
                    {useCustom ? (
                      renderCustomIcon(item, iconSize, iconRadius)
                    ) : (
                      <div
                        style={{
                          width: iconSize,
                          height: iconSize,
                          borderRadius: iconRadius,
                          backgroundColor: iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: iconColor,
                          fontWeight: 'bold',
                        }}
                      >
                        🔗
                      </div>
                    )}
                    <div style={{ ...textStyle, marginLeft: 8 }}>{item.label}</div>
                  </a>
                )

              case 'hours_text':
                return (
                  <div key={item.id} style={rowStyle}>
                    {useCustom ? (
                      renderCustomIcon(item, iconSize, iconRadius)
                    ) : (
                      <div
                        style={{
                          width: iconSize,
                          height: iconSize,
                          borderRadius: iconRadius,
                          backgroundColor: iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          color: iconColor,
                          fontWeight: 'bold',
                        }}
                      >
                        🕒
                      </div>
                    )}
                    <div style={{ ...textStyle, marginLeft: 8 }}>{item.value}</div>
                  </div>
                )

              default:
                return null
            }
          })}
        </div>
      )}
    </section>
  )
}