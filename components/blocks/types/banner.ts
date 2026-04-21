export type BannerSettings = {
  enabled: boolean
  mode: 'separator' | 'sticky'
  
  // Layout
  height: number // 80–300px
  fullWidth: boolean
  borderRadius?: number
  margin?: { top: number; bottom: number }
  
  // Background
  backgroundType: 'image' | 'gradient' | 'solid' | 'pattern'
  backgroundImage?: string
  backgroundGradient?: {
    angle: number
    stops: Array<{ color: string; position: number }>
  }
  backgroundColor?: string
  
  // Logo (sticky mode)
  logoUrl?: string
  logoSize: number // 40–80px
  logoPosition: 'center' | 'left' | 'right'
  logoShape: 'circle' | 'square' | 'rounded'
  
  // Fade & Overlays
  fadeTopEnabled: boolean
  fadeTopSize: number
  fadeBottomEnabled: boolean
  fadeBottomSize: number
  overlayColor?: string
  overlayOpacity: number // 0–100
  vignetteEnabled: boolean
  grainEnabled: boolean
  
  // Sticky-specific
  parallaxEnabled?: boolean
  blurContentBelow?: boolean
  stickyZIndex?: number
}
