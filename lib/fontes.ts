// lib/fontes.ts - PRO Font Library (60+ fontes organizadas por categoria)

export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace'

export type FontOption = {
  label: string
  value: string
  category: FontCategory
}

export const FONT_OPTIONS: FontOption[] = [
  // === DEFAULT ===
  { label: 'Tema (padrão)', value: '', category: 'sans-serif' },

  // === SANS-SERIF (Modernas) ===
  { label: 'Inter', value: 'var(--font-inter)', category: 'sans-serif' },
  { label: 'Poppins', value: 'var(--font-poppins)', category: 'sans-serif' },
  { label: 'Montserrat', value: 'var(--font-montserrat)', category: 'sans-serif' },
  { label: 'Roboto', value: 'var(--font-roboto)', category: 'sans-serif' },
  { label: 'Open Sans', value: 'var(--font-open-sans)', category: 'sans-serif' },
  { label: 'Lato', value: 'var(--font-lato)', category: 'sans-serif' },
  { label: 'Nunito', value: 'var(--font-nunito)', category: 'sans-serif' },
  { label: 'Raleway', value: 'var(--font-raleway)', category: 'sans-serif' },
  { label: 'Work Sans', value: 'var(--font-work-sans)', category: 'sans-serif' },
  { label: 'DM Sans', value: 'var(--font-dm-sans)', category: 'sans-serif' },
  { label: 'Plus Jakarta Sans', value: 'var(--font-plus-jakarta)', category: 'sans-serif' },
  { label: 'Outfit', value: 'var(--font-outfit)', category: 'sans-serif' },
  { label: 'Sora', value: 'var(--font-sora)', category: 'sans-serif' },
  { label: 'Manrope', value: 'var(--font-manrope)', category: 'sans-serif' },
  { label: 'Space Grotesk', value: 'var(--font-space-grotesk)', category: 'sans-serif' },
  { label: 'Quicksand', value: 'var(--font-quicksand)', category: 'sans-serif' },
  { label: 'Rubik', value: 'var(--font-rubik)', category: 'sans-serif' },
  { label: 'Karla', value: 'var(--font-karla)', category: 'sans-serif' },
  { label: 'Barlow', value: 'var(--font-barlow)', category: 'sans-serif' },
  { label: 'Josefin Sans', value: 'var(--font-josefin-sans)', category: 'sans-serif' },

  // === SERIF (Elegantes) ===
  { label: 'Playfair Display', value: 'var(--font-playfair)', category: 'serif' },
  { label: 'Merriweather', value: 'var(--font-merriweather)', category: 'serif' },
  { label: 'Lora', value: 'var(--font-lora)', category: 'serif' },
  { label: 'Cormorant', value: 'var(--font-cormorant)', category: 'serif' },
  { label: 'Libre Baskerville', value: 'var(--font-libre-baskerville)', category: 'serif' },
  { label: 'Crimson Text', value: 'var(--font-crimson-text)', category: 'serif' },
  { label: 'Source Serif Pro', value: 'var(--font-source-serif)', category: 'serif' },
  { label: 'EB Garamond', value: 'var(--font-eb-garamond)', category: 'serif' },
  { label: 'Bitter', value: 'var(--font-bitter)', category: 'serif' },
  { label: 'Spectral', value: 'var(--font-spectral)', category: 'serif' },
  { label: 'PT Serif', value: 'var(--font-pt-serif)', category: 'serif' },

  // === DISPLAY (Impacto) ===
  { label: 'Oswald', value: 'var(--font-oswald)', category: 'display' },
  { label: 'Bebas Neue', value: 'var(--font-bebas-neue)', category: 'display' },
  { label: 'Anton', value: 'var(--font-anton)', category: 'display' },
  { label: 'Archivo Black', value: 'var(--font-archivo-black)', category: 'display' },
  { label: 'Righteous', value: 'var(--font-righteous)', category: 'display' },
  { label: 'Passion One', value: 'var(--font-passion-one)', category: 'display' },
  { label: 'Russo One', value: 'var(--font-russo-one)', category: 'display' },
  { label: 'Alfa Slab One', value: 'var(--font-alfa-slab)', category: 'display' },

  // === HANDWRITING (Pessoais) ===
  { label: 'Dancing Script', value: 'var(--font-dancing)', category: 'handwriting' },
  { label: 'Pacifico', value: 'var(--font-pacifico)', category: 'handwriting' },
  { label: 'Caveat', value: 'var(--font-caveat)', category: 'handwriting' },
  { label: 'Satisfy', value: 'var(--font-satisfy)', category: 'handwriting' },
  { label: 'Great Vibes', value: 'var(--font-great-vibes)', category: 'handwriting' },
  { label: 'Sacramento', value: 'var(--font-sacramento)', category: 'handwriting' },
  { label: 'Kaushan Script', value: 'var(--font-kaushan)', category: 'handwriting' },
  { label: 'Lobster', value: 'var(--font-lobster)', category: 'handwriting' },
  { label: 'Courgette', value: 'var(--font-courgette)', category: 'handwriting' },
  { label: 'Permanent Marker', value: 'var(--font-permanent-marker)', category: 'handwriting' },
  { label: 'Shadows Into Light', value: 'var(--font-shadows-into-light)', category: 'handwriting' },
  { label: 'Indie Flower', value: 'var(--font-indie-flower)', category: 'handwriting' },

  // === MONOSPACE (Tech) ===
  { label: 'Fira Code', value: 'var(--font-fira-code)', category: 'monospace' },
  { label: 'JetBrains Mono', value: 'var(--font-jetbrains-mono)', category: 'monospace' },
  { label: 'Source Code Pro', value: 'var(--font-source-code-pro)', category: 'monospace' },
  { label: 'IBM Plex Mono', value: 'var(--font-ibm-plex-mono)', category: 'monospace' },
  { label: 'Space Mono', value: 'var(--font-space-mono)', category: 'monospace' },
]

// Helper para agrupar por categoria
export const FONT_OPTIONS_BY_CATEGORY = {
  'sans-serif': FONT_OPTIONS.filter(f => f.category === 'sans-serif'),
  'serif': FONT_OPTIONS.filter(f => f.category === 'serif'),
  'display': FONT_OPTIONS.filter(f => f.category === 'display'),
  'handwriting': FONT_OPTIONS.filter(f => f.category === 'handwriting'),
  'monospace': FONT_OPTIONS.filter(f => f.category === 'monospace'),
}

// Labels das categorias em PT
export const CATEGORY_LABELS: Record<FontCategory, string> = {
  'sans-serif': '🔤 Sans-Serif (Modernas)',
  'serif': '📜 Serif (Elegantes)',
  'display': '💥 Display (Impacto)',
  'handwriting': '✍️ Handwriting (Pessoais)',
  'monospace': '💻 Monospace (Tech)',
}
