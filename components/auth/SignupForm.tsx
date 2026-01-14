'use client'

import { useState } from 'react'
import PhoneInput from 'react-phone-input-2'

type T = {
  firstNameLabel: string
  lastNameLabel: string
  phoneLabel: string
  emailLabel: string
  passwordLabel: string
  confirmPasswordLabel: string
  submitButton: string
}

export default function SignupForm({
  t,
  onSubmit,
  loading,
  error,
  ok,
}: {
  t: T
  onSubmit: (payload: {
    firstName: string
    lastName: string
    phone: string
    email: string
    password: string
    confirmPassword: string
  }) => Promise<void>
  loading: boolean
  error: string | null
  ok: string | null
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('') // react-phone-input-2 devolve digits (ex: "3519xxxxxxx")
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ firstName, lastName, phone, email, password, confirmPassword })
      }}
    >
      <div className="input-section">
        <div className="icon">
          <i className="fa-regular fa-user" />
        </div>
        <input
          type="text"
          placeholder={t.firstNameLabel}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
      </div>

      <div className="input-section">
        <div className="icon">
          <i className="fa-regular fa-user" />
        </div>
        <input
          type="text"
          placeholder={t.lastNameLabel}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
      </div>

      <div className="input-section">
        <div className="icon">
          <i className="fa-regular fa-phone" />
        </div>

        {/* Bandeira + indicativo */}
        <div style={{ width: '100%' }}>
          <PhoneInput
            country={'pt'}
            value={phone}
            onChange={(v) => setPhone(v)}
            enableSearch
            inputProps={{ required: true, name: 'phone' }}
            inputStyle={{
              width: '100%',
              background: 'transparent',
              color: 'inherit',
              border: 'none',
              outline: 'none',
              height: 48,
            }}
            buttonStyle={{
              background: 'transparent',
              border: 'none',
            }}
            dropdownStyle={{
              background: '#111',
              color: '#fff',
            }}
            placeholder={t.phoneLabel}
          />
        </div>
      </div>

      <div className="input-section mail-section">
        <div className="icon">
          <i className="fa-regular fa-envelope" />
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
          <i className="fa-regular fa-lock" />
        </div>
        <input
          type="password"
          placeholder={t.passwordLabel}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div className="input-section password-section">
        <div className="icon">
          <i className="fa-regular fa-lock" />
        </div>
        <input
          type="password"
          placeholder={t.confirmPasswordLabel}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>

      <button type="submit" className="btn-default" disabled={loading}>
        {loading ? 'A criar...' : t.submitButton}
      </button>

      {ok && <p style={{ color: 'green', marginTop: 10, fontSize: 14 }}>{ok}</p>}
      {error && <p style={{ color: 'crimson', marginTop: 10, fontSize: 14 }}>{error}</p>}
    </form>
  )
}
