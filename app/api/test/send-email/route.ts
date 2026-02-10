import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'

export async function POST() {
  try {
    const to = 'drmonica@jejum.pt'
    const subject = 'Teste Kardme (Resend)'
    const html = '<div><h2>Teste OK</h2><p>Se recebeste isto, o Resend está a funcionar.</p></div>'

    const result = await sendEmail({ to, subject, html })
    return NextResponse.json({ ok: true, result })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}
