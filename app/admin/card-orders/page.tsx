'use client'


import styles from './CardOrdersList.module.css'
import { useEffect, useState } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/admin/card-orders')
        if (!res.ok) throw new Error('Erro ao carregar pedidos')
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>A carregar...</div>
  if (error) return <div style={{ padding: '40px', color: '#dc2626' }}>Erro: {error}</div>

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ marginBottom: '24px' }}>Pedidos de Cartão</h1>

      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        {orders.length} pedido{orders.length !== 1 ? 's' : ''}
      </p>

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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
                  NOME
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
                  EMAIL
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
                  DATA
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '13px', color: '#6b7280' }}>
                  AÇÕES
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }} className={styles.nameCell}>
                    <Link href={'/admin/card-orders/' + order.slug}>
                      <strong>{order.nome}</strong>
                    </Link>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#374151' }}>
                    {order.email}
                  </td>
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
                  <td style={{ padding: '12px 16px', fontSize: '13px' }}>
                    <Link
                      href={`/admin/card-orders/${order.slug}`}
                      style={{
                        display: 'inline-block',
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
