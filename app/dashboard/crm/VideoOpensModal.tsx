import { useEffect, useState } from 'react';
import { FiX } from 'react-icons/fi';

interface VideoOpen {
  id: string;
  preview_id: string;
  opened_at: string;
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
      .then((data) => setOpens(data.opens || []))
      .catch((err) => console.error('[FETCH_VIDEO_OPENS]', err))
      .finally(() => setLoading(false));
  }, [isOpen, leadId]);

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
          maxWidth: 500,
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>
            📹 Aberturas de vídeo
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
            borderLeft: '3px solid #3b82f6',
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
            Carregando...
          </div>
        ) : opens.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
            Nenhuma abertura registada
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 12 }}>
              Total: {opens.length} abertura{opens.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {opens.map((open, idx) => (
                <div
                  key={open.id}
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: 6,
                    padding: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12,
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#111827' }}>
                    Abertura {idx + 1}
                  </span>
                  <span style={{ color: '#6b7280' }}>
                    {new Date(open.opened_at).toLocaleString('pt-PT')}
                  </span>
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
            padding: 10,
            marginTop: 20,
            borderRadius: 8,
            border: 'none',
            background: '#3b82f6',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
