'use client'

import { useState, useEffect } from 'react'
import styles from './KardmeShowcase.module.css'

type Card = { id: number; image: string; title: string }

export default function KardmeShowcase() {
  const [activeCard, setActiveCard] = useState<number>(0)

  const cards: Card[] = [
    { id: 1, image: '/assets/kardme/cards/card-1.png', title: 'Rota Atlântica' },
    { id: 2, image: '/assets/kardme/cards/card-2.png', title: 'RE/MAX' },
    { id: 3, image: '/assets/kardme/cards/card-3.png', title: 'Bairro Burger Co.' },
    { id: 4, image: '/assets/kardme/cards/card-4.png', title: 'Casa Capsula' },
    { id: 5, image: '/assets/kardme/cards/card-5.png', title: 'Herbalife' },
    { id: 6, image: '/assets/kardme/cards/card-6.png', title: 'Espaço Paulo Caetano' },
    { id: 7, image: '/assets/kardme/cards/card-7.png', title: 'Luz & Linha Studio' },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard((prev) => (prev + 1) % cards.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [cards.length])

  return (
    <div className={styles.showcase}>
      <div className={styles.phoneContainer}>
        {cards.map((card, idx) => (
          <img
            key={card.id}
            src={card.image}
            alt={card.title}
            className={idx === activeCard ? `${styles.cardImage} ${styles.active}` : styles.cardImage}
          />
        ))}

        <div className={styles.dots}>
          {cards.map((card, idx) => (
            <button
              key={card.id}
              type="button"
              className={idx === activeCard ? `${styles.dot} ${styles.activeDot}` : styles.dot}
              onClick={() => setActiveCard(idx)}
              aria-label={`Cartão ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
