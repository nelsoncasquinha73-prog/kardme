'use client'

import React, { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useLanguage } from '@/components/language/LanguageProvider'
import { FiUser, FiCheck, FiAlertCircle, FiMapPin, FiCreditCard, FiChevronDown, FiLock, FiEye, FiEyeOff } from 'react-icons/fi'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

const COUNTRIES = [
  { code: 'PT', name: 'Portugal' },
  { code: 'BR', name: 'Brasil' },
  { code: 'ES', name: 'Espanha' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Deutschland' },
  { code: 'IT', name: 'Italia' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'AO', name: 'Angola' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'CV', name: 'Cabo Verde' },
  { code: 'GW', name: 'Guinea-Bissau' },
  { code: 'ST', name: 'S. Tome e Principe' },
  { code: 'TL', name: 'Timor-Leste' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'LU', name: 'Luxembourg' },
  { code: 'BE', name: 'Belgique' },
  { code: 'NL', name: 'Nederland' },
  { code: 'AT', name: 'Austria' },
  { code: 'IE', name: 'Ireland' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'PE', name: 'Peru' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'OTHER', name: 'Other' },
].sort((a, b) => a.name.localeCompare(b.name))

type Profile = {
  id: string
  email: string | null
  nome: string | null
  apelido: string | null
  phone: string | null
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
  const [phone, setPhone] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [morada, setMorada] = useState('')
  const [cidade, setCidade] = useState('')
  const [codigoPostal, setCodigoPostal] = useState('')
  const [pais, setPais] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChanging, setPasswordChanging] = useState(false)

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
    setPhone(data.phone || '')
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
      nome, apelido, phone, data_nascimento: dataNascimento || null, morada, cidade, codigo_postal: codigoPostal, pais,
    }).eq('id', profile.id)
    setSaving(false)
    if (error) { setMessage({ type: 'error', text: t('profile.save_error') }); console.error(error) }
    else { setMessage({ type: 'success', text: t('profile.save_success') }); setTimeout(() => setMessage(null), 3000) }
  }

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: t('profile.password_change_error') })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('profile.password_mismatch') })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.password_too_short') })
      return
    }

    setPasswordChanging(true)
    setMessage(null)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    setPasswordChanging(false)

    if (error) {
      setMessage({ type: 'error', text: t('profile.password_change_error') })
      console.error(error)
    } else {
      setMessage({ type: 'success', text: t('profile.password_changed_success') })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '\u2014'
    return new Date(dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const getPlanBadge = (plan: string | null) => {
    const p = (plan || 'free').toLowerCase()
    const colors: Record<string, { bg: string; text: string }> = {
      free: { bg: 'rgba(107,114,128,0.2)', text: '#9CA3AF' },
      pro: { bg: 'rgba(59,130,246,0.2)', text: '#60A5FA' },
      premium: { bg: 'rgba(168,85,247,0.2)', text: '#C084FC' },
      business: { bg: 'rgba(34,197,94,0.2)', text: '#4ADE80' },
    }
    const c = colors[p] || colors.free
    return <span style={{ padding: '6px 14px', borderRadius: 20, background: c.bg, color: c.text, fontWeight: 700, fontSize: 13, textTransform: 'uppercase' }}>{plan || 'Free'}</span>
  }

  const isExpired = profile?.plan_expires_at ? new Date(profile.plan_expires_at) < new Date() : false

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>{t('common.loading')}</div></div>

  const inputStyle: React.CSSProperties = { width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 14, outline: 'none', transition: 'border-color 0.2s' }
  const selectStyle: React.CSSProperties = { ...inputStyle, height: 46, lineHeight: '20px', appearance: 'none', cursor: 'pointer', paddingRight: 40 }
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 6, display: 'block' }
  const sectionStyle: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 16, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.9)' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px 16px' }}>
      <style>{`
        .profile-phone-input .react-tel-input .form-control { width: 100% !important; padding: 12px 14px 12px 58px !important; border-radius: 12px !important; border: 1px solid rgba(255,255,255,0.1) !important; background: rgba(255,255,255,0.05) !important; color: #fff !important; font-size: 14px !important; height: auto !important; }
        .profile-phone-input .react-tel-input .flag-dropdown { border: none !important; background: transparent !important; border-radius: 12px 0 0 12px !important; }
        .profile-phone-input .react-tel-input .selected-flag { background: transparent !important; padding-left: 12px !important; }
        .profile-phone-input .react-tel-input .selected-flag:hover, .profile-phone-input .react-tel-input .selected-flag:focus { background: transparent !important; }
        .profile-phone-input .react-tel-input .country-list { background: #1a1a2e !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; margin-top: 4px !important; }
        .profile-phone-input .react-tel-input .country-list .country { color: #fff !important; }
        .profile-phone-input .react-tel-input .country-list .country:hover { background: rgba(255,255,255,0.1) !important; }
        .profile-phone-input .react-tel-input .country-list .country.highlight { background: rgba(59,130,246,0.3) !important; }
        .profile-phone-input .react-tel-input .country-list .search { background: rgba(255,255,255,0.05) !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #fff !important; }
      `}</style>

      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'rgba(255,255,255,0.95)' }}>{t('profile.title')}</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 30 }}>{t('profile.subtitle')}</p>

      {message && (
        <div style={{ padding: '14px 18px', borderRadius: 14, marginBottom: 20, background: message.type === 'success' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: message.type === 'success' ? '#4ADE80' : '#F87171', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14, border: message.type === 'success' ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(239,68,68,0.3)' }}>
          {message.type === 'success' ? <FiCheck size={18} /> : <FiAlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiUser size={20} /> {t('profile.personal_data')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          <div><label style={labelStyle}>{t('profile.name')}</label><input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={t('profile.name_placeholder')} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('profile.surname')}</label><input type="text" value={apelido} onChange={(e) => setApelido(e.target.value)} placeholder={t('profile.surname_placeholder')} style={inputStyle} /></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>{t('profile.email')}</label>
          <input type="email" value={profile?.email || ''} disabled style={{ ...inputStyle, opacity: 0.5, cursor: 'not-allowed' }} />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{t('profile.email_readonly')}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginTop: 16 }}>
          <div className="profile-phone-input">
            <label style={labelStyle}>{t('profile.phone')}</label>
            <PhoneInput country={'pt'} value={phone} onChange={(value) => setPhone(value)} enableSearch searchPlaceholder={t('common.search')} inputProps={{ name: 'phone' }} />
          </div>
          <div><label style={labelStyle}>{t('profile.birthday')}</label><input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} style={inputStyle} /></div>
        </div>
      </div>


      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiLock size={20} /> {t('profile.security_section')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }}>
          <div>
            <label style={labelStyle}>{t('profile.new_password')}</label>
            <div style={{ position: 'relative' }}>
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••" style={inputStyle} />
              <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
                {showNewPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <div>
            <label style={labelStyle}>{t('profile.confirm_password')}</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••" style={inputStyle} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 4 }}>
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleChangePassword} disabled={passwordChanging || !newPassword || !confirmPassword} style={{ marginTop: 20, padding: '12px 24px', borderRadius: 12, border: 'none', background: passwordChanging ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff', fontWeight: 700, cursor: passwordChanging ? 'not-allowed' : 'pointer', opacity: passwordChanging || !newPassword || !confirmPassword ? 0.5 : 1 }}>
          {passwordChanging ? t('common.saving') : t('profile.change_password_button')}
        </button>
      </div>
      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiMapPin size={20} /> {t('profile.address_section')}</div>
        <div><label style={labelStyle}>{t('profile.address')}</label><input type="text" value={morada} onChange={(e) => setMorada(e.target.value)} placeholder={t('profile.address_placeholder')} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginTop: 16 }}>
          <div><label style={labelStyle}>{t('profile.city')}</label><input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} placeholder={t('profile.city_placeholder')} style={inputStyle} /></div>
          <div><label style={labelStyle}>{t('profile.postal_code')}</label><input type="text" value={codigoPostal} onChange={(e) => setCodigoPostal(e.target.value)} placeholder={t('profile.postal_placeholder')} style={inputStyle} />
</div>
        </div>
        <div style={{ marginTop: 16, position: 'relative' }}>
          <label style={labelStyle}>{t('profile.country')}</label>
          <select value={pais} onChange={(e) => setPais(e.target.value)} style={selectStyle}>
            <option value="" style={{background: '#1a1a2e', color: '#fff'}}>{t('profile.country_placeholder')}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.name} style={{background: '#1a1a2e', color: '#fff'}}>{c.name}</option>
            ))}
          </select>
          <FiChevronDown size={18} style={{ position: 'absolute', right: 14, top: 38, color: 'rgba(255,255,255,0.5)', pointerEvents: 'none' }} />
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '16px 24px', borderRadius: 14, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, marginBottom: 30, boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
        {saving ? t('profile.saving') : t('profile.save')}
      </button>

      <div style={sectionStyle}>
        <div style={sectionTitleStyle}><FiCreditCard size={20} /> {t('profile.plan_section')}</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{t('profile.current_plan')}</div>
            {getPlanBadge(profile?.plan ?? null)}
          </div>
          {(!profile?.plan || profile?.plan?.toLowerCase() === 'free') && (
            <a href="/dashboard/plans" style={{ padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>{t('profile.upgrade')}</a>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          <div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('profile.plan_start')}</div><div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{formatDate(profile?.plan_started_at ?? null)}</div></div>
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{isExpired ? t('profile.plan_expired') : t('profile.plan_renews')}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isExpired ? '#F87171' : 'rgba(255,255,255,0.9)' }}>
              {formatDate(profile?.plan_expires_at ?? null)}
              {isExpired && <span style={{ marginLeft: 8, fontSize: 11, color: '#F87171' }}>{t('profile.expired_badge')}</span>}
            </div>
          </div>
          <div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('profile.billing_cycle')}</div><div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{profile?.billing === 'yearly' ? t('profile.yearly') : profile?.billing === 'monthly' ? t('profile.monthly') : '\u2014'}</div></div>
          <div><div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('profile.auto_renew')}</div><div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{profile?.plan_auto_renew === true ? t('profile.auto_renew_on') : profile?.plan_auto_renew === false ? t('profile.auto_renew_off') : '\u2014'}</div></div>
        </div>
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{t('profile.member_since')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{formatDate(profile?.created_at ?? null)}</div>
        </div>
      </div>
    </div>
  )
}
