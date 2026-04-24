'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  LeadMagnet, MagnetType,
  getLeadMagnets, createLeadMagnet, updateLeadMagnet,
  deleteLeadMagnet, toggleLeadMagnetActive,
  generateSlug, MAGNET_TYPE_LABELS, DEFAULT_FORM_FIELDS
} from '@/lib/crm/leadMagnets'
import FormBuilder from './FormBuilder'

const DEFAULT_SLICES = [
  {id:'1',label:'🏆 Prémio Principal',color:'#f59e0b',is_prize:true,probability:1.5},
  {id:'2',label:'Tenta outra vez',color:'#6b7280',is_prize:false,probability:25},
  {id:'3',label:'🎁 Brinde Surpresa',color:'#8b5cf6',is_prize:true,probability:15},
  {id:'4',label:'Quase!',color:'#6b7280',is_prize:false,probability:25},
  {id:'5',label:'🥈 2º Prémio',color:'#10b981',is_prize:true,probability:15},
  {id:'6',label:'Tenta outra vez',color:'#6b7280',is_prize:false,probability:10},
]

export default function LeadMagnetsView({ userId }: { userId: string }) {
  const router = useRouter()
  const [cards, setCards] = useState<Array<{ id: string; name: string }>>([])
  const [magnets, setMagnets] = useState<LeadMagnet[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  async function loadCards() {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('id, name')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setCards((data || []).map((c: any) => ({ id: c.id, name: c.name })))
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { load(); loadCards() }, [])
  
  async function load() { 
    setLoading(true)
    try { 
      setMagnets(await getLeadMagnets(userId)) 
    } catch(e) { 
      console.error(e) 
    } 
    setLoading(false) 
  }

  async function handleCreateNew() {
    setCreatingNew(true)
    try {
      const newMagnet = await createLeadMagnet({
        user_id: userId,
        slug: generateSlug('Nova Campanha'),
        title: 'Nova Campanha',
        magnet_type: 'ebook' as MagnetType,
        description: '',
        cover_image_url: '',
        file_url: '',
        thank_you_message: 'Obrigado! O teu download vai começar automaticamente.',
        welcome_email_subject: '',
        welcome_email_body: '',
        form_fields: DEFAULT_FORM_FIELDS,
        is_active: true,
        views_count: 0,
        leads_count: 0,
        raffle_config: { grid_size: 49, prize_description: '', winning_numbers: [] },
        wheel_config: { slices: DEFAULT_SLICES, capture_before_spin: true, max_spins_per_email: 1 },
        card_id: null,
        custom_type_label: null
      })
      router.push(`/dashboard/lead-magnets/${newMagnet.id}`)
    } catch(e: any) {
      console.error(e)
      setToast('❌ Erro ao criar campanha')
      setTimeout(() => setToast(null), 2000)
      setCreatingNew(false)
    }
  }

  async function handleDelete(id: string) { 
    if(!confirm('Apagar campanha?')) return
    await deleteLeadMagnet(id)
    await load() 
  }

  async function handleToggle(m: LeadMagnet) { 
    await toggleLeadMagnetActive(m.id, !m.is_active)
    await load() 
  }

  function copyLink(m: LeadMagnet) {
    const path = m.magnet_type === 'form' ? `/lm/form/${m.slug}` : m.magnet_type === 'raffle' ? `/lm/raffle/${m.slug}` : m.magnet_type === 'wheel' ? `/lm/wheel/${m.slug}` : `/lm/${m.slug}`
    navigator.clipboard.writeText(window.location.origin + path)
    setToast('✓ Link copiado!')
    setTimeout(() => setToast(null), 2000)
  }

  if (loading) return <div style={{color:'rgba(255,255,255,0.5)',padding:40,textAlign:'center'}}>A carregar...</div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:900,color:'#fff',margin:0}}>🧲 Lead Magnets</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',margin:'4px 0 0'}}>Cria campanhas de captura de leads com download automatico</p>
        </div>
        <button onClick={handleCreateNew} disabled={creatingNew} style={{padding:'10px 20px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer',opacity:creatingNew?0.6:1}}>+ Nova Campanha</button>
      </div>

      {magnets.length===0 && (
        <div style={{textAlign:'center',padding:'60px 20px',background:'rgba(255,255,255,0.03)',borderRadius:16,border:'1px dashed rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:48,marginBottom:16}}>🧲</div>
          <h3 style={{color:'#fff',fontWeight:800,margin:'0 0 8px'}}>Nenhuma campanha ainda</h3>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,margin:'0 0 24px'}}>Cria a tua primeira campanha</p>
          <button onClick={handleCreateNew} disabled={creatingNew} style={{padding:'12px 24px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',opacity:creatingNew?0.6:1}}>+ Criar primeira campanha</button>
        </div>
      )}

      {magnets.length>0 && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {magnets.map(m=>(
            <div key={m.id} style={{background:'rgba(255,255,255,0.05)',borderRadius:16,border:'1px solid '+(m.is_active?'rgba(16,185,129,0.3)':'rgba(255,255,255,0.08)'),overflow:'hidden'}}>
              <div style={{height:140,background:'linear-gradient(135deg,#1e293b,#0f172a)',position:'relative',overflow:'hidden'}}>
                {m.cover_image_url ? <img src={m.cover_image_url} alt={m.title} style={{width:'100%',height:'100%',objectFit:'cover'}}/> : <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',fontSize:48}}>{MAGNET_TYPE_LABELS[m.magnet_type].split(' ')[0]}</div>}
                <span style={{position:'absolute',top:10,right:10,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:m.is_active?'rgba(16,185,129,0.9)':'rgba(100,100,100,0.9)',color:'#fff'}}>{m.is_active?'● Ativo':'○ Inativo'}</span>
                <span style={{position:'absolute',top:10,left:10,padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:700,background:'rgba(0,0,0,0.6)',color:'#fff'}}>{MAGNET_TYPE_LABELS[m.magnet_type]}</span>
              </div>
              <div style={{padding:16}}>
                <h3 style={{fontSize:15,fontWeight:800,color:'#fff',margin:'0 0 6px'}}>{m.title}</h3>
                {m.description && <p style={{fontSize:12,color:'rgba(255,255,255,0.5)',margin:'0 0 12px',lineHeight:1.5}}>{m.description}</p>}
                <div style={{display:'flex',gap:16,marginBottom:14}}>
                  <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:900,color:'#60a5fa'}}>{m.views_count}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600}}>VISITAS</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:900,color:'#10b981'}}>{m.leads_count}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600}}>LEADS</div></div>
                  <div style={{textAlign:'center'}}><div style={{fontSize:18,fontWeight:900,color:'#f59e0b'}}>{m.views_count>0?Math.round((m.leads_count/m.views_count)*100):0}%</div><div style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontWeight:600}}>CONVERSAO</div></div>
                </div>
                <div style={{background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
                  <span style={{fontSize:11,color:'rgba(255,255,255,0.4)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.magnet_type==='form'?`/lm/form/${m.slug}`:m.magnet_type==='raffle'?`/lm/raffle/${m.slug}`:m.magnet_type==='wheel'?`/lm/wheel/${m.slug}`:`/lm/${m.slug}`}</span>
                  <button onClick={()=>copyLink(m)} style={{background:'#3b82f6',border:'none',color:'#fff',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>📋 Copiar</button>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => router.push('/dashboard/lead-magnets/' + m.id)} style={{flex:1,padding:'8px 0',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer'}}>✏️ Editar</button>
                  <button onClick={()=>handleToggle(m)} style={{flex:1,padding:'8px 0',borderRadius:8,border:'1px solid '+(m.is_active?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'),background:'transparent',color:m.is_active?'#ef4444':'#10b981',fontWeight:700,fontSize:12,cursor:'pointer'}}>{m.is_active?'⏸ Pausar':'▶ Ativar'}</button>
                  <button onClick={()=>handleDelete(m.id)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)',background:'transparent',color:'#ef4444',fontWeight:700,fontSize:12,cursor:'pointer'}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div style={{
          position:'fixed',
          bottom:24,
          left:'50%',
          transform:'translateX(-50%)',
          background:'rgba(16,185,129,0.15)',
          border:'1px solid rgba(16,185,129,0.35)',
          color:'#34d399',
          padding:'10px 14px',
          borderRadius:12,
          fontWeight:800,
          fontSize:13,
          zIndex:10000,
          backdropFilter:'blur(10px)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
