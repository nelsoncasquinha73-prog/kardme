'use client'

type SharingSettings = {
  language?: string
  title?: string
  description?: string
}

type Props = {
  settings: SharingSettings
  onChange: (settings: SharingSettings) => void
}

const languages = [
  { value: '', label: 'Automático / Padrão' },
  { value: 'pt', label: 'Português' },
  { value: 'pt-br', label: 'Português (Brasil)' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
  { value: 'it', label: 'Italiano' },
  { value: 'ar', label: 'العربية' },
]

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.18)',
  fontSize: 13,
  background: '#fff',
  color: '#111827',
  boxSizing: 'border-box' as const,
}

export default function SharingSettingsEditor({
  settings,
  onChange,
}: Props) {
  const current = settings || {}

  const update = (key: keyof SharingSettings, value: string) => {
    onChange({ ...current, [key]: value })
  }

  return (
    <div style={{
      marginBottom: 20,
      padding: 14,
      borderRadius: 12,
      border: '1px solid rgba(0,0,0,0.12)',
      background: '#f8fafc',
    }}>
      <h3 style={{
        fontSize: 14,
        fontWeight: 800,
        color: '#111827',
        marginBottom: 8,
      }}>
        🔗 Partilha do Cartão
      </h3>

      <p style={{
        fontSize: 12,
        color: '#475569',
        marginBottom: 16,
        lineHeight: 1.5,
      }}>
        Personaliza a apresentação do teu cartão no
        WhatsApp, Facebook e LinkedIn.
      </p>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#111827' }}>
        Idioma da partilha
      </label>

      <select
        value={current.language || 'pt'}
        onChange={(e) => update('language', e.target.value)}
        style={{ ...fieldStyle, height: 46, minHeight: 46, paddingTop: 8, paddingBottom: 8, marginBottom: 14 }}
      >
        {languages.map((language) => (
          <option key={language.value} value={language.value}>
            {language.label}
          </option>
        ))}
      </select>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#111827' }}>
        Título
      </label>

      <input
        type="text"
        value={current.title || ''}
        onChange={(e) => update('title', e.target.value)}
        placeholder="Ex.: Susana Marques | LifeWave"
        maxLength={100}
        style={{ ...fieldStyle, marginBottom: 14 }}
      />

      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#111827' }}>
        Descrição
      </label>

      <textarea
        value={current.description || ''}
        onChange={(e) => update('description', e.target.value)}
        placeholder="Escreve uma descrição para a partilha..."
        maxLength={300}
        rows={4}
        style={{ ...fieldStyle, resize: 'vertical' }}
      />

      <p style={{
        fontSize: 11,
        color: '#64748b',
        marginTop: 10,
        lineHeight: 1.5,
      }}>
        Se deixares os campos vazios, serão utilizados
        os dados atuais do cartão. A imagem de partilha
        será a fotografia de perfil.
      </p>
    </div>
  )
}
