'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CardOrder {
  id: string
  slug: string
  nome: string
  email: string
  status: 'rascunho' | 'submetido' | 'em_producao' | 'concluido'
  created_at: string
}

export default function CardOrdersPage() {
  const [orders, setOrders] = useState<CardOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '' })
  const [creating, setCreating] = useState(false)
  const [createdLink, setCreatedLink] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/card-orders')
      if (!res.ok) throw new Error('Erro ao carregar')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Erro:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = async () => {
    if (!formData.nome || !formData.email) {
      alert('Nome e email são obrigatórios')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/admin/card-orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const err = await res.json()
        alert('Erro: ' + err.error)
        return
      }

      const newOrder = await res.json()
      const link = `\${window.location.origin}/card-orders/\${newOrder.slug}`
      setCreatedLink(link)
      setOrders([newOrder, ...orders])
      setFormData({ nome: '', email: '', telefone: '' })
    } catch (err: any) {
      alert('Erro ao criar pedido: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert('Copiado ✅')
    } catch {
      alert('Não consegui copiar automaticamente. Copia manualmente.')
    }
  }

  const handleDelete = async (slug: string) => {
    const ok = confirm('Tens a certeza que queres eliminar este pedido? Esta ação não pode ser desfeita.')
    if (!ok) return

    try {
      const res = await fetch('/api/admin/card-orders/' + slug, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Erro ao eliminar: ' + (err.error || 'unknown'))
        return
      }
      setOrders((prev) => prev.filter((o) => o.slug !== slug))
    } catch (err: any) {
      alert('Erro ao eliminar: ' + err.message)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setCreatedLink(null)
    setFormData({ nome: '', email: '', telefone: '' })
  }

  if (loading) {
    return <div style={{ padding: 24, color: '#9ca3af' }}>A carregar pedidos...</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, color: 'white', fontSize: 28, fontWeight: 800 }}>Pedidos de Cartão</h1>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
            border: 'none',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          + Novo Pedido
        </button>
      </div>

      <p style={{ color: '#9ca3af', marginBottom: 16 }}>{orders.length} pedido{orders.length !== 1 ? 's' : ''}</p>

      {orders.length === 0 ? (
        <p style={{ color: '#9ca3af' }}>Nenhum pedido ainda.</p>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>NOME</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>EMAIL</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>DATA</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#0f172a', fontWeight: 800 }}>
                    <Link href={'/admin/card-orders/' + order.slug} style={{ color: '#0f172a', textDecoration: 'none' }}>
                      <strong>{order.nome}</strong>
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>{order.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: order.status === 'submetido' ? '#dcfce7' : '#e0e7ff',
                      color: order.status === 'submetido' ? '#166534' : '#3730a3',
                      fontWeight: 600,
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                    {new Date(order.created_at).toLocaleDateString('pt-PT')}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'left' }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Link
                        href={'/admin/card-orders/' + order.slug}
                        style={{
                          display: 'inline-block',
                          padding: '6px 10px',
                          background: '#3b82f6',
                          color: 'white',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Ver
                      </Link>

                      <button
                        onClick={() => copyToClipboard(`${window.location.origin}/card-orders/${order.slug}`)}
                        style={{
                          padding: '6px 10px',
                          background: '#f3f4f6',
                          color: '#111827',
                          border: '1px solid #e5e7eb',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Copiar link
                      </button>

                      <button
                        onClick={() => handleDelete(order.slug)}
                        style={{
                          padding: '6px 10px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div onClick={closeModal} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'white',
            borderRadius: 12,
            padding: 32,
            maxWidth: 400,
            width: '90%',
          }}>
            {createdLink ? (
              <>
                <h2 style={{ margin: '0 0 16px 0', color: '#111827', fontSize: 20, fontWeight: 700 }}>✅ Pedido Criado!</h2>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>Copia o link abaixo e envia ao cliente:</p>
                <div style={{
                  background: '#f3f4f6',
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 16,
                  wordBreak: 'break-all',
                  fontSize: 12,
                  color: '#111827',
                  fontFamily: 'monospace',
                }}>
                  {createdLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdLink)
                    alert('Link copiado!')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginBottom: 8,
                  }}
                >
                  📋 Copiar Link
                </button>
                <button
                  onClick={closeModal}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Fechar
                </button>
              </>
            ) : (
              <>
                <h2 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: 20, fontWeight: 700 }}>Novo Pedido de Cartão</h2>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="João Silva"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      color: '#000000',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="joao@example.com"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      color: '#000000',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: 6, fontSize: 14 }}>Telefone</label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="+351 912 345 678"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: 8,
                      fontSize: 14,
                      boxSizing: 'border-box',
                      color: '#000000',
                    }}
                  />
                </div>

                <button
                  onClick={handleCreateOrder}
                  disabled={creating}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: creating ? '#9ca3af' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: creating ? 'not-allowed' : 'pointer',
                    marginBottom: 8,
                  }}
                >
                  {creating ? 'A criar...' : 'Criar Pedido'}
</button>
                <button
                  onClick={closeModal}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: '#e5e7eb',
                    color: '#111827',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
