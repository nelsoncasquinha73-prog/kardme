import { CardTheme } from '@/lib/theme.types'

export type ThemePreset = {
  id: string
  name: string
  theme: CardTheme
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'professional',
    name: 'Profissional',
    theme: {
      mode: 'preset',
      colors: {
        primary: '#2563EB',
        accent: '#2563EB',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        border: '#E5E7EB',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
      },
    },
  },
  {
    id: 'dark',
    name: 'Escuro',
    theme: {
      mode: 'preset',
      colors: {
        primary: '#38BDF8',
        accent: '#38BDF8',
        background: '#020617',
        surface: '#020617',
        border: '#1E293B',
        textPrimary: '#F8FAFC',
        textSecondary: '#CBD5E1',
      },
    },
  },
  {
    id: 'creative',
    name: 'Criativo',
    theme: {
      mode: 'preset',
      colors: {
        primary: '#EC4899',
        accent: '#F59E0B',
        background: '#FFF7ED',
        surface: '#FFFFFF',
        border: '#FED7AA',
        textPrimary: '#1F2937',
        textSecondary: '#6B7280',
      },
    },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    theme: {
      mode: 'preset',
      colors: {
        primary: '#111827',
        accent: '#111827',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        textPrimary: '#111827',
        textSecondary: '#6B7280',
      },
    },
  },
]
