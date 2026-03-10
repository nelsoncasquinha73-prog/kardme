export type AttachmentPayload = {
  filename: string
  mimeType: string
  base64: string
}

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

export async function filesToAttachments(files: FileList | null): Promise<AttachmentPayload[]> {
  if (!files || files.length === 0) return []
  const list = Array.from(files)

  if (list.length > 5) {
    alert('Máximo 5 anexos')
    return []
  }

  const totalBytes = list.reduce((sum, f) => sum + f.size, 0)
  if (totalBytes > 10 * 1024 * 1024) {
    alert('Anexos muito grandes (máx 10MB total)')
    return []
  }

  for (const f of list) {
    if (!ALLOWED_MIMES.includes(f.type)) {
      alert(`Tipo não permitido: ${f.name} (${f.type || 'unknown'})`)
      return []
    }
  }

  const readAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const res = String(reader.result || '')
        const base64 = res.includes('base64,') ? res.split('base64,')[1] : res
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const out: AttachmentPayload[] = []
  for (const f of list) {
    const base64 = await readAsBase64(f)
    out.push({ filename: f.name, mimeType: f.type || 'application/octet-stream', base64 })
  }
  return out
}
