import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // no futuro vais usar isto
    const { imageUrl } = body

    // 🧪 MOCK RESPONSE (simula AI)
    return NextResponse.json({
      suggestions: [
        {
          name: 'Elegante e Profissional',
          colors: {
            primary: '#1E40AF',
            accent: '#2563EB',
            background: '#FFFFFF',
            surface: '#F1F5F9',
            border: '#E2E8F0',
            textPrimary: '#0F172A',
            textSecondary: '#475569',
          },
          reason:
            'Cores equilibradas, contraste elevado e visual profissional.',
        },
        {
          name: 'Moderno e Escuro',
          colors: {
            primary: '#38BDF8',
            accent: '#0EA5E9',
            background: '#020617',
            surface: '#020617',
            border: '#1E293B',
            textPrimary: '#F8FAFC',
            textSecondary: '#CBD5E1',
          },
          reason:
            'Ideal para um look moderno, tecnológico e premium.',
        },
        {
          name: 'Criativo e Quente',
          colors: {
            primary: '#EA580C',
            accent: '#F59E0B',
            background: '#FFF7ED',
            surface: '#FFFFFF',
            border: '#FED7AA',
            textPrimary: '#1F2937',
            textSecondary: '#6B7280',
          },
          reason:
            'Transmite energia, proximidade e criatividade.',
        },
      ],
    })
  } catch (err) {
    console.error('AI COLOR MOCK ERROR:', err)

    return NextResponse.json(
      { error: 'Erro ao gerar sugestões de cores' },
      { status: 500 }
    )
  }
}
