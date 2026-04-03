import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { type, lead, context } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    let prompt = ''

    if (type === 'email') {
      prompt = `Gera um email profissional e amigável para ${lead.name}.
Contexto: ${context || 'Follow-up de lead'}
Mensagem original do lead: "${lead.message || 'N/A'}"
Tipo de lead: ${lead.lead_type_id || 'Geral'}

Responde APENAS com o corpo do email, sem assunto, sem saudações formais. Máximo 150 palavras. Em Português Europeu.`
    } else if (type === 'whatsapp') {
      prompt = `Gera uma mensagem WhatsApp curta, amigável e direta para ${lead.name}.
Contexto: ${context || 'Follow-up'}
Mensagem original: "${lead.message || 'N/A'}"

Responde APENAS com a mensagem, sem emojis desnecessários. Máximo 80 palavras. Em Português Europeu.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente de vendas e CRM. Gera mensagens profissionais, amigáveis e eficazes. IMPORTANTE: Responde SEMPRE em Português Europeu (Portugal), não Português Brasileiro. Usa vocabulário e expressões de Portugal.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI error:', data)
      return NextResponse.json({ error: data.error?.message || 'Erro ao gerar mensagem' }, { status: 400 })
    }

    const message = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ message: message.trim() })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 })
  }
}
