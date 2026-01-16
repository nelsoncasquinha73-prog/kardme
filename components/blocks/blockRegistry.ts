import type React from 'react'

import ContactBlock from '@/components/blocks/ContactBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'
import HeaderBlock from '@/components/blocks/HeaderBlock'

export const blockRegistry = {
  header: HeaderBlock,
  contact: ContactBlock,
  decorations: DecorationBlock,
  services: ServicesBlock,
  lead_form: LeadFormBlock,
  business_hours: BusinessHoursBlock,
}
export type BlockType = keyof typeof blockRegistry
