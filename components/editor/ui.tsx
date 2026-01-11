import React from 'react'

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: 14,
        border: '1px solid rgba(0,0,0,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <strong style={{ fontSize: 13 }}>{title}</strong>
      {children}
    </div>
  )
}

export function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, opacity: 0.75 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

export function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 46,
        height: 26,
        borderRadius: 999,
        background: active ? 'var(--color-primary)' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: active ? 22 : 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
        }}
      />
    </button>
  )
}

export const input: React.CSSProperties = {
  width: '100%',
  fontSize: 14,
  padding: 8,
  borderRadius: 8,
  border: '1px solid rgba(0,0,0,0.12)',
  outline: 'none',
}

export const select: React.CSSProperties = {
  fontSize: 14,
  padding: 6,
  borderRadius: 8,
  width: 160,
  border: '1px solid rgba(0,0,0,0.12)',
}

export const rightNum: React.CSSProperties = {
  width: 44,
  textAlign: 'right',
  fontSize: 12,
  opacity: 0.7,
}
