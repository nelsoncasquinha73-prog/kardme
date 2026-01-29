export type ProfileTextStyle = {
  fontFamily?: string // 'Inter' | 'Poppins' | ...
  fontWeight?: 400 | 700
}

export type ProfileTextLine = {
  enabled: boolean
  text: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
  style?: ProfileTextStyle
}

export type ProfileSettings = {
  enabled: boolean

  avatar?: {
    enabled?: boolean
    image?: string
    shape?: 'circle' | 'rounded' | 'square'
    size?: 'sm' | 'md' | 'lg'
    sizePx?: number
    borderWidth?: number
    borderColor?: string
    offsetX?: number
    offsetY?: number | null
    glow?: {
      enabled?: boolean
      color?: string
      size?: number
    }
    shadow?: {
      enabled?: boolean
      intensity?: number
    }
    effect3d?: {
      enabled?: boolean
      bgColor?: string
      scale?: number
    }
  }

  name: ProfileTextLine
  profession: ProfileTextLine
  company: ProfileTextLine

  typography?: {
    fontFamily?: 'System' | 'Serif' | 'Monospace'
  }

  background?: {
    enabled?: boolean
    color?: string
    style?: 'flat' | 'rounded' | 'pill'
  }

  layout?: {
    lineGap?: number // px
  }

  offset?: {
    y?: number
  }
}
