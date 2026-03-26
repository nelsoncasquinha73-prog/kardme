'use client'

import { useState, useEffect } from 'react'

const slides = [
  {
    image: '/assets/kardme/slides/crm-pro.png',
    title: 'CRM Pro',
    description: 'Gere os teus leads em tempo real. Filtra, organiza e acompanha cada contacto.',
    icon: '📊',
  },
  {
    image: '/assets/kardme/slides/crm-email.png',
    title: 'Emails diretos',
    description: 'Envia emails personalizados com templates prontos, direto do CRM.',
    icon: '✉️',
  },
  {
    image: '/assets/kardme/slides/analytics.png',
    title: 'Analytics completo',
    description: 'Vê quem visitou o teu cartão, quantos leads geraste e a tua taxa de conversão.',
    icon: '📈',
  },
]

export default function LoginSlideshow() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px 30px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Slide image */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 520,
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        {slides.map((slide, idx) => (
          <img
            key={idx}
            src={slide.image}
            alt={slide.title}
            style={{
              width: '100%',
              height: 'auto',
              display: idx === active ? 'block' : 'none',
              transition: 'opacity 0.5s ease',
            }}
          />
        ))}
      </div>

      {/* Text */}
      <div style={{
        textAlign: 'center',
        marginTop: 28,
        maxWidth: 440,
      }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>
          {slides[active].icon}
        </div>
        <h3 style={{
          fontSize: 22,
          fontWeight: 700,
          color: '#fff',
          marginBottom: 8,
          transition: 'all 0.3s ease',
        }}>
          {slides[active].title}
        </h3>
        <p style={{
          fontSize: 15,
          color: 'rgba(255,255,255,0.65)',
          lineHeight: 1.6,
          margin: 0,
          transition: 'all 0.3s ease',
        }}>
          {slides[active].description}
        </p>
      </div>

      {/* Dots */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 24,
      }}>
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setActive(idx)}
            aria-label={`Slide ${idx + 1}`}
            style={{
              width: idx === active ? 28 : 10,
              height: 10,
              borderRadius: 5,
              border: 'none',
              background: idx === active ? '#6c5ce7' : 'rgba(255,255,255,0.25)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  )
}
