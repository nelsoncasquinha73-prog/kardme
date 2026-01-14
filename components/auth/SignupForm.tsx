'use client'

import React, { useState } from 'react'
import PasswordInput from '@/components/ui/PasswordInput'

type Props = {
  t: {
    nameLabel: string
    phoneLabel: string
    emailLabel: string
    passwordLabel: string
    confirmPasswordLabel: string
    submitButton: string
    passwordsMismatchError: string
    phoneInvalidError: string
    successMessage: string
  }
  onSubmit: (data: {
    name: string
    phone: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  loading: boolean
  error: string | null
  ok: string | null
}

export default function SignupForm({ t, onSubmit, loading, error, ok }: Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ name, phone, email, password, confirmPassword })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-section">
        <div className="icon">
          <i className="feather-user" />
        </div>
        <input
          type="text"
          placeholder={t.nameLabel}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="input-section">
        <div className="icon">
          <i className="fa-sharp fa-regular fa-phone" />
        </div>
        <input
          type="tel"
          placeholder={t.phoneLabel}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <div className="input-section mail-section">
        <div className="icon">
          <i className="fa-sharp fa-regular fa-envelope" />
        </div>
        <input
          type="email"
          placeholder={t.emailLabel}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="input-section password-section">
        <div className="icon">
          <i className="fa-sharp fa-regular fa-lock" />
        </div>

        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder={t.passwordLabel}
          required
          autoComplete="new-password"
        />
      </div>

      <div className="input-section password-section">
        <div className="icon">
          <i className="fa-sharp fa-regular fa-lock" />
        </div>

        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder={t.confirmPasswordLabel}
          required
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="btn-default" disabled={loading}>
        {loading ? '...' : t.submitButton}
      </button>

      {ok && <p style={{ color: 'green', marginTop: 10, fontSize: 14 }}>{ok}</p>}
      {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
    </form>
  )
}
