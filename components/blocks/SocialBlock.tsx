'use client'

import React from 'react'
import {
  FaInstagram,
  FaFacebook,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
  FaWhatsapp,
  FaPinterest,
  FaSnapchat,
  FaReddit,
  FaTumblr,
} from 'react-icons/fa'
import { FaTiktok } from 'react-icons/fa6'
import { SiTelegram } from 'react-icons/si'

const ICONS_MAP: Record<string, React.ElementType> = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  linkedin: FaLinkedin,
  twitter: FaTwitter,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  telegram: SiTelegram,
  pinterest: FaPinterest,
  snapchat: FaSnapchat,
  reddit: FaReddit,
  tumblr: FaTumblr,
  tiktok: FaTiktok,
}


export type SocialChannel = keyof typeof ICONS_MAP

export type SocialItem = {
  uid: string
  id?: SocialChannel | null
  enabled?: boolean
  url: string
  label?: string
  iconColor?: string
}

export type SocialSettings = {
  items: SocialItem[]
  layout?: {
    direction?: 'row' | 'column'
    align?: 'left' | 'center' | 'right'
    gapPx?: number
  }
  showLabel?: boolean
}

export type SocialStyle = {
  iconSizePx?: number
  container?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
  }
  button?: {
    enabled?: boolean
    bgColor?: string
    radius?: number
    padding?: number
    shadow?: boolean
    borderWidth?: number
    borderColor?: string
    iconColor?: string
    textColor?: string
  }
}

function containerStyleFromJson(style: SocialStyle['container']): React.CSSProperties {
  const s = style || {}
  const enabled = s.enabled !== false

  return {
    backgroundColor: enabled ? (s.bgColor ?? 'transparent') : 'transparent',
    borderRadius: s.radius != null ? `${s.radius}px` : undefined,
    padding: s.padding != null ? `${s.padding}px` : '8px',
    boxShadow: s.shadow ? '0 10px 30px rgba(0,0,0,0.14)' : undefined,
    borderStyle: s.borderWidth ? 'solid' : undefined,
    borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
    borderColor: s.borderColor ?? undefined,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  }
}

function ensureUid(item: any, index: number) {
  if (item?.uid && typeof item.uid === 'string') return item.uid
  return `social-${item?.id ?? 'x'}-${index}-${(item?.url ?? '').slice(0, 20)}`
}

function inferIdFromUrl(url: string): SocialChannel | null {
  const u = (url || '').toLowerCase()
  if (u.includes('instagram.com')) return 'instagram'
  if (u.includes('facebook.com')) return 'facebook'
  if (u.includes('linkedin.com')) return 'linkedin'
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter'
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube'
  if (u.includes('whatsapp.com') || u.includes('wa.me')) return 'whatsapp'
  if (u.includes('telegram.me') || u.includes('t.me')) return 'telegram'
  if (u.includes('pinterest.com')) return 'pinterest'
  if (u.includes('snapchat.com')) return 'snapchat'
  if (u.includes('reddit.com')) return 'reddit'
  if (u.includes('tumblr.com')) return 'tumblr'
  if (u.includes('tiktok.com')) return 'tiktok'
  return null
}

export default function SocialBlock({ settings, style }: { settings: SocialSettings; style?: SocialStyle }) {
  const s = settings || { items: [] }
  const st = style || {}

  const layout = s.layout || {}
  const direction = layout.direction ?? 'row'
  const gapPx = layout.gapPx ?? 12
  const align = layout.align ?? 'center'

  const containerStyle = containerStyleFromJson(st.container)

  const iconSize = st.iconSizePx ?? 28

  const btn = st.button || {}
  const btnEnabled = btn.enabled ?? true
  const btnPadding = btnEnabled ? (btn.padding ?? 10) : 0
  const btnRadius = btnEnabled ? (btn.radius ?? 999) : 0
  const btnBg = btnEnabled ? (btn.bgColor ?? 'rgba(255,255,255,0.18)') : 'transparent'
  const btnBorderWidth = btnEnabled ? (btn.borderWidth ?? 1) : 0
  const btnBorderColor = btnEnabled ? (btn.borderColor ?? 'rgba(255,255,255,0.22)') : 'transparent'
  const btnShadow = btnEnabled && (btn.shadow ?? true) ? '0 10px 24px rgba(0,0,0,0.18)' : undefined

  const normalized = (s.items || []).map((item, index) => {
    const id = item.id ?? inferIdFromUrl(item.url)
    const enabled = item.enabled ?? true
    const uid = ensureUid(item, index)
    return { ...item, uid, id, enabled }
  })

  const visibleItems = normalized.filter((item) => item.enabled && item.url && item.url.trim() !== '' && !!item.id)
  if (visibleItems.length === 0) return null

  const buttonBox = iconSize + btnPadding * 2

  return (
    <section style={{ ...containerStyle, flexDirection: direction, justifyContent: align, gap: gapPx }}>
      {visibleItems.map((item) => {
        const IconComponent = ICONS_MAP[item.id as SocialChannel]
        if (!IconComponent) return null

        const iconColor = item.iconColor ?? btn.iconColor ?? 'currentColor'

        return (
          <a
            key={item.uid}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            style={{
              width: btnEnabled && s.showLabel !== false ? 'auto' : buttonBox,
              height: buttonBox,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: btnRadius,
              background: btnBg,
              border: btnBorderWidth ? `${btnBorderWidth}px solid ${btnBorderColor}` : 'none',
              boxShadow: btnShadow,
              color: iconColor,
              textDecoration: 'none',
              cursor: 'pointer',
              gap: s.showLabel === false ? 0 : 8,
              padding: btnEnabled ? `0 ${btnPadding}px` : 0,
              transition: 'transform 120ms ease, background-color 120ms ease',
            }}
          >
            <IconComponent size={iconSize} color={iconColor} style={{ color: iconColor }} />
            {s.showLabel !== false && (
              <span style={{ fontWeight: 600, fontSize: 14, color: btn.textColor ?? iconColor }}>
                {item.label ?? item.id}
              </span>
            )}
          </a>
        )
      })}
    </section>
  )
}
