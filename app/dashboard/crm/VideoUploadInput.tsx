'use client'

import { useState, useRef } from 'react'
import { uploadEmailVideo } from '@/lib/crm/emailVideoUpload'
import { uploadEmailImage } from '@/lib/crm/emailImageUpload'
import { useToast } from '@/lib/toast-context'
import { FiUpload, FiX } from 'react-icons/fi'

interface VideoUploadInputProps {
  userId: string
  currentUrl?: string
  onUpload: (data: { videoUrl: string; thumbnail?: string }) => void
}

export default function VideoUploadInput({ userId, currentUrl, onUpload }: VideoUploadInputProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function generateThumbnail(file: File): Promise<File | null> {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.src = URL.createObjectURL(file)

      video.onloadeddata = () => {
        try {
          canvas.width = video.videoWidth || 1280
          canvas.height = video.videoHeight || 720

          if (!ctx) {
            resolve(null)
            return
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(null)
                return
              }

              const thumbnailFile = new File(
                [blob],
                `thumbnail-${Date.now()}.jpg`,
                { type: 'image/jpeg' }
              )

              resolve(thumbnailFile)
            },
            'image/jpeg',
            0.85
          )
        } catch (error) {
          console.error('Erro ao gerar thumbnail:', error)
          resolve(null)
        } finally {
          URL.revokeObjectURL(video.src)
        }
      }

      video.onerror = () => {
        resolve(null)
      }
    })
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Upload do vídeo
      const { url: videoUrl } = await uploadEmailVideo(userId, file)
      console.log('[VIDEO] upload ok:', videoUrl)
      setPreview(videoUrl)

      // 2. Gerar thumbnail automática
      let thumbnailUrl: string | undefined = undefined
      const thumbnailFile = await generateThumbnail(file)
      console.log('[VIDEO] thumbnailFile:', thumbnailFile)

      if (thumbnailFile) {
        const { url } = await uploadEmailImage(userId, thumbnailFile)
        thumbnailUrl = url
        console.log('[VIDEO] thumbnail upload ok:', thumbnailUrl)
      } else {
        console.warn('[VIDEO] thumbnailFile veio null')
      }

      // 3. Devolver ambos
      console.log('[VIDEO] onUpload payload:', {
        videoUrl,
        thumbnail: thumbnailUrl,
      })
      onUpload({
        videoUrl,
        thumbnail: thumbnailUrl,
      })

      addToast('Vídeo enviado com thumbnail automática!', 'success')
    } catch (e) {
      console.error(e)
      addToast(e instanceof Error ? e.message : 'Erro ao enviar vídeo', 'error')
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
          Upload de Vídeo
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
            accept="video/*"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />

          {uploading ? (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div>
              <p style={{ margin: 0, fontSize: 12 }}>A enviar vídeo e gerar thumbnail...</p>
            </div>
          ) : (
            <div style={{ color: 'rgba(255,255,255,0.7)' }}>
              <FiUpload size={20} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700 }}>Clica ou arrasta um vídeo</p>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>MP4, WebM ou MOV (máx 50MB)</p>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <div style={{ position: 'relative' }}>
          <video
            src={preview}
            style={{
              width: '100%',
              borderRadius: 8,
              maxHeight: 200,
              background: '#000',
            }}
            controls
          />
          <button
            onClick={() => {
              setPreview(null)
              onUpload({ videoUrl: '', thumbnail: '' })
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
