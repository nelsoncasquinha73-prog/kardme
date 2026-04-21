import React from 'react'
import type { BannerSettings } from '@/components/blocks/types/banner'

type Props = {
  settings: BannerSettings
  style?: React.CSSProperties
}

export default function BannerBlock({ settings, style }: Props) {
  if (!settings.enabled) return null

  const isSticky = settings.mode === 'sticky'

  // Build background CSS
  let bgCss = 'transparent'
  if (settings.backgroundType === 'solid' && settings.backgroundColor) {
    bgCss = settings.backgroundColor
  } else if (settings.backgroundType === 'gradient' && settings.backgroundGradient) {
    const stops = settings.backgroundGradient.stops
      .sort((a, b) => a.position - b.position)
      .map((s) => `${s.color} ${s.position}%`)
      .join(', ')
    bgCss = `linear-gradient(${settings.backgroundGradient.angle}deg, ${stops})`
  } else if (settings.backgroundType === 'image' && settings.backgroundImage) {
    bgCss = `url(${settings.backgroundImage})`
  } else if (settings.backgroundType === 'pattern') {
    bgCss = 'linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0.02)), linear-gradient(45deg, rgba(0,0,0,0.02) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0.02))'
  }

  // Fade gradient (top + bottom)
  let fadeGradient = 'linear-gradient(to bottom, transparent, black)'
  if (settings.fadeTopEnabled && settings.fadeBottomEnabled) {
    const topSize = settings.fadeTopSize || 20
    const bottomSize = settings.fadeBottomSize || 20
    fadeGradient = `linear-gradient(to bottom, transparent 0%, black ${topSize}px, black calc(100% - ${bottomSize}px), transparent 100%)`
  } else if (settings.fadeTopEnabled) {
    const topSize = settings.fadeTopSize || 20
    fadeGradient = `linear-gradient(to bottom, transparent 0%, black ${topSize}px, black 100%)`
  } else if (settings.fadeBottomEnabled) {
    const bottomSize = settings.fadeBottomSize || 20
    fadeGradient = `linear-gradient(to bottom, black 0%, black calc(100% - ${bottomSize}px), transparent 100%)`
  }

  const grainSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

  return (
    <div
      style={{
        position: isSticky ? 'sticky' : 'relative',
        top: isSticky ? 0 : undefined,
        zIndex: isSticky ? (settings.stickyZIndex || 10) : undefined,
        height: `${settings.height}px`,
        width: settings.fullWidth ? '100%' : '100%',
        backgroundImage: settings.backgroundType === 'image' ? `url(${settings.backgroundImage})` : undefined,
        background: settings.backgroundType !== 'image' ? bgCss : undefined,
        backgroundSize: settings.backgroundType === 'image' ? 'cover' : undefined,
        backgroundPosition: settings.backgroundType === 'image' ? 'center' : undefined,
        borderRadius: settings.borderRadius ? `${settings.borderRadius}px` : undefined,
        margin: !isSticky ? `${settings.margin?.top || 0}px 0 ${settings.margin?.bottom || 0}px 0` : undefined,
        overflow: 'hidden',
        transform: `translate3d(${settings.offsetX || 0}px, ${settings.offsetY || 0}px, 0)`,
        willChange: 'transform',
        ...style,
      }}
    >
      {/* Fade + Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          maskImage: fadeGradient,
          WebkitMaskImage: fadeGradient,
          backgroundColor: settings.overlayColor,
          opacity: settings.overlayOpacity / 100,
        }}
      />

      {/* Vignette */}
      {settings.vignetteEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Grain */}
      {settings.grainEnabled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url("${grainSvg}")`,
            opacity: 0.08,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Logo (sticky mode) */}
      {isSticky && settings.logoUrl && (
        <img
          src={settings.logoUrl}
          style={{
            position: 'absolute',
            top: '50%',
            left: settings.logoPosition === 'center' ? '50%' : 
                  settings.logoPosition === 'left' ? '20px' : undefined,
            right: settings.logoPosition === 'right' ? '20px' : undefined,
            transform: settings.logoPosition === 'center' ? 'translate(-50%, -50%)' : 'translateY(-50%)',
            width: `${settings.logoSize}px`,
            height: `${settings.logoSize}px`,
            borderRadius:
              settings.logoShape === 'circle' ? '50%' :
              settings.logoShape === 'rounded' ? '12px' : '0px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: 20,
            objectFit: 'cover',
          }}
          alt="Logo"
        />
      )}
    </div>
  )
}
