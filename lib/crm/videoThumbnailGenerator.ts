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
    video.playsInline = true

    const objectUrl = URL.createObjectURL(videoFile)
    video.src = objectUrl

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl)
    }

    video.onloadedmetadata = () => {
      try {
        const width = video.videoWidth || 720
        const height = video.videoHeight || 1280

        canvas.width = width
        canvas.height = height

        video.currentTime = Math.min(1, Math.max(0.1, video.duration / 2))
      } catch (error) {
        console.error('[THUMB] metadata error:', error)
        cleanup()
        resolve(null)
      }
    }

    video.onseeked = () => {
      try {
        const width = canvas.width
        const height = canvas.height

        ctx.drawImage(video, 0, 0, width, height)

        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)'
        ctx.fillRect(0, 0, width, height)

        const centerX = width / 2
        const centerY = height / 2
        const radius = Math.max(36, Math.min(width, height) * 0.12)

        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.30)'
        ctx.shadowBlur = radius * 0.35
        ctx.shadowOffsetY = 6

        ctx.fillStyle = playButtonColor
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        const triangleWidth = radius * 0.72
        const triangleHeight = radius * 0.82
        const triangleOffset = radius * 0.12

        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(centerX - triangleWidth / 2 + triangleOffset, centerY - triangleHeight / 2)
        ctx.lineTo(centerX - triangleWidth / 2 + triangleOffset, centerY + triangleHeight / 2)
        ctx.lineTo(centerX + triangleWidth / 2 + triangleOffset, centerY)
        ctx.closePath()
        ctx.fill()

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size === 0) {
              cleanup()
              resolve(null)
              return
            }

            const thumbnailFile = new File(
              [blob],
              `thumbnail-with-play-${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            )

            cleanup()
            resolve(thumbnailFile)
          },
          'image/jpeg',
          0.92
        )
      } catch (error) {
        console.error('[THUMB] draw error:', error)
        cleanup()
        resolve(null)
      }
    }

    video.onerror = () => {
      console.error('[THUMB] video load error')
      cleanup()
      resolve(null)
    }

    setTimeout(() => {
      cleanup()
      resolve(null)
    }, 8000)
  })
}
