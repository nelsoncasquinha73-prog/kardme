import React from 'react'

import HeaderBlock from '@/components/blocks/HeaderBlock'
import InfoUtilitiesBlock from '@/components/blocks/InfoUtilitiesBlock'
import EmbedBlock from '@/components/blocks/EmbedBlock'
import ProfileBlock from '@/components/blocks/ProfileBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import SocialBlock from '@/components/blocks/SocialBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import BioBlock from '@/components/blocks/BioBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import VideoBlock from '@/components/blocks/VideoBlock'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'

type Card = {
  id: string
  theme?: any
}

type Block = {
  id: string
  type: string
  settings?: any
  style?: any
}

type Props = {
  card: Card
  blocks: Block[]
  showTranslations?: boolean
  fullBleed?: boolean
}

function toPx(v: any) {
  if (v === null || v === undefined || v === '') return undefined
  if (typeof v === 'number') return `${v}px`
  return v
}

function blockOuterSpacingFromJson(style: any): React.CSSProperties {
  const s = style || {}
  return {
    margin: s.margin != null ? toPx(s.margin) : undefined,
  }
}

export default function CardRenderer({ card, blocks, showTranslations = true, fullBleed = false }: Props) {
  const headerBlock = blocks?.find((b) => b.type === 'header')
  const isOverlap = headerBlock?.settings?.layout?.avatarDock !== 'inline'

  const safe = Number(card?.theme?.layout?.safePadding ?? 10)
  const cardPadX = fullBleed ? 0 : 20
  const mainPadX = 16
  const headerBleedX = cardPadX + mainPadX

  const bg = card.theme?.background

  const bgCss =
    bg?.mode === 'solid'
      ? bg.color
      : bg?.mode === 'gradient'
      ? `linear-gradient(${bg.angle ?? 180}deg, ${bg.from}, ${bg.to})`
      : 'transparent'

  const bgOpacity = typeof bg?.opacity === 'number' ? bg.opacity : 1

  return (
    <div
      style={{
        minHeight: 'auto',
        padding: 0,
        borderRadius: 0,
        width: '100%',
        background: 'transparent',
        boxShadow: 'none',
      }}
    >
      {showTranslations && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 16px 12px',
            maxWidth: 420,
            margin: '0 auto',
          }}
        >
          <LanguageSwitcher />
        </div>
      )}

      <main
        style={{
          maxWidth: 420,
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        <div
          style={{
            position: 'relative',
            background: 'transparent',
            borderRadius: 0,
            padding: fullBleed ? 0 : '24px 20px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 40,
            boxShadow: 'none',
          }}
        >
          {/* DECORATIONS (overlay) */}
          {blocks
            ?.filter((block) => block.type === 'decorations')
            .map((block) => (
              <div
                key={block.id}
                style={{
                  position: 'absolute',
                  inset: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                  zIndex: 10,
                }}
              >
                <DecorationBlock settings={block.settings} />
              </div>
            ))}

          {/* HEADER (bleed) */}
          {headerBlock ? (
            <div
              style={{
                position: 'relative',
                zIndex: isOverlap ? 8 : 10,
                marginLeft: -headerBleedX,
                marginRight: -headerBleedX,
              }}
            >
              <HeaderBlock settings={headerBlock.settings} cardBg={card.theme?.background} />
            </div>
          ) : null}

          {/* RESTO DOS BLOCOS */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 40,
              paddingLeft: fullBleed ? safe : 0,
              paddingRight: fullBleed ? safe : 0,
            }}
          >
            {blocks
              ?.filter((b) => b.type !== 'decorations' && b.type !== 'header')
              .map((block) => {
                let z = 10
                if (block.type === 'profile' && isOverlap) z = 12

                const wrapperBase: React.CSSProperties = {
                  position: 'relative',
                  zIndex: z,
                  borderRadius: 18,
                  display: 'flex',
                  flexDirection: 'column',
                }

                const wrapStyle: React.CSSProperties = {
                  ...wrapperBase,
                  ...blockOuterSpacingFromJson(block.style),
                  ...(block.type === 'contact' && block.style?.headingAlign
                    ? {
                        alignItems:
                          block.style.headingAlign === 'left'
                            ? 'flex-start'
                            : block.style.headingAlign === 'right'
                            ? 'flex-end'
                            : 'center',
                      }
                    : {}),
                }

                switch (block.type) {
                  case 'profile':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <ProfileBlock settings={block.settings} headerSettings={headerBlock?.settings} />
                      </div>
                    )

                  case 'gallery':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <GalleryBlock settings={block.settings} style={block.style} />
                      </div>
                    )


                  case 'video':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <VideoBlock settings={block.settings} style={block.style} />
                      </div>
                    )
                  case 'bio':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <BioBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'contact':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <ContactBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'info_utilities':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <InfoUtilitiesBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'social':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <SocialBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'services':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <ServicesBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'lead_form':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <LeadFormBlock cardId={card.id} settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'embed':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <EmbedBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  case 'business_hours':
                    return (
                      <div key={block.id} style={wrapStyle}>
                        <BusinessHoursBlock settings={block.settings} style={block.style} />
                      </div>
                    )

                  default:
                    return null
                }
              })}
          </div>
        </div>
      </main>
    </div>
  )
}
