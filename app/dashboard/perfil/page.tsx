'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/components/language/LanguageProvider'
import { FiUser, FiCheck, FiAlertCircle, FiMapPin, FiCreditCard } from 'react-icons/fi'

type Profile = {
  id: string
  email: string | null
  nome: string | null
  apelido: string | null
  telefone: string | null
  data_nascimento: string | null
  morada: string | null
  cidade: string | null
  codigo_postal: string | null
  pais: string | null
  plan: string | null
  billing: string | null
  plan_started_at: string | null
  plan_expires_at: string | null
  plan_auto_renew: boolean | null
  created_at: string | null
}

export default function PerfilPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [nome, setNome] = useState('')
  const [apelido, setApelido] = useState('')
  const [telefone, setTelefone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [morada, setMorada] = useState('')
  const [cidade, setCidade] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [pais, setPais] = useState('')

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (error) { console.error('Erro ao carregar perfil:', error); setLoading(false); return }
    setProfile(data)
    setNome(data.nome || '')
    setApelido(data.apelido || '')
    setTelefone(data.telefone || '')
    setDataNascimento(data.data_nascimento || '')
    setMorada(data.morada || '')
    setCidade(data.cidade || '')
    setCodigoPostal(data.codigo_postal || '')
    setPais(data.pais || '')
    setLoading(false)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMessage(null)
    const { error } = await supabase.from('profiles').update({
      nome, apelido, telefone, data_nascimento: dataNascimento || null, morada, cidade, codigo_postal: codigoPostal, pais,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: 'Erro ao guardar. Tenta novamente.' }); console.error(error) }
    else { setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' }); setTimeout(() => setMessage(null), 3000) }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getPlanBadge = (plan: string | null) => {
    const p = (plan || 'free').toLowerCase()
    const colors: Record<string, { bg: string; text: string }> = {
      free: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6B7280' },
      pro: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6' },
      premium: { bg: 'rgba(168, 85, 247, 0.15)', text: '#A855F7' },
      business: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22C55E' },
    }
    const c = colors[p] || colors.free
    return <span style={{ padding: '6px 14px', borderRadius: 20, background: c.bg, color: c.text, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{plan || 'Free'}</span>
  }

  const isExpired = profile?.plan_expires_at ? new Date(profile.plan_expires_at) < new Date() : false

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div style={{ fontSize: 14, opacity: 0.6 }}>A carregar...</div></div>

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(0,0,0,0.12)', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, display: 'block' }
  const sectionStyle: React.CSSProperties = { background: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(0,0,0,0.06)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Meu Perfil</h1>
      <p style={{ fontSize: 14, opacity: 0.6, marginBottom: 30 }}>Gere os teus dados pessoais e informações da conta</p>

      {message && (
        <div style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 20, background: message.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.type === 'success' ? '#16A34A' : '#DC2626', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Dados Pessoais */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiUser size={20} /> Dados Pessoais</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div><label style={labelStyle}>Nome</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="O teu nome" style={inputStyle} /></div>
          <div><label style={labelStyle}>Apelido</label><input type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder="O teu apelido" style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={profile?.email || ''} disabled style={{ ...inputStyle, background: 'rgba(0,0,0,0.04)', cursor: 'not-allowed' }} />
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 4 }}>O email não pode ser alterado</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          <div><label style={labelStyle}>Telemóvel</label><input type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="+351 912 345 678" style={inputStyle} /></div>
          <div><label style={labelStyle}>Data de Nascimento 🎂</label><input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} style={inputStyle} /></div>
        </div>
      </div>

      {/* Morada */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiMapPin size={20} /> Morada</div>
        <div><label style={labelStyle}>Morada</label><input type="text" value={morada} onChange={(e) => setMorada(e.target.value)} placeholder="Rua, número, andar..." style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
          <div><label style={labelStyle}>Cidade</label><input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder="Lisboa" style={inputStyle} /></div>
          <div><label style={labelStyle}>Código Postal</label><input type="text" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} placeholder="1000-001" style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: 16 }}><label style={labelStyle}>País</label><input type="text" value={pais} onChange={(e) => setPais(e.target.value)} placeholder="Portugal" style={inputStyle} /></div>
      </div>

      {/* Botão Guardar */}
      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none', background: '#3B82F6', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginBottom: 30 }}>
        {saving ? 'A guardar...' : 'Guardar Alterações'}
      </button>

      {/* Plano & Subscrição */}
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiCreditCard size={20} /> Plano & Subscrição</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 6 }}>Plano atual</div>
            {getPlanBadge(profile?.plan)}
          </div>
          {profile?.plan?.toLowerCase() === 'free' && (
            <a href="/dashboard/plans" style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Fazer Upgrade</a>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          <div><div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Início do plano</div><div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(profile?.plan_started_at)}</div></div>
          <div>
            <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>{isExpired ? 'Expirou em' : 'Renova em'}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isExpired ? '#DC2626' : 'inherit' }}>
              {formatDate(profile?.plan_expires_at)}
              {isExpired && <span style={{ marginLeft: 8, fontSize: 11, color: '#DC2626' }}>⚠️ Expirado</span>}
            </div>
          </div>
          <div><div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Ciclo de faturação</div><div style={{ fontSize: 14, fontWeight: 600 }}>{profile?.billing === 'yearly' ? 'Anual' : 'Mensal'}</div></div>
          <div><div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Renovação automática</div><div style={{ fontSize: 14, fontWeight: 600 }}>{profile?.plan_auto_renew ? '✅ Ativa' : '❌ Desativada'}</div></div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 4 }}>Membro desde</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(profile?.created_at)}</div>
        </div>
      </div>
    </div>
  )
}
