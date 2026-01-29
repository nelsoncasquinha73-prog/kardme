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

  if (ff.startsWith('var(--font-')) return ff

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

function radiusFor(bgStyle?: string) {
  if (bgStyle === 'pill') return 999
  if (bgStyle === 'rounded') return 24
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

  const alignRaw = (settings as any)?.layout?.align
  const align: 'left' | 'center' | 'right' =
    alignRaw === 'left' || alignRaw === 'right' || alignRaw === 'center' ? alignRaw : 'center'

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center'

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

  const avatarSizePxRaw =
    typeof (settings.avatar as any)?.sizePx === 'number'
      ? (settings.avatar as any).sizePx
      : undefined

  const avatarSizePx = avatarSizePxRaw
    ? Math.max(72, Math.min(180, avatarSizePxRaw))
    : SIZE_MAP[settings.avatar?.size ?? 'md']?.avatar ?? 108

  const glowEnabled = (settings.avatar?.glow as any)?.enabled ?? false
  const glowColor = (settings.avatar?.glow as any)?.color ?? 'rgba(59,130,246,0.18)'
  const glowSize = (settings.avatar?.glow as any)?.size ?? 6

  const shadowEnabled = (settings.avatar?.shadow as any)?.enabled ?? false
  const shadowIntensity = (settings.avatar?.shadow as any)?.intensity ?? 0.18

  const shadowCss = shadowEnabled && shadowIntensity > 0
    ? `0 ${Math.round(10 * shadowIntensity / 0.18)}px ${Math.round(26 * shadowIntensity / 0.18)}px rgba(0,0,0,${(0.16 * shadowIntensity / 0.18).toFixed(2)}), 0 ${Math.round(4 * shadowIntensity / 0.18)}px ${Math.round(10 * shadowIntensity / 0.18)}px rgba(0,0,0,${(0.12 * shadowIntensity / 0.18).toFixed(2)})`
    : 'none'

  const effect3dEnabled = (settings.avatar?.effect3d as any)?.enabled ?? false
  const effect3dBgColor = (settings.avatar?.effect3d as any)?.bgColor ?? "#ffffff"
  const effect3dScale = (settings.avatar?.effect3d as any)?.scale ?? 1.15

  const autoOverlapY = dock === 'overlap' ? -avatarSizePx / 2 : 0
  const avatarOffsetY = settings.avatar?.offsetY != null ? settings.avatar.offsetY : autoOverlapY
  const avatarOffsetX = settings.avatar?.offsetX ?? 0

  const extraTopPadding = avatarEnabled && dock === 'overlap' ? avatarSizePx / 2 + 10 : 0

  const lineGap = (settings as any)?.layout?.lineGap ?? (lineCount === 1 ? 4 : 10)

  // Quanto a foto excede pelo topo (em pixels) quando escalada
  const photoExcessTop = Math.round(avatarSizePx * (effect3dScale - 1))

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
            justifyContent: justify,
            position: 'relative',
            height: 0,
          }}
        >
          {effect3dEnabled ? (
            /* Efeito 3D: moldura + foto que sai só pelo topo */
            <div
              style={{
                position: 'relative',
                width: avatarSizePx,
                height: avatarSizePx,
                transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                zIndex: 20,
              }}
            >
              {/* Moldura de fundo com glow/shadow */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: avatarRadius(settings.avatar?.shape ?? 'circle'),
                  background: effect3dBgColor,
                  border:
                    (settings.avatar?.borderWidth ?? 0) > 0
                      ? `${settings.avatar?.borderWidth}px solid ${settings.avatar?.borderColor ?? 'rgba(255,255,255,0.9)'}`
                      : undefined,
                  boxShadow: [
                    glowEnabled ? `0 0 0 ${glowSize}px ${glowColor}` : '',
                    shadowCss,
                  ].filter(Boolean).join(", ") || "none",
                  zIndex: 1,
                }}
              />
              {/* Foto dentro da moldura (clipped aos limites circulares) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: avatarRadius(settings.avatar?.shape ?? 'circle'),
                  overflow: 'hidden',
                  zIndex: 2,
                }}
              >
                <img
                  src={avatarUrl as string}
                  alt="Avatar"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: '50%',
                    transform: `translateX(-50%) scale(${effect3dScale})`,
                    transformOrigin: 'bottom center',
                    width: avatarSizePx,
                    height: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'bottom',
                    pointerEvents: 'none',
                  }}
                />
              </div>
              {/* Foto que sai pelo topo (só a parte acima da moldura) */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: -(photoExcessTop + 20),
                  height: photoExcessTop + 20,
                  overflow: 'hidden',
                  zIndex: 3,
                }}
              >
                <img
                  src={avatarUrl as string}
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: `translateX(-50%) scale(${effect3dScale})`,
                    transformOrigin: 'top center',
                    width: avatarSizePx,
                    height: 'auto',
                    objectFit: 'contain',
                    objectPosition: 'top',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          ) : (
            /* Avatar normal */
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
                    ? `${settings.avatar?.borderWidth}px solid ${settings.avatar?.borderColor ?? 'rgba(255,255,255,0.9)'}`
                    : undefined,
                background: '#fff',
                transform: `translate(${avatarOffsetX}px, ${avatarOffsetY}px)`,
                boxShadow: [
                  glowEnabled ? `0 0 0 ${glowSize}px ${glowColor}` : '',
                  shadowCss,
                ].filter(Boolean).join(", ") || "none",
                zIndex: 20,
              }}
            />
          )}
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
