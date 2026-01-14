'use client'

import { useEffect, useState } from 'react'
import ThemeSwitcher from '@/components/auth/ThemeSwitcher'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ThemeSwitcher />
      <div className="auth-scope">{children}</div>
    </>
  )
}
