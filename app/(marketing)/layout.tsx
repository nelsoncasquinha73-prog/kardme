import '@/styles/landing-page.css'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="landingRoot">
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        crossOrigin="anonymous"
      />
      {children}
    </div>
  )
}
