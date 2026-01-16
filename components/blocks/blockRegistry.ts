import type React from 'react'

import ContactBlock from '@/components/blocks/ContactBlock'
import DecorationBlock from '@/components/blocks/DecorationBlock'
import ServicesBlock from '@/components/blocks/ServicesBlock'
import LeadFormBlock from '@/components/blocks/LeadFormBlock'
import BusinessHoursBlock from '@/components/blocks/BusinessHoursBlock'

export const blockRegistry: Record<string, React.ComponentType<any>> = {
  contact: ContactBlock,
  decorations: DecorationBlock,
  services: ServicesBlock,
  lead_form: LeadFormBlock,
  business_hours: BusinessHoursBlock,
}
