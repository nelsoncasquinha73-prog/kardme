import { NextResponse } from 'next/server'
import { SUPABASE_URL } from '@/lib/config'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function hostFromUrl(u: string) {
  try {
    return new URL(u).host
  } catch {
    return null
  }
}

export async function GET() {
  return NextResponse.json({
    config_SUPABASE_URL: SUPABASE_URL,
    config_SUPABASE_URL_host: SUPABASE_URL ? hostFromUrl(SUPABASE_URL) : null,

    env_NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
    env_NEXT_PUBLIC_SUPABASE_URL_host: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? hostFromUrl(process.env.NEXT_PUBLIC_SUPABASE_URL)
      : null,
  })
}
