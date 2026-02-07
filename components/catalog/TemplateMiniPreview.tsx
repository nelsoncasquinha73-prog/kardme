'use client'

import { useMemo } from 'react'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import PhoneFrame from '@/components/theme/PhoneFrame'
import CardBackground from '@/components/theme/CardBackground'
import { migrateCardBg } from '@/lib/cardBg'

import HeaderBlock from '@/components/blocks/HeaderBlock'
import ProfileBlock from '@/components/blocks/ProfileBlock'
import SocialBlock from '@/components/blocks/SocialBlock'
import ContactBlock from '@/components/blocks/ContactBlock'
import GalleryBlock from '@/components/blocks/GalleryBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import BioBlock from '@/components/blocks/BioBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import CTAButtonsBlock from '@/components/blocks/CTAButtonsBlock'
import InfoUtilitiesBlock from '@/components/blocks/InfoUtilitiesBlock'
import FreeTextBlock from '@/components/blocks/FreeTextBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import VideoBlock from '@/components/blocks/VideoBlock'

type Template = {
  id: string
  name: string
  preview_json: any[] | null
  theme_json: any | null
}

type Props = {
  template: Template
  height?: number
}

type Block = {
  id: string
  type: string
  settings?: any
  style?: any
  enabled?: boolean
}

function fixBackgroundForPreview(themeJson: any): any {
  if (!themeJson) return themeJson
  const clone = JSON.parse(JSON.stringify(themeJson))
  if (clone?.background?.base?.fit === 'fixed') {
    clone.background.base.fit = 'cover'
  }
  return clone
}


function renderBlock(block: Block, index: number, templateId: string) {
  if (block.enabled === false) return null
  
  const key = block.id || index
  const props = {
    settings: block.settings || {},
    style: block.style || {},
  }

  switch (block.type) {
    case 'header': return <HeaderBlock key={key} {...props} />
    case 'profile': return <ProfileBlock key={key} {...props} />
    case 'social': return <SocialBlock key={key} {...props} />
    case 'contact': return <ContactBlock key={key} {...props} />
    case 'gallery': return <GalleryBlock key={key} {...props} />
    case 'video': return <VideoBlock key={key} {...props} />
    case 'services': return <ServicesBlock key={key} {...props} />
    case 'bio': return <BioBlock key={key} {...props} />
    case 'lead_form': return <LeadFormBlock key={key} {...props} cardId={templateId} />
    case 'business_hours': return <BusinessHoursBlock key={key} {...props} />
    case 'cta_buttons': return <CTAButtonsBlock key={key} {...props} />
    case 'info_utilities': return <InfoUtilitiesBlock key={key} {...props} />
    case 'free_text': return <FreeTextBlock key={key} {...props} />
    case 'decoration': return <DecorationBlock key={key} {...props} />
    default: return null
  }
}


export default function TemplateMiniPreview({ template, height = 480 }: Props) {
  const fixedThemeJson = useMemo(() => {
    return fixBackgroundForPreview(template.theme_json)
  }, [template.theme_json])

  const blocks = useMemo(() => {
    if (!Array.isArray(template.preview_json)) return []
    return template.preview_json.map((block: any, index: number) => ({
      id: `preview-${index}`,
      type: block.type || 'unknown',
      settings: block.settings || {},
      style: block.style || {},
      enabled: block.enabled !== false,
    }))
  }, [template])

  const cardBg = useMemo(() => {
    return migrateCardBg(fixedThemeJson?.background)
  }, [fixedThemeJson])

  if (blocks.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        Sem preview
      </div>
    )
  }

  const scale = height / 880
  const phoneInnerHeight = 880 - 52

  return (
    <div style={{
      height,
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: 12,
      position: 'relative',
    }}>
      <div style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}>
        <PhoneFrame>
          <div style={{
            height: phoneInnerHeight,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            <ThemeProvider theme={fixedThemeJson || {}}>
              <CardBackground
                bg={cardBg}
                style={{
                  minHeight: phoneInnerHeight,
                  padding: 0,
                  width: '100%',
                }}
              >
                <div style={{ 
                  padding: '0 16px',
                  maxWidth: 420,
                  margin: '0 auto',
                }}>
                  {blocks.map((block, index) => renderBlock(block, index, template.id))}
                </div>
              </CardBackground>
            </ThemeProvider>
          </div>
        </PhoneFrame>
      </div>
    </div>
  )
}
