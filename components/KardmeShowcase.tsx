'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLanguage } from '@/components/language/LanguageProvider'
import styles from './KardmeShowcase.module.css'

const cards = [
  'Rota Atlântica',
  'RE/MAX',
  'Bairro Burger Co.',
  'Casa Capsula',
  'Herbalife',
  'Espaço Paulo Caetano',
  'Luz & Linha Studio',
]

export default function KardmeShowcase() {
  const [activeCard, setActiveCard] = useState(0)
  const { t } = useLanguage()

  return (
    <div className={styles.showcase}>
      <figure className={styles.preview}>
        <Image
          src={`/assets/kardme/cards/card-${activeCard + 1}.png`}
          alt={cards[activeCard]}
          width={500}
          height={500}
          sizes="(max-width: 800px) 92vw, 500px"
        />
        <figcaption aria-live="polite">
          {cards[activeCard]} · {t(`marketing.example_${activeCard + 1}`)}
        </figcaption>
      </figure>
      <div className={styles.controls} role="group" aria-label={t('marketing.examples_title')}>
        {cards.map((card, index) => (
          <button key={card} type="button" aria-pressed={index === activeCard} onClick={() => setActiveCard(index)}>
            {card}
          </button>
        ))}
      </div>
    </div>
  )
}
