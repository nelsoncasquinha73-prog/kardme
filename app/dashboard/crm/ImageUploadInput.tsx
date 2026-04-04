'use client'

import { useState, useRef } from 'react'
import { uploadEmailImage } from '@/lib/crm/emailImageUpload'
import { useToast } from '@/lib/toast-context'
import { FiUpload, FiX } from 'react-icons/fi'

interface ImageUploadInputProps {
  userId: string
  currentUrl?: string
  onUpload: (url: string) => void
}

export default function ImageUploadInput({ userId, currentUrl, onUpload }: ImageUploadInputProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Mostrar preview local
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload para Supabase
      const { url } = await uploadEmailImage(userId, file)
      onUpload(url)
      addToast('Imagem enviada com sucesso!', 'success')
    } catch (e) {
      console.error(e)
      addToast(e instanceof Error ? e.message : 'Erro ao enviar imagem', 'error')
      setPreview(null)
    }
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            color: 'rgba(255,255,255,0.7)',
            marginBottom: 8,
            fontWeight: 700,
          }}
        >
          Upload de Imagem
        </label>

        <div
          style={{
            position: 'relative',
            borderRadius: 8,
            border: '2px dashed rgba(255,255,255,0.2)',
            padding: '20px',
            textAlign: 'center',
            cursor: uploading ? 'not-allowed' : 'pointer',
            background: 'rgba(255,255,255,0.03)',
            transition: 'all 0.2s',
          }}
          onDragOver={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'
            e.currentTarget.style.background = 'rgba(16,185,129,0.1)'
          }}
          onDragLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'
            e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            const file = e.dataTransfer.files?.[0]
            if (file) {
              const input = fileInputRef.current
              if (input) {
                const dataTransfer = new DataTransfer()
                dataTransfer.items.add(file)
                input.files = dataTransfer.files
                handleFileSelect({ target: input } as any)
              }
            }
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
              <p style={{ margin: 0, fontSize: 12 }}>A enviar...</p>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              <FiUpload size={20} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700 }}>Clica ou arrasta uma imagem</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>JPEG, PNG, GIF ou WebP (máx 5MB)</p>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div style={{ position: 'relative' }}>
          <img
            src={preview}
            alt="Preview"
            style={{
              width: '100%',
              borderRadius: 8,
              maxHeight: 200,
              objectFit: 'cover',
            }}
          />
          <button
            onClick={() => {
              setPreview(null)
              onUpload('')
            }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              border: 'none',
              color: '#fff',
              borderRadius: 4,
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
            }}
          >
            <FiX size={14} /> Remover
          </button>
        </div>
      )}
    </div>
  )
}
