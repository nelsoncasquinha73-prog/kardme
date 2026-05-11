import { useEffect, useState } from 'react';
import { FiX, FiPlay } from 'react-icons/fi';

interface VideoOpen {
  id: string;
  preview_id: string;
  opened_at: string;
  broadcast_id?: string;
  email_broadcasts?: { subject: string } | null;
}

interface VideoOpensModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadName: string;
  leadEmail: string;
}

export default function VideoOpensModal({
  isOpen,
  onClose,
  leadId,
  leadName,
  leadEmail,
}: VideoOpensModalProps) {
  const [opens, setOpens] = useState<VideoOpen[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !leadId) return;

    setLoading(true);
    fetch(`/api/crm/video-opens?leadId=${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        setOpens(data.opens || [])
      })
      .catch((err) => console.error('[FETCH_VIDEO_OPENS]', err))
      .finally(() => setLoading(false));
  }, [isOpen, leadId]);

  const isRecent = (dateStr: string) => {
    const openTime = new Date(dateStr).getTime();
    const now = new Date().getTime();
    const diffHours = (now - openTime) / (1000 * 60 * 60);
    return diffHours < 1;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 550,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiPlay size={20} style={{ color: '#10b981' }} />
            Aberturas de vídeo
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FiX size={20} color="#6b7280" />
          </button>
        </div>

        {/* Lead Info */}
        <div
          style={{
            background: 'rgba(59,130,246,0.08)',
            borderRadius: 8,
            padding: 12,
            marginBottom: 20,
            borderLeft: '4px solid #3b82f6',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 4 }}>
            {leadName}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {leadEmail}
          </div>
        </div>

        {/* Opens List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            ⏳ Carregando...
          </div>
        ) : opens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            Nenhuma abertura registada
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#111827', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#10b981', color: '#fff', borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                {opens.length}
              </span>
              abertura{opens.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {opens.map((open, idx) => (
                <div
                  key={open.id}
                  style={{
                    background: isRecent(open.opened_at) ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.02)',
                    borderRadius: 8,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 12,
                    border: isRecent(open.opened_at) ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#111827' }}>
                        #{idx + 1}
                      </span>
                      {isRecent(open.opened_at) && (
                        <span style={{ background: '#10b981', color: '#fff', borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 700 }}>
                          NOVO
                        </span>
                      )}
                    </div>
                    <span style={{ color: '#6b7280', fontSize: 11 }}>
                      {formatTime(open.opened_at)}
                    </span>
                  </div>
                  {open.email_broadcasts?.subject && (
                    <div style={{ fontSize: 11, color: '#6b7280', background: 'rgba(0,0,0,0.03)', borderRadius: 4, padding: '6px 8px' }}>
                      📧 <strong>{open.email_broadcasts.subject}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: 12,
            marginTop: 20,
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = '#2563eb')}
          onMouseOut={(e) => (e.currentTarget.style.background = '#3b82f6')}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
