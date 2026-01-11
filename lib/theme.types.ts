export type CardTheme = {
  mode: 'manual' | 'ai' | 'preset'
  colors: {
    primary: string
    accent: string
    background: string
    surface: string
    border: string
    textPrimary: string
    textSecondary: string
  }
}
