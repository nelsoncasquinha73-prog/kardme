import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { templateId, userId, couponCode } = await req.json()

    if (!templateId || !userId) {
      return NextResponse.json({ error: 'templateId e userId são obrigatórios' }, { status: 400 })
    }

    // Buscar template
    const { data: template, error: tErr } = await supabaseAdmin
      .from('templates')
      .select('id, name, price, pricing_tier')
      .eq('id', templateId)
      .single()

    if (tErr || !template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    if (template.pricing_tier === 'free' || template.pricing_tier === 'paid') {
      return NextResponse.json({ error: 'Este template é gratuito' }, { status: 400 })
    }

    let finalPrice = template.price || 0
    let couponId: string | null = null

    // Validar cupão se fornecido
    if (couponCode) {
      const { data: coupon, error: cErr } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single()

      if (cErr || !coupon) {
        return NextResponse.json({ error: 'Cupão inválido ou expirado' }, { status: 400 })
      }

      // Verificar validade
      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        return NextResponse.json({ error: 'Cupão expirado' }, { status: 400 })
      }

      // Verificar limite de usos
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        return NextResponse.json({ error: 'Cupão esgotado' }, { status: 400 })
      }

      // Verificar se é específico para este template
      if (coupon.template_id && coupon.template_id !== templateId) {
        return NextResponse.json({ error: 'Cupão não válido para este template' }, { status: 400 })
      }

      couponId = coupon.id

      // Aplicar desconto
      if (coupon.discount_type === 'free') {
        finalPrice = 0
      } else if (coupon.discount_type === 'percentage') {
        finalPrice = finalPrice * (1 - coupon.discount_value / 100)
      } else if (coupon.discount_type === 'fixed') {
        finalPrice = Math.max(0, finalPrice - coupon.discount_value)
      }
    }

    // Se preço final é 0, dar acesso direto
    if (finalPrice <= 0) {
      // Registar uso do cupão
      if (couponId) {
        await supabaseAdmin
          .from('coupons')
          .update({ uses_count: supabaseAdmin.rpc('increment', { x: 1 }) })
          .eq('id', couponId)

        await supabaseAdmin.from('coupon_uses').insert({
          coupon_id: couponId,
          user_id: userId,
          template_id: templateId,
          original_price: template.price,
          final_price: 0,
        })
      }

      // Dar acesso ao template
      await supabaseAdmin.from('user_templates').insert({
        user_id: userId,
        template_id: templateId,
      })

      return NextResponse.json({ success: true, free: true })
    }

    // Criar sessão Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Template: ${template.name}`,
              description: 'Acesso permanente ao template',
            },
            unit_amount: Math.round(finalPrice * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        purchase_type: 'template_purchase',
        template_id: templateId,
        user_id: userId,
        coupon_id: couponId || '',
        original_price: String(template.price),
        final_price: String(finalPrice),
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/catalog?success=1&template=${templateId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/catalog?canceled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: err.message || 'Erro no checkout' }, { status: 500 })
  }
}
