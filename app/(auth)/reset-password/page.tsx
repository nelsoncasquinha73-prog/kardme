import { Suspense } from 'react'
import ResetPasswordClient from './ResetPasswordClient'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-scope" style={{ padding: 24 }}>A carregar...</div>}>
      <ResetPasswordClient />
    </Suspense>
  )
}
