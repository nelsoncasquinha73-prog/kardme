import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { type, lead, context, history, prompt, blocks } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    let systemPrompt = 'Você é um assistente de vendas e CRM. Gera mensagens profissionais, amigáveis e eficazes. IMPORTANTE: Responde SEMPRE em Português Europeu (Portugal), não Português Brasileiro. Usa vocabulário e expressões de Portugal.'
    let userPrompt = ''

    if (type === 'email_campaign') {
      systemPrompt = `Você é um assistente de email marketing e CRM especializado. Gera emails profissionais, persuasivos e eficazes.

REGRAS:
- Responde SEMPRE em Português Europeu (Portugal), não Brasileiro
- Devolve SEMPRE a resposta em formato JSON válido
- O JSON deve ter a estrutura: { "subject": "...", "blocks": [...] }
- Cada bloco pode ser: { "type": "text", "content": { "html": "..." } } ou { "type": "button", "content": { "text": "...", "url": "https://...", "bgColor": "#3b82f6", "textColor": "#ffffff" } }
- Usa HTML simples no campo html: <p>, <strong>, <em>, <br>, <ul>, <li>
- Máximo 4-5 blocos
- O email deve ser conciso, directo e orientado para acção
- Inclui sempre um CTA (botão) no final
- NÃO incluas saudações genéricas como "Espero que estejas bem"
- Sê específico e relevante ao contexto`

      let contextParts: string[] = []

      if (lead?.name) contextParts.push(`Nome do destinatário: ${lead.name}`)
      if (lead?.email) contextParts.push(`Email: ${lead.email}`)
      if (lead?.lead_type) contextParts.push(`Tipo de lead: ${lead.lead_type}`)
      if (lead?.source) contextParts.push(`Origem: ${lead.source}`)

      if (history && history.length > 0) {
        const historyText = history.slice(0, 10).map((h: any) => {
          const date = new Date(h.created_at).toLocaleDateString('pt-PT')
          return `- [${date}] ${h.type || 'actividade'}: ${h.description || h.details || 'sem detalhes'}`
        }).join('\n')
        contextParts.push(`\nHistórico de interações:\n${historyText}`)
      }

      if (blocks && blocks.length > 0) {
        const currentContent = blocks.map((b: any) => {
          if (b.type === 'text') return b.content?.html || ''
          if (b.type === 'button') return `[Botão: ${b.content?.text}]`
          return ''
        }).filter(Boolean).join('\n')
        contextParts.push(`\nConteúdo actual do email:\n${currentContent}`)
      }

      if (prompt) {
        userPrompt = `${contextParts.join('\n')}\n\nPedido do utilizador: ${prompt}\n\nGera o email em formato JSON.`
      } else if (lead?.name && history?.length > 0) {
        userPrompt = `${contextParts.join('\n')}\n\nCom base no histórico de interações, gera um email de follow-up relevante e personalizado em formato JSON.`
      } else if (lead?.name) {
        userPrompt = `${contextParts.join('\n')}\n\nGera um email de apresentação/primeiro contacto personalizado em formato JSON.`
      } else {
        userPrompt = `${contextParts.join('\n')}\n\nGera um email de marketing genérico e eficaz em formato JSON.`
      }

    } else if (type === 'email') {
      userPrompt = `Gera um email profissional e amigável para ${lead?.name || 'o destinatário'}.
Contexto: ${context || 'Follow-up de lead'}
Mensagem original do lead: "${lead?.message || 'N/A'}"
Tipo de lead: ${lead?.lead_type_id || 'Geral'}

Responde APENAS com o corpo do email, sem assunto, sem saudações formais. Máximo 150 palavras. Em Português Europeu.`

    } else if (type === 'whatsapp') {
      userPrompt = `Gera uma mensagem WhatsApp curta, amigável e direta para ${lead?.name || 'o destinatário'}.
Contexto: ${context || 'Follow-up'}
Mensagem original: "${lead?.message || 'N/A'}"

Responde APENAS com a mensagem, sem emojis desnecessários. Máximo 80 palavras. Em Português Europeu.`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: type === 'email_campaign' ? 'gpt-4o-mini' : 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: type === 'email_campaign' ? 800 : 200,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('OpenAI error:', data)
      return NextResponse.json({ error: data.error?.message || 'Erro ao gerar mensagem' }, { status: 400 })
    }

    const raw = data.choices?.[0]?.message?.content || ''

    if (type === 'email_campaign') {
      try {
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({ 
          subject: 'Email gerado',
          blocks: [{ type: 'text', content: { html: raw } }]
        })
      }
    }

    return NextResponse.json({ message: raw.trim() })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Erro ao processar pedido' }, { status: 500 })
  }
}
