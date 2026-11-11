type NamedMagnet = { magnet_type: string; title: string; internal_name?: string | null }

/** Dashboard-only name. Public consumers must continue to use their existing fields. */
export function getInternalName(magnet: NamedMagnet): string {
  return magnet.magnet_type === 'webinar' ? magnet.internal_name ?? magnet.title : magnet.title
}

/** Avoid rewriting public content or configuration when only the internal name changed. */
export function webinarUpdatePayload(
  proposed: Record<string, unknown>,
  saved: object,
): Record<string, unknown> {
  const previous = saved as Record<string, unknown>
  return Object.fromEntries(Object.entries(proposed).filter(([key, value]) => {
    if (key === 'title') return false
    if (key === 'cover_image_url') {
      return proposed.capture_page_image !== previous.capture_page_image
    }
    return key === 'updated_at' || JSON.stringify(value) !== JSON.stringify(previous[key])
  }))
}
