'use client'

import React, { useState } from 'react'

type Props = {
  cardId: string
  settings?: {
    title?: string
    description?: string
    buttonLabel?: string
  }
  style?: {
    align?: 'left' | 'center' | 'right'
    spacing?: {
      top?: number
      titleDescription?: number
      descriptionButton?: number
      bottom?: number
    }
    button?: {
      bgColor?: string
      textColor?: string
      height?: number
      radius?: number
      width?: 'auto' | 'full'
      fontSize?: number
      fontWeight?: number
    }
  }
}

export default function KardmeReferralBlock({
  cardId,
  settings,
  style,
}: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [workArea, setWorkArea] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [status, setStatus] =
    useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const title = settings?.title ?? 'Gostou deste cartão?'
  const description =
    settings?.description ?? 'Também pode ter o seu Kardme.'
  const buttonLabel = settings?.buttonLabel ?? 'Quero saber mais'

  const align = style?.align ?? 'center'
  const spacing = style?.spacing || {}

  const buttonStyle: React.CSSProperties = {
    height: style?.button?.height ?? 46,
    borderRadius: style?.button?.radius ?? 14,
    background:
      style?.button?.bgColor ??
      'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    color: style?.button?.textColor ?? '#ffffff',
    border: 'none',
    padding: '0 20px',
    width: style?.button?.width === 'full' ? '100%' : 'auto',
    fontSize: style?.button?.fontSize ?? 14,
    fontWeight: style?.button?.fontWeight ?? 800,
    cursor: 'pointer',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 46,
    padding: '0 13px',
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#ffffff',
    color: '#111827',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim() || !email.trim() || !workArea.trim()) {
      setErrorMsg('Preencha o nome, o email e a área em que trabalha.')
      setStatus('error')
      return
    }

    if (!consentGiven) {
      setErrorMsg('É necessário aceitar o consentimento.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/kardme-referral', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          workArea: workArea.trim(),
          consentGiven,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data?.error || 'Erro no envio.')
      }

      setStatus('success')
      setName('')
      setEmail('')
      setPhone('')
      setWorkArea('')
      setConsentGiven(false)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Não foi possível enviar.')
      setStatus('error')
    }
  }

  function closeModal() {
    if (status === 'sending') return
    setOpen(false)
    setStatus('idle')
    setErrorMsg(null)
  }

  return (
    <>
      <div
        data-kardme-referral-card={cardId}
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems:
            align === 'left'
              ? 'flex-start'
              : align === 'right'
              ? 'flex-end'
              : 'center',
          textAlign: align,
          paddingTop: spacing.top ?? 0,
          paddingBottom: spacing.bottom ?? 0,
        }}
      >
        {title && (
          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              marginBottom: spacing.titleDescription ?? 8,
            }}
          >
            {title}
          </div>
        )}

        {description && (
          <div
            style={{
              fontSize: 13,
              opacity: 0.75,
              marginBottom: spacing.descriptionButton ?? 8,
            }}
          >
            {description}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setStatus('idle')
            setErrorMsg(null)
            setOpen(true)
          }}
          style={buttonStyle}
        >
          {buttonLabel}
        </button>
      </div>

      {open && (
        <div
          onMouseDown={closeModal}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.60)',
            display: 'grid',
            placeItems: 'center',
            padding: 20,
          }}
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 390,
              background: '#ffffff',
              color: '#111827',
              borderRadius: 20,
              padding: 24,
              boxShadow: '0 24px 80px rgba(0,0,0,0.30)',
              boxSizing: 'border-box',
            }}
          >
            {status === 'success' ? (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginBottom: 10,
                  }}
                >
                  Pedido recebido! 🎉
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    marginBottom: 20,
                  }}
                >
                  Obrigado pelo seu interesse. A equipa Kardme entrará em
                  contacto consigo.
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    ...buttonStyle,
                    width: '100%',
                  }}
                >
                  Fechar
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    marginBottom: 8,
                  }}
                >
                  Quer ter o seu Kardme?
                </div>

                <div
                  style={{
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    marginBottom: 20,
                  }}
                >
                  Deixe os seus dados e entraremos em contacto consigo.
                </div>

                <form
                  onSubmit={handleSubmit}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Nome *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={inputStyle}
                  />

                  <input
                    type="email"
                    placeholder="Email *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />

                  <input
                    type="tel"
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={inputStyle}
                  />

                  <input
                    type="text"
                    placeholder="Em que área trabalha? *"
                    value={workArea}
                    onChange={(e) => setWorkArea(e.target.value)}
                    required
                    style={inputStyle}
                  />

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 9,
                      fontSize: 12,
                      lineHeight: 1.45,
                      color: '#4b5563',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consentGiven}
                      onChange={(e) =>
                        setConsentGiven(e.target.checked)
                      }
                      style={{
                        marginTop: 2,
                        cursor: 'pointer',
                      }}
                    />

                    <span>
                      Concordo em ser contactado pelo Kardme relativamente
                      ao meu pedido.
                    </span>
                  </label>

                  {status === 'error' && (
                    <div
                      style={{
                        fontSize: 12,
                        color: '#dc2626',
                      }}
                    >
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    style={{
                      ...buttonStyle,
                      width: '100%',
                      marginTop: 4,
                      opacity: status === 'sending' ? 0.7 : 1,
                      cursor:
                        status === 'sending'
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {status === 'sending'
                      ? 'A enviar…'
                      : 'Quero ser contactado'}
                  </button>

                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={status === 'sending'}
                    style={{
                      height: 40,
                      border: 'none',
                      background: 'transparent',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
