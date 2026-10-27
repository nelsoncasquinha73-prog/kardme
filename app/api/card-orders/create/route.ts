import { NextResponse } from 'next/server'

// A criação de pedidos é exclusiva da API administrativa.
// Este endpoint antigo fica desativado por segurança.
export async function POST() {
  return NextResponse.json(
    { error: 'Endpoint desativado' },
    { status: 410 }
  )
}
