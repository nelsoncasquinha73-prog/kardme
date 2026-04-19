'use client'

import { type EmailTemplate } from '@/lib/crm/emailTemplates'
import { type EmailBlock } from './EmailCampaignEditor'

interface EmailTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  templates: EmailTemplate[]
  onApply: (template: EmailTemplate) => void
  onOpenSave: () => void
}

export default function EmailTemplatesModal({
  isOpen,
  onClose,
  templates,
  onApply,
  onOpenSave,
}: EmailTemplatesModalProps) {
  if (!isOpen) return null

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: '#1e293b', borderRadius: 12, padding: 24, maxWidth: 700, width: '90%', maxHeight: '80vh', overflow: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>📚 Templates de Email</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>✕</button>
        </div>

        {templates.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px 0' }}>Nenhum template criado ainda.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {templates.map((template) => (
              <div key={template.id} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>{template.name}</h3>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 0 8px 0' }}>📁 {template.category} • {template.blocks?.length || 0} blocos</p>
                <button onClick={() => onApply(template)} style={{ padding: '8px 16px', borderRadius: 8, background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>✓ Aplicar</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>Fechar</button>
        </div>
      </div>
    </div>
  )
}
