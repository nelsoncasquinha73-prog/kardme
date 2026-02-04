'use client'

import React from 'react'

export type BlockType =
  | 'header'
  | 'profile'
  | 'bio'
  | 'gallery'
  | 'services'
  | 'products'
  | 'social'
  | 'reviews'
  | 'embed'
  | 'lead_form'
  | 'booking'
  | 'video'

export function BlockIcon({
  type,
  size = 22,
}: {
  type: string
  size?: number
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    xmlns: 'http://www.w3.org/2000/svg',
    style: { display: 'block' as const },
  }

  switch (type as BlockType) {
    case 'header':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="6" rx="2" fill="#60A5FA" />
          <rect x="3" y="13" width="18" height="6" rx="2" fill="#DBEAFE" />
          <path d="M5 8h10" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M5 16h6" stroke="#1E3A8A" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )

    case 'profile':
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="4" fill="#C4B5FD" />
          <path
            d="M5.5 20c1.6-3.4 4.1-5 6.5-5s4.9 1.6 6.5 5"
            fill="#EDE9FE"
          />
          <path
            d="M8.2 9a3.8 3.8 0 1 0 7.6 0a3.8 3.8 0 1 0-7.6 0Z"
            stroke="#5B21B6"
            strokeWidth="1.8"
          />
          <path
            d="M5.5 20c1.6-3.4 4.1-5 6.5-5s4.9 1.6 6.5 5"
            stroke="#5B21B6"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'bio':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" fill="#FEF3C7" />
          <path d="M8 9h8" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 13h6" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M14.2 16.8l3.3-3.3c.3-.3.3-.8 0-1.1l-.9-.9c-.3-.3-.8-.3-1.1 0l-3.3 3.3-.4 1.8 2.4-.6Z"
            fill="#F59E0B"
            stroke="#92400E"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )

    case 'gallery':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="3" fill="#DCFCE7" />
          <path
            d="M7 15l3-3 3 3 2-2 2 2"
            stroke="#166534"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="9" cy="9" r="1.4" fill="#22C55E" />
          <rect x="4" y="5" width="16" height="14" rx="3" stroke="#166534" strokeWidth="1.6" />
        </svg>
      )


    case 'video':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="3" fill="#FEE2E2" />
          <polygon points="10,9 10,15 15,12" fill="#DC2626" />
          <rect x="4" y="6" width="16" height="12" rx="3" stroke="#DC2626" strokeWidth="1.6" />
        </svg>
      )
    case 'services':
      return (
        <svg {...common}>
          <rect x="5" y="7" width="14" height="12" rx="3" fill="#CFFAFE" />
          <path
            d="M9 7V6.2c0-.7.6-1.2 1.2-1.2h3.6c.7 0 1.2.6 1.2 1.2V7"
            stroke="#0E7490"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path d="M8 12h8" stroke="#0E7490" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 15h6" stroke="#0E7490" strokeWidth="1.8" strokeLinecap="round" />
          <rect x="5" y="7" width="14" height="12" rx="3" stroke="#0E7490" strokeWidth="1.6" />
        </svg>
      )

    case 'products':
      return (
        <svg {...common}>
          <path
            d="M7 10.2l5-3 5 3v7.3c0 .6-.5 1.1-1.1 1.1H8.1c-.6 0-1.1-.5-1.1-1.1v-7.3Z"
            fill="#FFEDD5"
          />
          <path
            d="M7 10.2l5-3 5 3"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 10.2v7.3c0 .6.5 1.1 1.1 1.1h7.8c.6 0 1.1-.5 1.1-1.1v-7.3"
            stroke="#9A3412"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 12h4" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )

    case 'social':
      return (
        <svg {...common}>
          <circle cx="8" cy="12" r="3" fill="#DBEAFE" />
          <circle cx="16" cy="8" r="3" fill="#BFDBFE" />
          <circle cx="16" cy="16" r="3" fill="#93C5FD" />
          <path
            d="M10.6 10.7l2.7-1.6M10.6 13.3l2.7 1.6"
            stroke="#1D4ED8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M8 15a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
            stroke="#1D4ED8"
            strokeWidth="1.6"
          />
          <path
            d="M16 11a3 3 0 1 0 0-6a3 3 0 0 0 0 6ZM16 19a3 3 0 1 0 0-6a3 3 0 0 0 0 6Z"
            stroke="#1D4ED8"
            strokeWidth="1.6"
          />
        </svg>
      )

    case 'reviews':
      return (
        <svg {...common}>
          <path
            d="M12 4.8l2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7L12 4.8Z"
            fill="#FEF9C3"
            stroke="#A16207"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 7.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4L12 7.2Z"
            fill="#FACC15"
            opacity="0.9"
          />
        </svg>
      )

    case 'embed':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="3" fill="#E2E8F0" />
          <path d="M10 10l-2 2 2 2" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 10l2 2-2 2" stroke="#334155" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.8 9l-1.6 6" stroke="#64748B" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="4" y="6" width="16" height="12" rx="3" stroke="#334155" strokeWidth="1.4" />
        </svg>
      )

    case 'lead_form':
      return (
        <svg {...common}>
          <rect x="5" y="4.8" width="14" height="14.4" rx="3" fill="#D1FAE5" />
          <path d="M8 9h8" stroke="#065F46" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M8 12.5h6" stroke="#065F46" strokeWidth="1.8" strokeLinecap="round" />
          <path
            d="M9 16l1.6 1.6L15.5 13"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="5" y="4.8" width="14" height="14.4" rx="3" stroke="#065F46" strokeWidth="1.4" />
        </svg>
      )

    case 'booking':
      return (
        <svg {...common}>
          <rect x="4.5" y="6.5" width="15" height="13" rx="3" fill="#FEE2E2" />
          <path d="M7.5 4.8v3" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M16.5 4.8v3" stroke="#991B1B" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M4.5 9.2h15" stroke="#991B1B" strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 12.2h3.2" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
          <rect x="4.5" y="6.5" width="15" height="13" rx="3" stroke="#991B1B" strokeWidth="1.4" />
        </svg>
      )

    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" fill="#E5E7EB" />
          <path d="M8 12h8" stroke="#374151" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
  }
}
