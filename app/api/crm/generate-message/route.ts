import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { type, lead, context, history, prompt, blocks, businessContext } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key não configurada' }, { status: 500 })
    }

    let systemPrompt = ''
    let userPrompt = ''

    if (type === 'email_campaign') {
      const bizContext = businessContext
        ? '\nCONTEXTO DO NEGÓCIO DO UTILIZADOR:\n' + businessContext + '\n'
        : ''

      systemPrompt = 'És um copywriter sénior especialista em email marketing de conversão.\n' + bizContext + '\nREGRAS DE COPYWRITING:\n- Abre com uma dor real, dado surpreendente ou pergunta provocadora (nunca "Espero que estejas bem")\n- Frases curtas e directas — estilo Apple, não estilo corporativo\n- Máximo 1 ideia por parágrafo\n- Benefícios concretos, não features abstractas\n- Urgência real, não artificial\n- CTA único e claro no final\n- Tom: colega que partilha uma dica valiosa, não vendedor a pressionar\n- Usa {nome} para personalizar quando fizer sentido\n- Se o contexto do negócio for fornecido, usa os dados reais (preços, funcionalidades, sector, marca) no email\n- Se NÃO houver contexto do negócio, gera um email genérico mas eficaz com base no pedido\n\nIDIOMA: Responde SEMPRE em Português Europeu (Portugal), nunca Brasileiro.\n\nFORMATO DE RESPOSTA — JSON válido obrigatório:\n{\n  "subject": "assunto curto e magnético (máx 60 chars, sem emojis)",\n  "blocks": [\n    { "type": "text", "content": { "html": "<p>...</p>" } },\n    { "type": "button", "content": { "text": "...", "url": "https://...", "bgColor": "#10b981", "textColor": "#ffffff" } }\n  ]\n}\n\nUsa HTML simples: <p>, <strong>, <em>, <br>, <ul>, <li>\nMáximo 5 blocos. Termina sempre com botão CTA.\nNÃO incluas markdown, NÃO incluas texto fora do JSON.'

      const contextParts: string[] = []

      if (lead?.name) contextParts.push('Nome do destinatário: ' + lead.name)
      if (lead?.email) contextParts.push('Email: ' + lead.email)
      if (lead?.lead_type) contextParts.push('Tipo de lead: ' + lead.lead_type)
      if (lead?.source) contextParts.push('Origem: ' + lead.source)

      if (history && history.length > 0) {
        const historyText = history.slice(0, 10).map((h: any) => {
          const date = new Date(h.created_at).toLocaleDateString('pt-PT')
          return '- [' + date + '] ' + (h.type || 'actividade') + ': ' + (h.description || h.details || 'sem detalhes')
        }).join('\n')
        contextParts.push('\nHistórico de interações:\n' + historyText)
      }

      if (blocks && blocks.length > 0) {
        const currentContent = blocks.map((b: any) => {
          if (b.type === 'text') return b.content?.html || ''
          if (b.type === 'button') return '[Botão: ' + b.content?.text + ']'
          return ''
        }).filter(Boolean).join('\n')
        contextParts.push('\nConteúdo actual do email:\n' + currentContent)
      }

      if (prompt) {
        userPrompt = (contextParts.length > 0 ? contextParts.join('\n') + '\n\n' : '') + 'Pedido: ' + prompt + '\n\nGera o email em JSON.'
      } else if (lead?.name && history?.length > 0) {
        userPrompt = contextParts.join('\n') + '\n\nCom base no histórico, gera um email de follow-up personalizado e relevante em JSON.'
      } else if (lead?.name) {
        userPrompt = contextParts.join('\n') + '\n\nGera um email de primeiro contacto personalizado para esta lead em JSON.'
      } else {
        userPrompt = 'Gera um email de prospecção eficaz com base no contexto do negócio. Foco em conversão. JSON.'
      }

    } else if (type === 'email') {
      systemPrompt = 'És um copywriter profissional. Escreves emails directos, humanos e eficazes em Português Europeu (Portugal). Nunca usas linguagem corporativa ou Português Brasileiro.'
      userPrompt = 'Gera um email profissional para ' + (lead?.name || 'o destinatário') + '.\nContexto: ' + (context || 'Follow-up de lead') + '\nMensagem original: "' + (lead?.message || 'N/A') + '"\nTipo de lead: ' + (lead?.lead_type_id || 'Geral') + '\n\nResponde APENAS com o corpo do email. Máximo 150 palavras. Directo e humano.'

    } else if (type === 'whatsapp') {
      systemPrompt = 'És um copywriter profissional. Escreves mensagens WhatsApp curtas, naturais e eficazes em Português Europeu (Portugal).'
      userPrompt = 'Gera uma mensagem WhatsApp para ' + (lead?.name || 'o destinatário') + '.\nContexto: ' + (context || 'Follow-up') + '\nMensagem original: "' + (lead?.message || 'N/A') + '"\n\nResponde APENAS com a mensagem. Máximo 80 palavras. Natural e directo.'
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: type === 'email_campaign' ? 'gpt-4o' : 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: type === 'email_campaign' ? 1200 : 300,
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
