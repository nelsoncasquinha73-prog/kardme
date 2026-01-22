'use client'

import { useState } from 'react'
import styles from './KardmeShowcase.module.css'

type Card = { id: number; image: string; title: string }

export default function KardmeShowcase() {
  const [activeCard, setActiveCard] = useState<number>(0)

  const cards: Card[] = [
    { id: 1, image: '/assets/kardme/cards/card-1.png', title: 'Cartão 1' },
    { id: 2, image: '/assets/kardme/cards/card-2.png', title: 'Cartão 2' },
    { id: 3, image: '/assets/kardme/cards/card-3.png', title: 'Cartão 3' },
    { id: 4, image: '/assets/kardme/cards/card-4.png', title: 'Cartão 4' },
    { id: 5, image: '/assets/kardme/cards/card-5.png', title: 'Cartão 5' },
  ]

  return (
    <div className={styles.showcase}>
      <div className={styles.iphone}>
        <img
          src="/assets/kardme/iphone/iphone-front.png"
          className={styles.iphoneFrame}
          alt="iPhone"
        />

        <div className={styles.cardsContainer}>
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className={idx === activeCard ? `${styles.cardSlide} ${styles.active}` : styles.cardSlide}
            >
              <img src={card.image} alt={card.title} />
            </div>
          ))}
        </div>

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
