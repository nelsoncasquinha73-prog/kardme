import type React from 'react'

import ContactBlock from '@/components/blocks/ContactBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import HeaderBlock from '@/components/blocks/HeaderBlock'
import VideoBlock from '@/components/blocks/VideoBlock'
import ShapeCanvasBlock from '@/components/blocks/ShapeCanvasBlock'
import BannerBlock from '@/components/blocks/BannerBlock'

export const blockRegistry = {
  header: HeaderBlock,
  contact: ContactBlock,
  decorations: DecorationBlock,
  services: ServicesBlock,
  lead_form: LeadFormBlock,
  business_hours: BusinessHoursBlock,
  video: VideoBlock,
  shape_canvas: ShapeCanvasBlock,
  banner: BannerBlock,
}
export type BlockType = keyof typeof blockRegistry
