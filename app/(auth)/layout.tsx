import '@/styles/vendor/bootstrap.min.css'
import '@/styles/plugins/fontawesome-all.min.css'
import '@/styles/plugins/feature.css'
import '@/styles/plugins/animation.css'
import '@/styles/plugins/slick.css'
import '@/styles/plugins/slick-theme.css'
import '@/styles/plugins/bootstrap-select.min.css'
import '@/styles/plugins/prism.css'
import '@/styles/style.css'

import { LanguageProvider } from '@/components/language/LanguageProvider'

// opcional (se ainda quiseres overrides)
// import '@/styles/auth-overrides.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <div className="auth-scope">{children}</div>
    </LanguageProvider>
  )
}
