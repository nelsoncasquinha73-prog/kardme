'use client'

import { useState, useRef } from 'react'
import { uploadEmailVideo } from '@/lib/crm/emailVideoUpload'
import { createEmailVideoPreview } from '@/lib/crm/emailVideoPreviews'
import { generateThumbnailWithPlayButton } from '@/lib/crm/videoThumbnailGenerator'
import { generateThumbnailWithPlayButton } from '@/lib/crm/videoThumbnailGenerator'
import { uploadEmailImage } from '@/lib/crm/emailImageUpload'
import { useToast } from '@/lib/toast-context'
import { FiUpload, FiX } from 'react-icons/fi'

interface VideoUploadInputProps {
  userId: string
  currentUrl?: string
  onUpload: (data: { videoUrl: string; thumbnail?: string; previewId?: string }) => void
}

export default function VideoUploadInput({ userId, currentUrl, onUpload }: VideoUploadInputProps) {
  const { addToast } = useToast()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function generateThumbnail(file: File): Promise<File | null> {
    return generateThumbnailWithPlayButton(file, '#10b981')
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
      try {
        const thumbnailFile = await generateThumbnail(file)
        console.log('[VIDEO] thumbnailFile gerado:', thumbnailFile?.name, 'size:', thumbnailFile?.size)

        if (thumbnailFile && thumbnailFile.size > 0) {
          try {
            const { url } = await uploadEmailImage(userId, thumbnailFile)
            thumbnailUrl = url
            console.log('[VIDEO] thumbnail upload ok:', thumbnailUrl)
          } catch (uploadError) {
            console.error('[VIDEO] thumbnail upload failed:', uploadError)
            // Continua sem thumbnail
          }
        } else {
          console.warn('[VIDEO] thumbnailFile vazio ou null')
        }
      } catch (thumbError) {
        console.error('[VIDEO] generateThumbnail error:', thumbError)
      }

      // 3. Criar preview público
      let previewId = ''
      try {
        console.log('[VIDEO] tentando criar preview com:', {
          user_id: userId,
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
        })
        const preview = await createEmailVideoPreview(userId, {
          video_url: videoUrl,
          thumbnail_url: thumbnailUrl,
          title: 'Vídeo da Campanha',
          cta_text: 'Ver mais',
        })
        previewId = preview.id
        console.log('[VIDEO] preview criado com sucesso:', previewId)
      } catch (previewError) {
        console.error('[VIDEO] ERRO ao criar preview:', previewError)
        if (previewError instanceof Error) {
          console.error('[VIDEO] erro message:', previewError.message)
          console.error('[VIDEO] erro stack:', previewError.stack)
        }
      }

      // 4. Devolver todos os dados
      console.log('[VIDEO] onUpload payload:', {
        videoUrl,
        thumbnail: thumbnailUrl,
        previewId,
      })
      onUpload({
        videoUrl,
        thumbnail: thumbnailUrl,
        previewId,
      })

      addToast('Vídeo enviado' + (thumbnailUrl ? ' com thumbnail!' : ' (sem thumbnail)'), 'success')
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
