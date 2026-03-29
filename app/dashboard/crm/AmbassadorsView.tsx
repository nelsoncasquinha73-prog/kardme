'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiDownload, FiCheck, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { getAmbassadors, createAmbassador, updateAmbassador, deleteAmbassador, markContractAsSigned, Ambassador } from '@/lib/ambassadors/ambassadorService';
import AmbassadorEditModal from './AmbassadorEditModal';

interface FormData {
  name: string;
  email?: string;
  phone?: string;
  card_type: 'digital' | 'pvc' | 'metallic';
  commission_type: 'fixed' | 'percentage';
  commission_value: number;
  bio?: string;
}

interface AmbassadorsViewProps {
  userId: string;
}


// Helper para badge de subscrição
function getSubscriptionBadge(status?: string) {
  const badges: Record<string, { bg: string; color: string; label: string }> = {
    inactive: { bg: '#6b7280', color: '#fff', label: '⚪ Inativo' },
    pending: { bg: '#f59e0b', color: '#000', label: '🟡 Pendente' },
    active: { bg: '#10b981', color: '#fff', label: '🟢 Ativo' },
    canceled: { bg: '#ef4444', color: '#fff', label: '🔴 Cancelado' },
    past_due: { bg: '#dc2626', color: '#fff', label: '⛔ Vencido' },
  }
  return badges[status || 'inactive']
}

export default function AmbassadorsView({ userId }: AmbassadorsViewProps) {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmbassador, setEditingAmbassador] = useState<Ambassador | null>(null);
  const [openPlanDropdown, setOpenPlanDropdown] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    card_type: 'digital',
    commission_type: 'percentage',
    commission_value: 20,
    bio: '',
  });

  useEffect(() => {
    loadAmbassadors();
  }, []);

  const loadAmbassadors = async () => {
    try {
      const data = await getAmbassadors();
      setAmbassadors(data || []);
    } catch (error) {
      console.error('Erro ao carregar embaixadores:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      card_type: 'digital',
      commission_type: 'percentage',
      commission_value: 20,
      bio: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      alert('Nome e email são obrigatórios');
      return;
    }

    try {
      if (editingId) {
        await updateAmbassador(editingId, formData);
      } else {
        await createAmbassador({ ...formData, user_id: userId });
      }
      resetForm();
      loadAmbassadors();
    } catch (error) {
      console.error('Erro ao salvar embaixador:', error);
      alert('Erro ao salvar embaixador');
    }
  };

  const handleEdit = (amb: Ambassador) => {
    setEditingAmbassador(amb);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que quer deletar este embaixador?')) return;
    try {
      await deleteAmbassador(id);
      loadAmbassadors();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar embaixador');
    }
  };

  const handleDownloadContract = (amb: Ambassador) => {
    window.open(`/contract-template?ambassador=${amb.id}`, '_blank');
  };

  const handleMarkSigned = async (id: string) => {
    try {
      await markContractAsSigned(id);
      loadAmbassadors();
    } catch (error) {
      console.error('Erro ao marcar contrato como assinado:', error);
      alert('Erro ao marcar contrato como assinado');
    }
  };

  const handleSaveAmbassador = async (data: Partial<Ambassador>) => {
    if (editingAmbassador) {
      try {
        await updateAmbassador(editingAmbassador.id, data);
        setEditingAmbassador(null);
        loadAmbassadors();
      } catch (error) {
        console.error('Erro ao atualizar:', error);
        alert('Erro ao atualizar embaixador');
      }
    }
  };

  
  const handleCheckout = async (ambassadorId: string, planType: 'monthly' | 'yearly') => {
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambassadorId,
          planType,
          userId,
        }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Erro ao iniciar pagamento')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Erro ao processar pagamento')
    }
  };

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>🤝 Embaixadores</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>
          <FiPlus size={16} /> Novo Embaixador
        </button>
      </div>

      {showForm && !editingId && (
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: 20, borderRadius: 12, marginBottom: 24, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h3 style={{ marginBottom: 16, fontWeight: 700, fontSize: 14 }}>Novo Embaixador</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <input type="text" placeholder="Nome" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
            <input type="email" placeholder="Email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
            <input type="tel" placeholder="Telefone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
            <select value={formData.card_type} onChange={(e) => setFormData({ ...formData, card_type: e.target.value as any })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', minHeight: '48px', lineHeight: '1.2' }}>
              <option value="digital">Cartão Digital</option>
              <option value="pvc">Cartão PVC</option>
              <option value="metallic">Cartão Metálico</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <select value={formData.commission_type} onChange={(e) => setFormData({ ...formData, commission_type: e.target.value as any })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', minHeight: '48px', lineHeight: '1.2' }}>
              <option value="fixed">Comissão Fixa</option>
              <option value="percentage">Comissão %</option>
            </select>
            <input type="number" placeholder={formData.commission_type === 'percentage' ? 'Ex: 20' : 'Ex: 50'} value={formData.commission_value} onChange={(e) => setFormData({ ...formData, commission_value: parseFloat(e.target.value) || 0 })} style={{ padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit' }} />
          </div>

          <textarea placeholder="Bio / Descrição" value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} style={{ width: '100%', padding: '14px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 13, fontFamily: 'inherit', marginBottom: 16, minHeight: 80 }} />

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleSubmit} style={{ padding: '10px 16px', borderRadius: 8, background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Criar Embaixador</button>
            <button onClick={resetForm} style={{ padding: '10px 16px', borderRadius: 8, background: '#e5e7eb', color: '#d1d5db', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Cancelar</button>
          </div>
        </div>
      )}

      {ambassadors.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
          <p style={{ color: '#d1d5db', fontSize: 14 }}>Nenhum embaixador criado ainda</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {ambassadors.map((amb) => (
            <div key={amb.id} style={{ padding: 16, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h4 style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>{amb.name}</h4>
                  {amb.subscription_status && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: getSubscriptionBadge(amb.subscription_status).bg,
                      color: getSubscriptionBadge(amb.subscription_status).color,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {getSubscriptionBadge(amb.subscription_status).label}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: '#d1d5db', marginBottom: 4 }}>{amb.email} • {amb.phone}</p>
                <p style={{ fontSize: 12, color: '#d1d5db' }}>Comissão: {amb.commission_type === 'percentage' ? `${amb.commission_value}%` : `€${amb.commission_value}`}</p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>{amb.contract_signed ? '✅ Contrato Assinado' : '⏳ Aguardando Assinatura'}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {amb.subscription_status !== 'active' && (
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setOpenPlanDropdown(openPlanDropdown === amb.id ? null : amb.id)}
                      title="Escolher plano de subscrição"
                      style={{ padding: '8px 12px', borderRadius: 8, background: '#fbbf24', color: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
                    >
                      💳 Ativar ▼
                    </button>
                    {openPlanDropdown === amb.id && (
                      <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: '#1f2937', border: '1px solid #374151', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10, minWidth: 180 }}>
                        <button 
                          onClick={() => { handleCheckout(amb.id, 'monthly'); setOpenPlanDropdown(null); }}
                          style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, borderBottom: '1px solid #374151', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          📅 3,99€/mês
                        </button>
                        <button 
                          onClick={() => { handleCheckout(amb.id, 'yearly'); setOpenPlanDropdown(null); }}
                          style={{ width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          🎁 39€/ano + 2 meses de oferta
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {amb.subscription_status === 'active' && (
                  <button title="Subscrição Ativa" style={{ padding: '8px 12px', borderRadius: 8, background: '#d1fae5', color: '#065f46', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                    ✅ Ativo
                  </button>
                )}
                <button onClick={() => handleDownloadContract(amb)} title="Ver Contrato" style={{ padding: '8px 12px', borderRadius: 8, background: '#dbeafe', color: '#0284c7', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><FiDownload size={14} /> Contrato</button>
                {!amb.contract_signed && (
                  <button onClick={() => handleMarkSigned(amb.id)} title="Confirmar Assinatura" style={{ padding: '8px 12px', borderRadius: 8, background: '#dcfce7', color: '#16a34a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><FiCheck size={14} /> Confirmar assinatura</button>
                )}
                <button onClick={() => window.open(`/embaixador/${amb.slug}`, '_blank')} title="Ver Página Pública" style={{ padding: '8px 12px', borderRadius: 8, background: '#e0e7ff', color: '#4f46e5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>👁️ Ver</button>
                <button onClick={() => handleEdit(amb)} title="Editar" style={{ padding: '8px 12px', borderRadius: 8, background: '#fef3c7', color: '#d97706', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><FiEdit2 size={14} /></button>
                <button onClick={() => handleDelete(amb.id)} title="Deletar" style={{ padding: '8px 12px', borderRadius: 8, background: '#fee2e2', color: '#dc2626', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AmbassadorEditModal ambassador={editingAmbassador} onClose={() => setEditingAmbassador(null)} onSave={handleSaveAmbassador} onRefresh={loadAmbassadors} />
    </div>
  );
}
