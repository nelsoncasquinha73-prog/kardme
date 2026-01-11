export type ThemePreset = {
  id: string
  name: string
  theme: {
    background: string
    surface: string
    text: string
    primary: string
  }
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'light',
    name: 'Claro',
    theme: {
      background: '#F8FAFC',
      surface: '#FFFFFF',
      text: '#0F172A',
      primary: '#2563EB',
    },
  },
  {
    id: 'dark',
    name: 'Escuro',
    theme: {
      background: '#020617',
      surface: '#0F172A',
      text: '#E5E7EB',
      primary: '#6366F1',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate',
    theme: {
      background: '#F1F5F9',
      surface: '#FFFFFF',
      text: '#1E293B',
      primary: '#0F766E',
    },
  },
  {
    id: 'creator',
    name: 'Criador',
    theme: {
      background: '#0B0B0F',
      surface: '#111827',
      text: '#F9FAFB',
      primary: '#EC4899',
    },
  },
]
