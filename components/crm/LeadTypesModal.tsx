'use client'

import { useState } from 'react'
import { LeadType, createLeadType, deleteLeadType, updateLeadType, TYPE_COLORS } from '@/lib/crm/leadTypes'
import { FiTrash2, FiPlus, FiEdit2, FiCheck, FiX } from 'react-icons/fi'

type Props = {
  cardId: string
  userId: string
  types: LeadType[]
  onClose: () => void
  onUpdate: (types: LeadType[]) => void
}

export default function LeadTypesModal({ cardId, userId, types, onClose, onUpdate }: Props) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TYPE_COLORS[0])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  const handleCreate = async () => {
    if (!newName.trim()) return
    setLoading(true)
    try {
      const created = await createLeadType(userId, newName.trim(), newColor)
      onUpdate([...types, created])
      setNewName('')
      setNewColor(TYPE_COLORS[0])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteLeadType(id)
      onUpdate(types.filter(t => t.id !== id))
    } catch (e) { console.error(e) }
  }

  const handleEdit = async (id: string) => {
    try {
      await updateLeadType(id, editName, editColor)
      onUpdate(types.map(t => t.id === id ? { ...t, name: editName, color: editColor } : t))
      setEditingId(null)
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={onClose}>
      <div style={{ background: '#1e293b', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>🏷️ Tipos de Cliente</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}><FiX /></button>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
          Tipos específicos para este cartão. Ex: Comprador, Vendedor, Investidor.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {types.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', padding: '12px 0' }}>Nenhum tipo criado ainda.</p>
          )}
          {types.map(type => (
            <div key={type.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '10px 14px' }}>
              {editingId === type.id ? (
                <>
                  <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: 28, height: 28, border: 'none', borderRadius: 6, cursor: 'pointer' }} />
                  <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 13 }} />
                  <button onClick={() => handleEdit(type.id)} style={{ background: 'none', border: 'none', color: '#00b894', cursor: 'pointer', fontSize: 16 }}><FiCheck /></button>
                  <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}><FiX /></button>
                </>
              ) : (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: type.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ flex: 1, color: '#fff', fontSize: 14 }}>{type.name}</span>
                  <button onClick={() => { setEditingId(type.id); setEditName(type.name); setEditColor(type.color) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 14 }}><FiEdit2 /></button>
                  <button onClick={() => handleDelete(type.id)} style={{ background: 'none', border: 'none', color: '#e17055', cursor: 'pointer', fontSize: 14 }}><FiTrash2 /></button>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Novo tipo</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: 36, height: 36, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ex: Comprador, Vendedor..."
              style={{ flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14 }}
            />
            <button onClick={handleCreate} disabled={loading || !newName.trim()} style={{ background: '#6c5ce7', border: 'none', borderRadius: 10, padding: '10px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPlus /> Criar
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {TYPE_COLORS.map(c => (
              <button key={c} onClick={() => setNewColor(c)} style={{ width: 22, height: 22, borderRadius: '50%', background: c, border: newColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer', padding: 0 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
