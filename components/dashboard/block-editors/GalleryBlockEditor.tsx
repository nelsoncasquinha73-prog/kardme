'use client'

import React, { useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import SwatchRow from '@/components/editor/SwatchRow'

type GalleryItem = {
  uid: string
  url: string
  caption?: string
  enabled?: boolean
}

type GallerySettings = {
  items: GalleryItem[]
  layout?: {
    containerMode?: 'full' | 'moldura' | 'autoadapter'
    gapPx?: number
    itemWidthPx?: number
    itemHeightPx?: number
    objectFit?: 'cover' | 'contain'

    // autoplay
    autoplay?: boolean
    autoplayIntervalMs?: number
  }
}

type GalleryStyle = {
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
}

type Props = {
  settings: GallerySettings
  style?: GalleryStyle
  onChangeSettings: (s: GallerySettings) => void
  onChangeStyle: (s: GalleryStyle) => void
  onBlurFlushSave?: () => void
}

function generateUid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export default function GalleryBlockEditor({
  settings,
  style,
  onChangeSettings,
  onChangeStyle,
  onBlurFlushSave,
}: Props) {
  const { openPicker } = useColorPicker()

  const s = settings || { items: [] }
  const st = style || {}
  const container = st.container || {}

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const setSettings = (patch: Partial<GallerySettings>) => onChangeSettings({ ...s, ...patch })
  const setContainer = (patch: Partial<GalleryStyle['container']>) =>
    onChangeStyle({ container: { ...container, ...patch } })

  const addItems = (urls: string[]) => {
    const newItems: GalleryItem[] = urls.map((url) => ({
      uid: generateUid(),
      url,
      enabled: true,
    }))
    setSettings({ items: [...(s.items || []), ...newItems] })
  }

  const removeItem = (uid: string) => {
    setSettings({ items: (s.items || []).filter((it) => it.uid !== uid) })
    onBlurFlushSave?.()
  }

  const updateItem = (uid: string, patch: Partial<GalleryItem>) => {
    const next = (s.items || []).map((it) => (it.uid === uid ? { ...it, ...patch } : it))
    setSettings({ items: next })
  }

  async function uploadFile(file: File) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const fileName = `${generateUid()}.${ext}`
    const filePath = `gallery/${fileName}`

    const { error } = await supabase.storage.from('card-assets').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) return { ok: false as const, message: error.message }

    const { data } = supabase.storage.from('card-assets').getPublicUrl(filePath)
    return { ok: true as const, url: data.publicUrl }
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const files = Array.from(e.target.files)
    setIsUploading(true)

    try {
      const uploadedUrls: string[] = []
      const failures: string[] = []

      for (const file of files) {
        const res = await uploadFile(file)
        if (res.ok) uploadedUrls.push(res.url)
        else failures.push(`${file.name}: ${res.message}`)
      }

      if (uploadedUrls.length > 0) {
        addItems(uploadedUrls)
        onBlurFlushSave?.() // 1 flush no fim ✅
      }

      if (failures.length > 0) {
        alert('Alguns uploads falharam:\n\n' + failures.slice(0, 8).join('\n'))
      }
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* IMAGENS */}
      <section
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 14,
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <strong style={{ fontSize: 13, marginBottom: 10 }}>Imagens</strong>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileInputRef}
            onChange={onFileChange}
            disabled={isUploading}
          />
          {isUploading && (
            <div style={{ fontSize: 12, opacity: 0.7 }}>A fazer upload…</div>
          )}
        </div>

        {(s.items || []).map((it) => (
          <div
            key={it.uid}
            style={{
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <img
                src={it.url}
                alt={it.caption || 'Imagem da galeria'}
                style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 8 }}
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removeItem(it.uid)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#e53e3e',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                  lineHeight: 1,
                }}
                aria-label="Remover"
              >
                ×
              </button>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600 }}>Legenda</label>
            <input
              type="text"
              value={it.caption || ''}
              placeholder="Legenda da imagem"
              onChange={(e) => updateItem(it.uid, { caption: e.target.value })}
              onBlur={() => onBlurFlushSave?.()}
              style={input}
            />

            <label style={{ fontSize: 12, fontWeight: 600 }}>
              Ativo
              <input
                type="checkbox"
                checked={it.enabled !== false}
                onChange={(e) => updateItem(it.uid, { enabled: e.target.checked })}
                onBlur={() => onBlurFlushSave?.()}
                style={{ marginLeft: 8 }}
              />
            </label>
          </div>
        ))}
      </section>

      {/* LAYOUT */}
      <section
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: 14,
          border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <strong style={{ fontSize: 13, marginBottom: 10 }}>Layout</strong>

        <label style={{ fontSize: 12, fontWeight: 600 }}>Modo do container</label>
        <select
          value={s.layout?.containerMode ?? 'full'}
          onChange={(e) =>
            setSettings({ layout: { ...(s.layout || {}), containerMode: e.target.value as any } })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        >
          <option value="full">Full</option>
          <option value="moldura">Moldura</option>
          <option value="autoadapter">Auto Adapter</option>
        </select>

        <label style={{ fontSize: 12, fontWeight: 600 }}>Gap (px)</label>
        <input
          type="number"
          min={0}
          max={48}
          value={s.layout?.gapPx ?? 12}
          onChange={(e) =>
            setSettings({ layout: { ...(s.layout || {}), gapPx: Number(e.target.value) } })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        />

        <label style={{ fontSize: 12, fontWeight: 600 }}>Largura (px) - só Auto Adapter</label>
        <input
          type="number"
          min={40}
          max={600}
          value={s.layout?.itemWidthPx ?? 180}
          onChange={(e) =>
            setSettings({ layout: { ...(s.layout || {}), itemWidthPx: Number(e.target.value) } })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        />

        <label style={{ fontSize: 12, fontWeight: 600 }}>Altura (px) - só Auto Adapter</label>
        <input
          type="number"
          min={40}
          max={600}
          value={s.layout?.itemHeightPx ?? 120}
          onChange={(e) =>
            setSettings({ layout: { ...(s.layout || {}), itemHeightPx: Number(e.target.value) } })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        />

        <label style={{ fontSize: 12, fontWeight: 600 }}>Object Fit - só Auto Adapter</label>
        <select
          value={s.layout?.objectFit ?? 'cover'}
          onChange={(e) =>
            setSettings({ layout: { ...(s.layout || {}), objectFit: e.target.value as any } })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        >
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
        </select>

        {/* AUTOPLAY */}
        <strong style={{ fontSize: 13, marginTop: 10 }}>Autoplay</strong>

        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={s.layout?.autoplay !== false}
            onChange={(e) =>
              setSettings({ layout: { ...(s.layout || {}), autoplay: e.target.checked } })
            }
            onBlur={() => onBlurFlushSave?.()}
            style={{ marginRight: 8 }}
          />
          Ativar autoplay
        </label>

        <label style={{ fontSize: 12, fontWeight: 600 }}>Intervalo (ms)</label>
        <input
          type="number"
          min={800}
          max={15000}
          step={100}
          value={s.layout?.autoplayIntervalMs ?? 3500}
          onChange={(e) =>
            setSettings({
              layout: { ...(s.layout || {}), autoplayIntervalMs: Number(e.target.value) },
            })
          }
          onBlur={() => onBlurFlushSave?.()}
          style={input}
        />

        {/* CONTAINER (MOLDURA) */}
        <strong style={{ fontSize: 13, marginTop: 10 }}>Container (Moldura)</strong>

        <label style={{ fontSize: 12, fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={container.enabled !== false}
            onChange={(e) => setContainer({ enabled: e.target.checked })}
            onBlur={() => onBlurFlushSave?.()}
            style={{ marginRight: 8 }}
          />
          Ativar fundo do container
        </label>

        {container.enabled !== false && (
          <>
            <label style={{ fontSize: 12, fontWeight: 600 }}>Cor do fundo</label>
            <SwatchRow
              value={container.bgColor ?? 'transparent'}
              onChange={(hex) => {
                setContainer({ bgColor: hex })
                onBlurFlushSave?.()
              }}
              onEyedropper={() =>
                openPicker({
                  onPick: (hex) => {
                    setContainer({ bgColor: hex })
                    onBlurFlushSave?.()
                  },
                })
              }
            />

            <label style={{ fontSize: 12, fontWeight: 600 }}>Raio (border-radius)</label>
            <input
              type="range"
              min={0}
              max={48}
              value={container.radius ?? 14}
              onChange={(e) => setContainer({ radius: Number(e.target.value) })}
              onMouseUp={() => onBlurFlushSave?.()}
              onTouchEnd={() => onBlurFlushSave?.()}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>{container.radius ?? 14}px</span>

            <label style={{ fontSize: 12, fontWeight: 600 }}>Padding (px)</label>
            <input
              type="range"
              min={0}
              max={48}
              value={container.padding ?? 8}
              onChange={(e) => setContainer({ padding: Number(e.target.value) })}
              onMouseUp={() => onBlurFlushSave?.()}
              onTouchEnd={() => onBlurFlushSave?.()}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>{container.padding ?? 8}px</span>

            <label style={{ fontSize: 12, fontWeight: 600 }}>Borda (px)</label>
            <input
              type="range"
              min={0}
              max={6}
              value={container.borderWidth ?? 1}
              onChange={(e) => setContainer({ borderWidth: Number(e.target.value) })}
              onMouseUp={() => onBlurFlushSave?.()}
              onTouchEnd={() => onBlurFlushSave?.()}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>{container.borderWidth ?? 1}px</span>

            <label style={{ fontSize: 12, fontWeight: 600 }}>Cor da borda</label>
            <SwatchRow
              value={container.borderColor ?? 'rgba(0,0,0,0.12)'}
              onChange={(hex) => {
                setContainer({ borderColor: hex })
                onBlurFlushSave?.()
              }}
              onEyedropper={() =>
                openPicker({
                  onPick: (hex) => {
                    setContainer({ borderColor: hex })
                    onBlurFlushSave?.()
                  },
                })
              }
            />

            <label style={{ fontSize: 12, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={container.shadow === true}
                onChange={(e) => setContainer({ shadow: e.target.checked })}
                onBlur={() => onBlurFlushSave?.()}
                style={{ marginRight: 8 }}
              />
              Sombra
            </label>
          </>
        )}
      </section>
    </div>
  )
}

const input: React.CSSProperties = {
  width: '100%',
  fontSize: 14,
  padding: 8,
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)',
  outline: 'none',
}
