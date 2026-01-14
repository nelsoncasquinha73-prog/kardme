import '@/styles/vendor/bootstrap.min.css'
import '@/styles/plugins/fontawesome-all.min.css'
import '@/styles/plugins/feature.css'
import '@/styles/plugins/animation.css'
import '@/styles/plugins/slick.css'
import '@/styles/plugins/slick-theme.css'
import '@/styles/plugins/bootstrap-select.min.css'
import '@/styles/plugins/prism.css'
import '@/styles/style.css'

// opcional (se ainda quiseres overrides)
// import '@/styles/auth-overrides.css'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="auth-scope">{children}</div>
}
