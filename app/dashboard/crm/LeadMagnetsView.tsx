'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  LeadMagnet, MagnetType,
  getLeadMagnets, createLeadMagnet, updateLeadMagnet,
  deleteLeadMagnet, toggleLeadMagnetActive,
  generateSlug, MAGNET_TYPE_LABELS, DEFAULT_FORM_FIELDS
} from '@/lib/crm/leadMagnets'
import FormBuilder from './FormBuilder'

const DEFAULT_SLICES = [
  {id:'1',label:'🏆 Prémio Principal',color:'#f59e0b',is_prize:true,probability:10},
  {id:'2',label:'Tenta outra vez',color:'#6b7280',is_prize:false,probability:25},
  {id:'3',label:'🎁 Brinde Surpresa',color:'#8b5cf6',is_prize:true,probability:15},
  {id:'4',label:'Quase!',color:'#6b7280',is_prize:false,probability:25},
  {id:'5',label:'🥈 2º Prémio',color:'#10b981',is_prize:true,probability:15},
  {id:'6',label:'Tenta outra vez',color:'#6b7280',is_prize:false,probability:10},
]

export default function LeadMagnetsView({ userId }: { userId: string }) {
  const [magnets, setMagnets] = useState<LeadMagnet[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMagnet, setEditingMagnet] = useState<LeadMagnet | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const emptyForm = {
    title: '', description: '', magnet_type: 'ebook' as MagnetType,
    cover_image_url: '', file_url: '',
    thank_you_message: 'Obrigado! O teu download vai comecar automaticamente.',
    welcome_email_subject: '', welcome_email_body: '',
    form_fields: DEFAULT_FORM_FIELDS, is_active: true,
    raffle_config: { grid_size: 49, prize_description: '', winning_numbers: [] },
    wheel_config: { slices: [], capture_before_spin: true, max_spins_per_email: 1 }
  }
  const [form, setForm] = useState(emptyForm)

  useEffect(() => { load() }, [])
  async function load() { setLoading(true); try { setMagnets(await getLeadMagnets(userId)) } catch(e) { console.error(e) } setLoading(false) }
  function openCreate() { setForm(emptyForm); setEditingMagnet(null); setShowForm(true) }
  function openEdit(m: LeadMagnet) {
    setForm({
      title: m.title, description: m.description||'', magnet_type: m.magnet_type,
      cover_image_url: m.cover_image_url||'', file_url: m.file_url||'',
      thank_you_message: m.thank_you_message||'',
      welcome_email_subject: (m as any).welcome_email_subject||'',
      welcome_email_body: (m as any).welcome_email_body||'',
      form_fields: m.form_fields, is_active: m.is_active,
      raffle_config: { grid_size: m.raffle_config?.grid_size||49, prize_description: m.raffle_config?.prize_description||'', winning_numbers: m.raffle_config?.winning_numbers||[] } as any,
      wheel_config: (m as any).wheel_config || { slices: [], capture_before_spin: true, max_spins_per_email: 1 }
    })
    setEditingMagnet(m); setShowForm(true)
  }
  async function handleSave() {
    if(!form.title.trim()) return alert('Da um nome!')
    if(form.magnet_type !== 'form' && form.magnet_type !== 'raffle' && form.magnet_type !== 'wheel' && !form.file_url.trim()) return alert('Upload ficheiro!')
    setSaving(true)
    try {
      if(editingMagnet) { await updateLeadMagnet(editingMagnet.id, form) }
      else { await createLeadMagnet({...form, user_id: userId, slug: generateSlug(form.title), views_count:0, leads_count:0}) }
      await load(); setShowForm(false)
    } catch(e:any){alert(e.message)}
    setSaving(false)
  }
  async function handleDelete(id: string) { if(!confirm('Apagar campanha?')) return; await deleteLeadMagnet(id); await load() }
  async function handleToggle(m: LeadMagnet) { await toggleLeadMagnetActive(m.id, !m.is_active); await load() }
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return; setUploadingFile(true)
    try {
      const path=`lead-magnets/\${userId}/\${Date.now()}.\${file.name.split('.').pop()}`
      const {error}=await supabase.storage.from('lead-magnets').upload(path,file,{upsert:true})
      if(error) throw error
      const {data}=supabase.storage.from('lead-magnets').getPublicUrl(path)
      setForm(f=>({...f, file_url: data.publicUrl}))
    } catch(e:any){alert(e.message)}
    setUploadingFile(false)
  }
  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return; setUploadingCover(true)
    try {
      const path=`lead-magnets-covers/${userId}/${Date.now()}.${file.name.split('.').pop()}`
      const {error}=await supabase.storage.from('lead-magnets').upload(path,file,{upsert:true})
      if(error) throw error
      const {data}=supabase.storage.from('lead-magnets').getPublicUrl(path)
      setForm(f=>({...f, cover_image_url: data.publicUrl}))
    } catch(e:any){alert(e.message)}
    setUploadingCover(false)
  }
  function copyLink(m: LeadMagnet) {
    const path = m.magnet_type === 'form' ? `/lm/form/${m.slug}` : m.magnet_type === 'raffle' ? `/lm/raffle/${m.slug}` : m.magnet_type === 'wheel' ? `/lm/wheel/${m.slug}` : `/lm/${m.slug}`
    navigator.clipboard.writeText(window.location.origin + path)
    setCopiedId(m.id); setTimeout(() => setCopiedId(null), 2000)
  }
  function getSlices() { const s=(form as any).wheel_config?.slices; return s?.length ? s : DEFAULT_SLICES }
  function updateSlice(i: number, patch: object) { const slices=[...getSlices()]; slices[i]={...slices[i],...patch}; setForm(f=>({...f,wheel_config:{...(f as any).wheel_config,slices}})) }
  function removeSlice(i: number) { const slices=getSlices().filter((_:any,idx:number)=>idx!==i); setForm(f=>({...f,wheel_config:{...(f as any).wheel_config,slices}})) }
  function addSlice() { const slices=[...getSlices(),{id:Date.now().toString(),label:'Nova fatia',color:'#6b7280',is_prize:false,probability:10}]; setForm(f=>({...f,wheel_config:{...(f as any).wheel_config,slices}})) }
  function totalProbability() { return getSlices().reduce((sum:number,s:any)=>sum+(Number(s.probability)||0),0) }

  if (loading) return <div style={{color:'rgba(255,255,255,0.5)',padding:40,textAlign:'center'}}>A carregar...</div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:900,color:'#fff',margin:0}}>🧲 Lead Magnets</h2>
          <p style={{fontSize:13,color:'rgba(255,255,255,0.5)',margin:'4px 0 0'}}>Cria campanhas de captura de leads com download automatico</p>
        </div>
        <button onClick={openCreate} style={{padding:'10px 20px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:13,cursor:'pointer'}}>+ Nova Campanha</button>
      </div>
      {magnets.length===0 && (
        <div style={{textAlign:'center',padding:'60px 20px',background:'rgba(255,255,255,0.03)',borderRadius:16,border:'1px dashed rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:48,marginBottom:16}}>🧲</div>
          <h3 style={{color:'#fff',fontWeight:800,margin:'0 0 8px'}}>Nenhuma campanha ainda</h3>
          <p style={{color:'rgba(255,255,255,0.4)',fontSize:13,margin:'0 0 24px'}}>Cria a tua primeira campanha</p>
          <button onClick={openCreate} style={{padding:'12px 24px',borderRadius:12,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer'}}>+ Criar primeira campanha</button>
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
                  <button onClick={()=>copyLink(m)} style={{background:copiedId===m.id?'#10b981':'#3b82f6',border:'none',color:'#fff',borderRadius:6,padding:'4px 10px',fontSize:11,fontWeight:700,cursor:'pointer',whiteSpace:'nowrap',flexShrink:0}}>{copiedId===m.id?'✓ Copiado!':'📋 Copiar'}</button>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={()=>openEdit(m)} style={{flex:1,padding:'8px 0',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'#fff',fontWeight:700,fontSize:12,cursor
:'pointer'}}>✏️ Editar</button>
                  <button onClick={()=>handleToggle(m)} style={{flex:1,padding:'8px 0',borderRadius:8,border:'1px solid '+(m.is_active?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'),background:'transparent',color:m.is_active?'#ef4444':'#10b981',fontWeight:700,fontSize:12,cursor:'pointer'}}>{m.is_active?'⏸ Pausar':'▶ Ativar'}</button>
                  <button onClick={()=>handleDelete(m.id)} style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(239,68,68,0.3)',background:'transparent',color:'#ef4444',fontWeight:700,fontSize:12,cursor:'pointer'}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.7)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:20}} onClick={()=>setShowForm(false)}>
          <div style={{background:'#1a1a2e',borderRadius:20,padding:32,maxWidth:520,width:'100%',maxHeight:'85vh',overflowY:'auto',border:'1px solid rgba(255,255,255,0.1)'}} onClick={e=>e.stopPropagation()}>
            <h2 style={{fontSize:18,fontWeight:900,color:'#fff',margin:'0 0 24px'}}>{editingMagnet?'Editar Campanha':'Nova Campanha'}</h2>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Nome da campanha *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ex: Guia Comprar Casa 2026" style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Descricao</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Descreve o que a pessoa vai receber..." rows={3} style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Tipo</label>
              <select value={form.magnet_type} onChange={e=>setForm(f=>({...f,magnet_type:e.target.value as MagnetType}))} style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}>
                <option value="ebook">📘 E-book</option>
                <option value="guide">📋 Guia</option>
                <option value="checklist">✅ Checklist</option>
                <option value="discount">🎁 Desconto</option>
                <option value="webinar">🎥 Webinar</option>
                <option value="form">📝 Formulário / Diagnóstico</option>
                <option value="raffle">🎰 Sorteio / Grelha</option>
                <option value="wheel">🎡 Roleta da Sorte</option>
              </select>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Imagem de capa</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input value={form.cover_image_url} onChange={e=>setForm(f=>({...f,cover_image_url:e.target.value}))} placeholder="URL da imagem ou faz upload" style={{flex:1,padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
                <button onClick={()=>coverInputRef.current?.click()} style={{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}>{uploadingCover?'..':'📷 Upload'}</button>
                <input ref={coverInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleCoverUpload}/>
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Ficheiro para download *</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input value={form.file_url} onChange={e=>setForm(f=>({...f,file_url:e.target.value}))} placeholder="URL do ficheiro ou faz upload" style={{flex:1,padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
                <button onClick={()=>fileInputRef.current?.click()} style={{padding:'10px 14px',borderRadius:10,border:'1px solid rgba(16,185,129,0.4)',background:'rgba(16,185,129,0.1)',color:'#10b981',fontWeight:700,fontSize:12,cursor:'pointer',whiteSpace:'nowrap'}}>{uploadingFile?'..':'📎 Upload'}</button>
                <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.zip" style={{display:'none'}} onChange={handleFileUpload}/>
              </div>
              {form.file_url && <p style={{fontSize:11,color:'#10b981',margin:'6px 0 0'}}>✓ Ficheiro pronto</p>}
            </div>

            <div style={{marginBottom:24}}>
              <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Mensagem de agradecimento</label>
              <input value={form.thank_you_message} onChange={e=>setForm(f=>({...f,thank_you_message:e.target.value}))} style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
              <div style={{marginTop:16,padding:'14px',borderRadius:10,border:'1px solid rgba(99,102,241,0.3)',background:'rgba(99,102,241,0.05)'}}>
                <div style={{fontSize:12,color:'#a5b4fc',fontWeight:700,marginBottom:10}}>📧 EMAIL DE BOAS-VINDAS (opcional)</div>
                <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Assunto do email</label>
                <input value={(form as any).welcome_email_subject||''} onChange={e=>setForm(f=>({...f,welcome_email_subject:e.target.value}))} placeholder={`📥 O teu recurso: \${form.title||'título'}`} style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box',marginBottom:10}}/>
                <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Mensagem do email</label>
                <textarea value={(form as any).welcome_email_body||''} onChange={e=>setForm(f=>({...f,welcome_email_body:e.target.value}))} placeholder={'Olá {nome},\n\nObrigado pelo teu interesse!\n\nAqui está o link:\n{link}\n\nMelhores cumprimentos'} rows={5} style={{width:'100%',padding:'12px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box',resize:'vertical'}}/>
                <p style={{fontSize:11,color:'#64748b',marginTop:6,margin:'6px 0 0'}}>Variáveis: <code style={{color:'#a5b4fc'}}>{'{'+'nome}'}</code> e <code style={{color:'#a5b4fc'}}>{'{'+'link}'}</code></p>
              </div>
            </div>

            {form.magnet_type === 'wheel' && (
              <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:12,padding:16,marginTop:8,marginBottom:24}}>
                <div style={{color:'#f59e0b',fontWeight:700,fontSize:13,marginBottom:12}}>🎡 CONFIGURAÇÃO DA ROLETA</div>

                <div style={{marginBottom:12}}>
                  <label style={{color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>Capturar email antes de girar?</label>
                  <select value={(form as any).wheel_config?.capture_before_spin ? 'true' : 'false'}
                    onChange={e=>setForm(f=>({...f,wheel_config:{...(f as any).wheel_config,capture_before_spin:e.target.value==='true'}}))}
                    style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none'}}>
                    <option value="true">✅ Sim — email antes de girar</option>
                    <option value="false">🎡 Não — girar primeiro, email depois</option>
                  </select>
                </div>

                <div style={{marginBottom:12}}>
                  <label style={{color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>Máx. tentativas por email</label>
                  <input type="number" min={1} max={99} value={(form as any).wheel_config?.max_spins_per_email||1}
                    onChange={e=>setForm(f=>({...f,wheel_config:{...(f as any).wheel_config,max_spins_per_email:parseInt(e.target.value)||1}}))}
                    style={{width:'100%',padding:'10px 14px',borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none'}}/>
                  <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',margin:'6px 0 0'}}>Quantas vezes o mesmo email pode girar a roleta</p>
                </div>

                <div style={{marginBottom:12}}>
                  <label style={{color:'rgba(255,255,255,0.6)',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',display:'block',marginBottom:6}}>Fatias da Roleta</label>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {getSlices().map((slice: any, i: number) => (
                      <div key={slice.id} style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                        <input type="color" value={slice.color} onChange={e=>updateSlice(i,{color:e.target.value})}
                          style={{width:32,height:32,borderRadius:6,border:'none',cursor:'pointer',padding:2,flexShrink:0}} />
                        <input value={slice.label} onChange={e=>updateSlice(i,{label:e.target.value})} placeholder="Texto da fatia"
                          style={{flex:1,minWidth:100,padding:'8px 10px',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:13,outline:'none'}} />
                        <div style={{display:'flex',alignItems:'center',gap:4,flexShrink:0}}>
                          <input type="number" min={0} max={100} value={slice.probability??10} onChange={e=>updateSlice(i,{probability:parseInt(e.target.value)||0})}
                            style={{width:52,padding:'8px 6px',borderRadius:8,border:'1px solid rgba(255,255,255,0.15)',background:'rgba(255,255,255,0.07)',color:'#fff',fontSize:12,outline:'none',textAlign:'center'}} />
                          <span style={{color:'rgba(255,255,255,0.3)',fontSize:11}}>%</span>
                        </div>
                        <label style={{display:'flex',alignItems:'center',gap:4,color:'rgba(255,255,255,0.5)',fontSize:11,whiteSpace:'nowrap',flexShrink:0}}>
                          <input type="checkbox" checked={slice.is_prize} onChange={e=>updateSlice(i,{is_prize:e.target.checked})} />
                          Prémio
                        </label>
                        <button onClick={()=>removeSlice(i)}
                          style={{background:'rgba(239,68,68,0.2)',border:'1px solid rgba(239,68,68,0.3)',borderRadius:6,color:'#ef4444',width:28,height:28,cursor:'pointer',fontSize:14,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>✕</button>
                      </div>
                    ))}
                    <button onClick={addSlice}
                      style={{background:'rgba(139,92,246,0.15)',border:'1px dashed rgba(139,92,246,0.4)',borderRadius:8,color:'rgba(139,92,246,0.9)',padding:'8px 12px',cursor:'pointer',fontSize:13,width:'100%',marginTop:4}}>
                      + Adicionar fatia
                    </button>
                  </div>
                  <div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background: totalProbability()===100 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid '+(totalProbability()===100 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)')}}>
                    <span style={{fontSize:12,fontWeight:700,color: totalProbability()===100 ? '#10b981' : '#ef4444'}}>
                      {totalProbability()===100 ? '✅ Total: 100% — perfeito!' : `⚠️ Total: ${totalProbability()}% — deve somar 100%`}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {form.magnet_type === 'raffle' && (
              <div style={{marginBottom:24,padding:'16px',borderRadius:12,border:'1px solid rgba(245,158,11,0.25)',background:'rgba(245,158,11,0.05)'}}>
                <div style={{fontSize:12,color:'#fcd34d',fontWeight:700,marginBottom:12}}>🎰 CONFIGURAÇÃO DO SORTEIO</div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Quantidade de números na grelha</label>
                  <input type="number" min={5} max={200} value={(form as any).raffle_config?.grid_size||49}
                    onChange={e=>setForm(f=>({...f,raffle_config:{...(f as any).raffle_config,grid_size:parseInt(e.target.value)||49}}))}
                    style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Descrição do prémio</label>
                  <input value={(form as any).raffle_config?.prize_description||''}
                    onChange={e=>setForm(f=>({...f,raffle_config:{...(f as any).raffle_config,prize_description:e.target.value}}))}
                    placeholder="Ex: Consulta gratuita, Voucher 50€..."
                    style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
                </div>
                {editingMagnet && (
                  <div>
                    <label style={{fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.5)',textTransform:'uppercase',letterSpacing:1,marginBottom:6,display:'block'}}>Números vencedores (separados por vírgula)</label>
                    <input value={((form as any).raffle_config?.winning_numbers||[]).join(',')}
                      onChange={e=>{const nums=e.target.value.split(',').map((n:string)=>parseInt(n.trim())).filter((n:number)=>!isNaN(n));setForm(f=>({...f,raffle_config:{...(f as any).raffle_config,winning_numbers:nums}}))}}
                      placeholder="Ex: 7, 23, 42"
                      style={{width:'100%',padding:'12px 14px',height:44,borderRadius:10,border:'1px solid rgba(255,255,255,0.15)',fontSize:13,background:'rgba(255,255,255,0.07)',color:'#fff',outline:'none',boxSizing:'border-box'}}/>
                    <p style={{fontSize:11,color:'rgba(255,255,255,0.3)',margin:'6px 0 0'}}>Define após o sorteio. Os números vencedores ficam destacados na grelha.</p>
                  </div>
                )}
              </div>
            )}

            {form.magnet_type === 'form' && editingMagnet && (
              <div style={{marginBottom:24,padding:'16px',borderRadius:12,border:'1px solid rgba(59,130,246,0.25)',background:'rgba(59,130,246,0.06)'}}>
                <div style={{fontSize:12,color:'#93c5fd',fontWeight:700,marginBottom:12}}>📝 Configuração do formulário</div>
                <FormBuilder
                  userId={userId}
                  leadMagnetId={editingMagnet.id}
                  formId={(editingMagnet as any).form_id}
                  title={form.title}
                  onSave={(savedForm) => {
                    setEditingMagnet((prev) => prev ? ({ ...prev, form_id: savedForm.id } as any) : prev)
                  }}
                />
              </div>
            )}

            {form.magnet_type === 'form' && !editingMagnet && (
              <div style={{marginBottom:20,padding:'12px 14px',borderRadius:10,border:'1px solid rgba(250,204,21,0.25)',background:'rgba(250,204,21,0.08)',color:'#fde68a',fontSize:12,lineHeight:1.5}}>
                Cria primeiro a campanha e depois poderás editar e adicionar as perguntas do formulário.
              </div>
            )}

            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowForm(false)} style={{flex:1,padding:'12px 0',borderRadius:12,border:'1px solid rgba(255,255,255,0.15)',background:'transparent',color:'rgba(255,255,255,0.6)',fontWeight:700,fontSize:14,cursor:'pointer'}}>Cancelar</button>
              <button onClick={handleSave} disabled={saving} style={{flex:2,padding:'12px 0',borderRadius:12,border:'none',background:'linear-gradient(135deg,#10b981,#059669)',color:'#fff',fontWeight:800,fontSize:14,cursor:'pointer',opacity:saving?0.6:1}}>{saving?'A guardar...':editingMagnet?'Guardar alteracoes':'Criar campanha'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
