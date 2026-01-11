import React from 'react'
import type { ProfileSettings, ProfileTextLine } from '@/components/blocks/types/profile'
import type { HeaderSettings } from '@/components/blocks/HeaderBlock'
import HeaderBlock from '@/components/blocks/HeaderBlock'

const SIZE_MAP = {
  sm: { name: 22, sub: 14, avatar: 72 },
  md: { name: 28, sub: 16, avatar: 96 },
  lg: { name: 34, sub: 18, avatar: 120 },
} as const

function fontSizeFor(kind: 'name' | 'sub', size?: string): number | undefined {
  if (size !== 'sm' && size !== 'md' && size !== 'lg') return undefined
  return kind === 'name' ? SIZE_MAP[size].name : SIZE_MAP[size].sub
}

const FONT_MAP: Record<string, string> = {
  System: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  Serif: 'serif',
  Monospace: 'monospace',
}

function mapGoogleFont(ff?: string) {
  if (!ff) return undefined

  // Se já vier como variável CSS, usa direto
  if (ff.startsWith('var(--font-')) return ff

  // Compatibilidade com nomes antigos
  switch (ff) {
    case 'Inter':
      return 'var(--font-inter)'
    case 'Poppins':
      return 'var(--font-poppins)'
    case 'Montserrat':
      return 'var(--font-montserrat)'
    case 'Roboto':
      return 'var(--font-roboto)'
    case 'Open Sans':
      return 'var(--font-open-sans)'
    case 'Lato':
      return 'var(--font-lato)'
    case 'Nunito':
      return 'var(--font-nunito)'
    case 'Playfair Display':
      return 'var(--font-playfair)'
    case 'Dancing Script':
      return 'var(--font-dancing)'
    default:
      return undefined
  }
}

function radiusFor(style?: ProfileSettings['background']['style']) {
  if (style === 'pill') return 999
  if (style === 'rounded') return 24
  return 0
}

function avatarRadius(shape?: string) {
  if (shape === 'circle') return '50%'
  if (shape === 'rounded') return 18
  return 0
}

function isHttpUrl(v: any) {
  return typeof v === 'string' && (v.startsWith('http://') || v.startsWith('https://'))
}

function lineFontFamily(line: ProfileTextLine, fallback: string) {
  const ff = mapGoogleFont(line.style?.fontFamily)
  return ff ?? fallback
}

function lineFontWeight(line: ProfileTextLine, fallback: number) {
  return (line.style?.fontWeight ?? fallback) as any
}

export default function ProfileBlock({
  settings,
  headerSettings,
}: {
  settings: ProfileSettings
  headerSettings?: HeaderSettings
}) {
  if (!settings?.enabled) return null

  const showName = settings.name?.enabled && settings.name.text?.trim()
  const showProfession = settings.profession?.enabled && settings.profession.text?.trim()
  const showCompany = settings.company?.enabled && settings.company.text?.trim()

  const align = settings.layout?.align ?? 'center'
  const justify =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

  const avatarUrl = settings.avatar?.image
  const avatarEnabled = settings.avatar?.enabled === true && isHttpUrl(avatarUrl)

  if (!showName && !showProfession && !showCompany && !avatarEnabled) return null

  const lineCount = Number(!!showName) + Number(!!showProfession) + Number(!!showCompany)
  const offsetY = settings.offset?.y ?? 0

  const globalFontFamily = FONT_MAP[settings.typography?.fontFamily ?? 'System'] ?? FONT_MAP.System

  const bgEnabled = settings.background?.enabled
  const bgColor = settings.background?.color
  const bgStyle = settings.background?.style

  const dock = headerSettings?.layout?.avatarDock ?? 'overlap'

  const avatarSizeKey = settings.avatar?.size ?? 'md'
  const avatarSizePx = SIZE_MAP[avatarSizeKey].avatar

  const autoOverlapY = dock === 'overlap' ? -avatarSizePx / 2 : 0
  const avatarOffsetY = settings.avatar?.offsetY != null ? settings.avatar.offsetY : autoOverlapY
  const avatarOffsetX = settings.avatar?.offsetX ?? 0

  const extraTopPadding = avatarEnabled && dock === 'overlap' ? avatarSizePx / 2 + 10 : 0

  const lineGap = settings.layout?.lineGap ?? (lineCount === 1 ? 4 : 10)

  return (
    <section
      aria-label="Perfil"
      style={{
        marginTop: offsetY,
        backgroundColor: bgEnabled ? bgColor : 'transparent',
        borderRadius: radiusFor(bgStyle),
        border: bgEnabled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
        boxShadow: bgEnabled ? '0 6px 20px rgba(0,0,0,0.06)' : 'none',
        overflow: 'visible',
        transition: 'margin-top 200ms ease, background-color 200ms ease',
      }}
    >
      {avatarEnabled && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
            height: 0,
          }}
        >
          <img
            src={avatarUrl as string}
            alt="Avatar"
            style={{
              width: avatarSizePx,
              height: avatarSizePx,
              objectFit: 'cover',
              borderRadius: avatarRadius(settings.avatar?.shape ?? 'circle'),
              border:
                (settings.avatar?.borderWidth ?? 0) > 0
                  ? `${settings.avatar?.borderWidth}px solid ${
                      settings.avatar?.borderColor ?? 'rgba(255,255,255,0.9)'
                    }`
                  : undefined,
              background: '#fff',
              transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
              zIndex: 20,
            }}
          />
        </div>
      )}

      <div
        style={{
          padding: lineCount === 1 ? `18px 22px` : `22px 22px`,
          paddingTop: (lineCount === 1 ? 18 : 22) + extraTopPadding,
          display: 'flex',
          flexDirection: 'column',
          gap: lineGap,
        }}
      >
        {showName && (
          <div
            role="heading"
            aria-level={2}
            style={{
              fontFamily: lineFontFamily(settings.name, globalFontFamily),
              fontWeight: lineFontWeight(settings.name, 700),
              fontSize: fontSizeFor('name', settings.name.size),
              color: settings.name.color,
              letterSpacing: '-0.02em',
              lineHeight: 1.05,
              textAlign: align,
              width: '100%',
            }}
          >
            {settings.name.text}
          </div>
        )}

        {showProfession && (
          <div
            style={{
              width: '100%',
              padding: '6px 0',
              minHeight: 24,
              display: 'flex',
              justifyContent: justify,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: lineFontFamily(settings.profession, globalFontFamily),
                fontWeight: lineFontWeight(settings.profession, 400),
                fontSize: fontSizeFor('sub', settings.profession.size),
                color: settings.profession.color,
                opacity: 0.88,
                lineHeight: 1.35,
                textAlign: align,
                width: '100%',
              }}
            >
              {settings.profession.text}
            </div>
          </div>
        )}

        {showCompany && (
          <div
            style={{
              fontFamily: lineFontFamily(settings.company, globalFontFamily),
              fontWeight: lineFontWeight(settings.company, 400),
              fontSize: fontSizeFor('sub', settings.company.size),
              color: settings.company.color,
              opacity: 0.72,
              letterSpacing: '0.01em',
              lineHeight: 1.35,
              textAlign: align,
              width: '100%',
            }}
          >
            {settings.company.text}
          </div>
        )}
      </div>
    </section>
  )
}
