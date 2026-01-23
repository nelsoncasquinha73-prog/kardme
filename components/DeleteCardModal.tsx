'use client'

import '@/styles/dashboard-modal.css'

type DeleteCardModalProps = {
  isOpen: boolean
  cardName: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export default function DeleteCardModal({
  isOpen,
  cardName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteCardModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Eliminar cartão?</h2>
        <p className="modal-description">
          Tens a certeza que queres eliminar <strong>"{cardName}"</strong>?
          <br />
          <br />
          Esta ação não pode ser desfeita.
        </p>

        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="modal-btn modal-btn-confirm" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'A eliminar…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
