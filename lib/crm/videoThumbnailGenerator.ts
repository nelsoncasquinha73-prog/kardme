export async function generateThumbnailWithPlayButton(
  videoFile: File,
  playButtonColor: string = '#10b981'
): Promise<File | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      resolve(null)
      return
    }

    video.preload = 'metadata'
    video.muted = true
    const videoUrl = URL.createObjectURL(videoFile)
    video.src = videoUrl

    video.onloadedmetadata = () => {
      try {
        canvas.width = 1280
        canvas.height = 720

        // Busca um frame válido
        video.currentTime = Math.min(1, video.duration / 2)
      } catch (error) {
        console.error('[THUMB] erro ao buscar frame:', error)
        URL.revokeObjectURL(videoUrl)
        resolve(null)
      }
    }

    video.onseeked = () => {
      try {
        // Desenha o frame do vídeo
        ctx!.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Desenha overlay escuro semi-transparente
        ctx!.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx!.fillRect(0, 0, canvas.width, canvas.height)

        // Desenha o botão play no centro
        const centerX = canvas.width / 2
        const centerY = canvas.height / 2
        const playButtonRadius = 70

        // Círculo do play
        ctx!.fillStyle = playButtonColor
        ctx!.beginPath()
        ctx!.arc(centerX, centerY, playButtonRadius, 0, Math.PI * 2)
        ctx!.fill()

        // Sombra do play
        ctx!.shadowColor = 'rgba(0, 0, 0, 0.4)'
        ctx!.shadowBlur = 20
        ctx!.shadowOffsetX = 0
        ctx!.shadowOffsetY = 4

        // Triângulo play (▶)
        ctx!.fillStyle = 'white'
        ctx!.beginPath()
        ctx!.moveTo(centerX - 20, centerY - 30)
        ctx!.lineTo(centerX - 20, centerY + 30)
        ctx!.lineTo(centerX + 35, centerY)
        ctx!.closePath()
        ctx!.fill()

        // Converte para blob
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              URL.revokeObjectURL(videoUrl)
              resolve(null)
              return
            }

            const thumbnailFile = new File(
              [blob],
              `thumbnail-with-play-${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            )

            URL.revokeObjectURL(videoUrl)
            resolve(thumbnailFile)
          },
          'image/jpeg',
          0.95
        )
      } catch (error) {
        console.error('[THUMB] erro ao desenhar play:', error)
        URL.revokeObjectURL(videoUrl)
        resolve(null)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(videoUrl)
      resolve(null)
    }

    setTimeout(() => {
      URL.revokeObjectURL(videoUrl)
      resolve(null)
    }, 5000)
  })
}
