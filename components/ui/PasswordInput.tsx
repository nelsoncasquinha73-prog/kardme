'use client'

import React, { useId, useState } from 'react'
import { FiEye, FiEyeOff } from 'react-icons/fi'

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  name?: string
  autoComplete?: string
  disabled?: boolean
  required?: boolean
  className?: string
  inputClassName?: string
  minLength?: number
}

export default function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  name,
  autoComplete = 'current-password',
  disabled,
  required,
  className,
  inputClassName,
  minLength,
}: Props) {
  const [show, setShow] = useState(false)
  const id = useId()

  return (
    <div className={className}>
      {label ? (
        <label htmlFor={id} style={{ display: 'block', marginBottom: 8, opacity: 0.9 }}>
          {label}
        </label>
      ) : null}

      <div style={{ position: 'relative' }}>
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          minLength={minLength}
          className={inputClassName}
          style={{
            width: '100%',
            paddingRight: 44,
          }}
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Ocultar password' : 'Mostrar password'}
          title={show ? 'Ocultar password' : 'Mostrar password'}
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            padding: 6,
            cursor: 'pointer',
            color: 'inherit',
            opacity: 0.85,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      </div>
    </div>
  )
}
