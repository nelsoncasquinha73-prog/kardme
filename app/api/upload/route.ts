import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

export async function POST(req: NextRequest) {
  console.log('🔵 [UPLOAD] Request recebido')
  
  try {
    // Verifica autenticação via Authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.log('❌ [UPLOAD] Sem Authorization header')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    console.log('🔵 [UPLOAD] User:', user?.id, 'Error:', authError)
    
    if (authError || !user) {
      console.log('❌ [UPLOAD] Não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    
    const formData = await req.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const folder = formData.get('folder') as string
    
    console.log('🔵 [UPLOAD] File:', file?.name, 'Bucket:', bucket, 'Folder:', folder)
    
    if (!file || !bucket) {
      console.log('❌ [UPLOAD] Ficheiro ou bucket em falta')
      return NextResponse.json({ error: 'Ficheiro ou bucket em falta' }, { status: 400 })
    }
    
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const ext = file.name.split('.').pop()
    const filename = `${timestamp}-${random}.${ext}`
    
    const path = folder ? `${folder}/${filename}` : filename
    
    console.log('🔵 [UPLOAD] Path:', path, 'Size:', buffer.length)
    
    // Upload para Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      })
    
    console.log('🔵 [UPLOAD] Storage response - Data:', data, 'Error:', error)
    
    if (error) {
      console.log('❌ [UPLOAD] Storage error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Gera URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path)
    
    console.log('✅ [UPLOAD] Sucesso! URL:', publicUrl)
    
    return NextResponse.json({ url: publicUrl })
  } catch (err: any) {
    console.error('❌ [UPLOAD] Exception:', err.message, err.stack)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
