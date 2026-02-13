'use client'

import { useRef, useState } from 'react'
import { ProfileSettings } from '@/components/blocks/types/profile'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import { uploadCardImage } from '@/lib/uploadCardImage'
import ColorPickerPro from '@/components/editor/ColorPickerPro'
import FontPicker from '@/components/editor/FontPicker'
import { useLanguage } from '@/components/language/LanguageProvider'

type Props = {
  cardId: string
  settings: ProfileSettings
  onChange: (settings: ProfileSettings) => void
}

type LayoutWithAlign = {
  lineGap?: number
  align?: 'left' | 'center' | 'right'
}

function normalize(input: Partial<ProfileSettings>): ProfileSettings {
  return {
    enabled: input.enabled ?? true,
    layout: {
      lineGap: input.layout?.lineGap ?? 10,
      align: (input.layout && 'align' in input.layout ? input.layout.align : 'center') as 'left' | 'center' | 'right',
    } as LayoutWithAlign,
    avatar: {
      enabled: input.avatar?.enabled ?? true,
      image: input.avatar?.image ?? '',
      shape: input.avatar?.shape ?? 'circle',
      size: input.avatar?.size ?? 'md',
      borderWidth: input.avatar?.borderWidth ?? 3,
      borderColor: input.avatar?.borderColor ?? 'rgba(255,255,255,0.85)',
      offsetX: input.avatar?.offsetX ?? 0,
      offsetY: input.avatar?.offsetY ?? null,
      sizePx: input.avatar?.sizePx ?? undefined,
      glow: input.avatar?.glow ?? undefined,
      shadow: input.avatar?.shadow ?? undefined,
      effect3d: input.avatar?.effect3d ?? undefined,
    },
    name: {
      enabled: input.name?.enabled ?? true,
      text: input.name?.text ?? '',
      size: input.name?.size ?? 'md',
      color: input.name?.color ?? '#0B1220',
      style: {
        fontFamily: input.name?.style?.fontFamily,
        fontWeight: input.name?.style?.fontWeight ?? 700,
      },
    },
    profession: {
      enabled: input.profession?.enabled ?? false,
      text: input.profession?.text ?? '',
      size: input.profession?.size ?? 'sm',
      color: input.profession?.color ?? '#374151',
      style: {
        fontFamily: input.profession?.style?.fontFamily,
        fontWeight: input.profession?.style?.fontWeight ?? 400,
      },
    },
    company: {
      enabled: input.company?.enabled ?? true,
      text: input.company?.text ?? '',
      size: input.company?.size ?? 'sm',
      color: input.company?.color ?? '#6B7280',
      style: {
        fontFamily: input.company?.style?.fontFamily,
        fontWeight: input.company?.style?.fontWeight ?? 400,
      },
    },
    typography: {
      fontFamily: input.typography?.fontFamily ?? 'System',
    },
    background: {
      enabled: input.background?.enabled ?? false,
      color: input.background?.color ?? '#FFFFFF',
      style: input.background?.style ?? 'rounded',
    },
    offset: {
      x: input.offset?.x ?? 0,
      y: input.offset?.y ?? 0,
    },
  }
}

export default function ProfileBlockEditor({ cardId, settings, onChange }: Props) {
  const [local, setLocal] = useState<ProfileSettings>(() => normalize(settings))
  const [uploading, setUploading] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('avatar')
  const avatarRef = useRef<HTMLInputElement>(null)

  const localRef = useRef(local)
  localRef.current = local
  const { t } = useLanguage()
  const { openPicker } = useColorPicker()


  function patch(fn: (d: ProfileSettings) => void) {
    try {
      const next = structuredClone(localRef.current)
      fn(next)
      setLocal(next)
      onChange(next)
    } catch (err) {
      console.error('❌ ProfileBlock patch error:', err)
      console.error('localRef.current:', localRef.current)
      // Fallback: tentar normalizar e aplicar novamente
      try {
        const normalized = normalize(localRef.current)
        const next = structuredClone(normalized)
        fn(next)
        setLocal(next)
        onChange(next)
      } catch (err2) {
        console.error('❌ ProfileBlock patch fallback failed:', err2)
        alert('Erro ao atualizar ProfileBlock. Por favor refresca a página.')
      }
    }
  }
  function pickEyedropper(apply: (hex: string) => void) {
    openPicker({ mode: 'eyedropper', onPick: apply })
  }

  async function onPickAvatar(file: File) {
    setUploading(true)
    try {
      const { publicUrl } = await uploadCardImage({ cardId, file, kind: 'avatar' })
      patch((d) => {
        d.avatar = d.avatar || ({} as any)
        d.avatar!.enabled = true
        d.avatar!.image = publicUrl
      })
    } catch (err: any) {
      console.error(err)
      alert(err?.message || 'Erro no upload do avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input
        ref={avatarRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPickAvatar(f)
        }}
      />

      {/* ========== SECÇÃO 1: AVATAR ========== */}
      <CollapsibleSection
        title={`👤 ${t('profile_editor.section_avatar')}`}
        subtitle={t('profile_editor.section_avatar_subtitle')}
        isOpen={activeSection === 'avatar'}
        onToggle={() => setActiveSection(activeSection === 'avatar' ? null : 'avatar')}
      >
        <Row label={t('profile_editor.label_show_avatar')}>
          <Toggle
            active={local.avatar?.enabled ?? false}
            onClick={() => patch((d) => (d.avatar!.enabled = !(d.avatar?.enabled ?? false)))}
          />
        </Row>

        {(local.avatar?.enabled ?? false) && (
          <>
            <Row label={t('profile_editor.label_image')}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button onClick={() => avatarRef.current?.click()}>
                  {uploading ? t('profile_editor.button_uploading') : `📷 ${t('profile_editor.button_change')}`}
                </Button>
                {local.avatar?.image && (
                  <img
                    src={local.avatar.image}
                    alt="Avatar"
                    style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(0,0,0,0.1)' }}
                  />
                )}
              </div>
            </Row>

            <Row label={t('profile_editor.label_size')}>
              <input
                type="range"
                min={48}
                max={200}
                step={4}
                value={local.avatar?.sizePx ?? 108}
                onChange={(e) => patch((d) => (d.avatar!.sizePx = Number(e.target.value)))}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.avatar?.sizePx ?? 108}px</span>
            </Row>

            <Row label={t('profile_editor.label_shape')}>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['circle', 'rounded', 'square'] as const).map((shape) => (
                  <MiniButton
                    key={shape}
                    active={local.avatar?.shape === shape}
                    onClick={() => patch((d) => (d.avatar!.shape = shape))}
                  >
                    <ShapeIcon kind={shape} />
                  </MiniButton>
                ))}
              </div>
            </Row>

            <Row label={t('profile_editor.label_border')}>
              <input
                type="range"
                min={0}
                max={12}
                step={1}
                value={local.avatar?.borderWidth ?? 0}
                onChange={(e) => patch((d) => (d.avatar!.borderWidth = Number(e.target.value)))}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.avatar?.borderWidth ?? 0}px</span>
            </Row>

            {(local.avatar?.borderWidth ?? 0) > 0 && (
              <Row label={t('profile_editor.label_border_color')}>
                <ColorPickerPro
                  value={local.avatar?.borderColor ?? '#FFFFFF'}
                  onChange={(hex) => patch((d) => (d.avatar!.borderColor = hex))}
                  onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.avatar!.borderColor = hex)))}
                />
              </Row>
            )}

            <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

            <Row label={t('profile_editor.label_position_x')}>
              <input
                type="range"
                min={-50}
                max={50}
                step={2}
                value={local.avatar?.offsetX ?? 0}
                onChange={(e) => patch((d) => (d.avatar!.offsetX = Number(e.target.value)))}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.avatar?.offsetX ?? 0}px</span>
            </Row>

            <Row label={t('profile_editor.label_position_y')}>
              <input
                type="range"
                min={-80}
                max={80}
                step={2}
                value={local.avatar?.offsetY ?? 0}
                onChange={(e) => patch((d) => (d.avatar!.offsetY = Number(e.target.value)))}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.avatar?.offsetY ?? 0}px</span>
            </Row>

            <Row label="">
              <Button onClick={() => patch((d) => { d.avatar!.offsetX = 0; d.avatar!.offsetY = null })}>
                Reset posição
              </Button>
            </Row>
          </>
        )}
      </CollapsibleSection>

      {/* ========== SECÇÃO 2: EFEITOS DO AVATAR ========== */}
      <CollapsibleSection
        title={`✨ ${t('profile_editor.section_effects')}`}
        subtitle={t('profile_editor.section_effects_subtitle')}
        isOpen={activeSection === 'effects'}
        onToggle={() => setActiveSection(activeSection === 'effects' ? null : 'effects')}
      >
        {/* GLOW */}
        <Row label={t('profile_editor.label_glow')}>
          <Toggle
            active={(local.avatar?.glow as any)?.enabled ?? false}
            onClick={() => patch((d) => {
              d.avatar = d.avatar || {}
              d.avatar.glow = d.avatar.glow || { enabled: false, color: 'rgba(59,130,246,0.25)', size: 8 }
              d.avatar.glow.enabled = !d.avatar.glow.enabled
            })}
          />
        </Row>

        {((local.avatar?.glow as any)?.enabled ?? false) && (
          <>
            <Row label={t('profile_editor.label_glow_size')}>
              <input
                type="range"
                min={2}
                max={30}
                step={1}
                value={(local.avatar?.glow as any)?.size ?? 8}
                onChange={(e) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.glow = d.avatar.glow || { enabled: true, color: 'rgba(59,130,246,0.25)', size: 8 }
                  d.avatar.glow.size = Number(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{(local.avatar?.glow as any)?.size ?? 8}px</span>
            </Row>

            <Row label={t('profile_editor.label_glow_color')}>
              <ColorPickerPro
                value={(local.avatar?.glow as any)?.color ?? 'rgba(59,130,246,0.25)'}
                onChange={(hex) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.glow = d.avatar.glow || { enabled: true, color: 'rgba(59,130,246,0.25)', size: 8 }
                  d.avatar.glow.color = hex
                })}
                onEyedropper={() => pickEyedropper((hex) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.glow = d.avatar.glow || { enabled: true, color: 'rgba(59,130,246,0.25)', size: 8 }
                  d.avatar.glow.color = hex
                }))}
              />
            </Row>
          </>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        {/* SOMBRA */}
        <Row label={t('profile_editor.label_shadow')}>
          <Toggle
            active={(local.avatar?.shadow as any)?.enabled ?? false}
            onClick={() => patch((d) => {
              d.avatar = d.avatar || {}
              d.avatar.shadow = d.avatar.shadow || { enabled: false, intensity: 0.2 }
              d.avatar.shadow.enabled = !d.avatar.shadow.enabled
            })}
          />
        </Row>

        {((local.avatar?.shadow as any)?.enabled ?? false) && (
          <Row label={t('profile_editor.label_intensity')}>
            <input
              type="range"
              min={0}
              max={0.8}
              step={0.05}
              value={(local.avatar?.shadow as any)?.intensity ?? 0.2}
              onChange={(e) => patch((d) => {
                d.avatar = d.avatar || {}
                d.avatar.shadow = d.avatar.shadow || { enabled: true, intensity: 0.2 }
                d.avatar.shadow.intensity = Number(e.target.value)
              })}
              style={{ flex: 1 }}
            />
            <span style={rightNum}>{Math.round(((local.avatar?.shadow as any)?.intensity ?? 0.2) * 100)}%</span>
          </Row>
        )}

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        {/* EFEITO 3D */}
        <Row label={t('profile_editor.label_effect_3d')}>
          <Toggle
            active={(local.avatar?.effect3d as any)?.enabled ?? false}
            onClick={() => patch((d) => {
              d.avatar = d.avatar || {}
              d.avatar.effect3d = d.avatar.effect3d || { enabled: false, bgColor: '#ffffff', scale: 1.15 }
              d.avatar.effect3d.enabled = !d.avatar.effect3d.enabled
            })}
          />
        </Row>

        {((local.avatar?.effect3d as any)?.enabled ?? false) && (
          <>
            <Row label={t('profile_editor.label_frame_color')}>
              <ColorPickerPro
                value={(local.avatar?.effect3d as any)?.bgColor ?? '#ffffff'}
                onChange={(hex) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.effect3d = d.avatar.effect3d || { enabled: true, bgColor: '#ffffff', scale: 1.15 }
                  d.avatar.effect3d.bgColor = hex
                })}
                onEyedropper={() => pickEyedropper((hex) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.effect3d = d.avatar.effect3d || { enabled: true, bgColor: '#ffffff', scale: 1.15 }
                  d.avatar.effect3d.bgColor = hex
                }))}
              />
            </Row>

            <Row label={t('profile_editor.label_scale')}>
              <input
                type="range"
                min={1}
                max={1.5}
                step={0.05}
                value={(local.avatar?.effect3d as any)?.scale ?? 1.15}
                onChange={(e) => patch((d) => {
                  d.avatar = d.avatar || {}
                  d.avatar.effect3d = d.avatar.effect3d || { enabled: true, bgColor: '#ffffff', scale: 1.15 }
                  d.avatar.effect3d.scale = Number(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{((local.avatar?.effect3d as any)?.scale ?? 1.15).toFixed(2)}x</span>
            </Row>
          </>
        )}

        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>
          {t('profile_editor.tip_one_effect')}
        </div>
      </CollapsibleSection>

      {/* ========== SECÇÃO 3: IDENTIDADE ========== */}
      <CollapsibleSection
        title={`📝 ${t('profile_editor.section_identity')}`}
        subtitle={t('profile_editor.section_identity_subtitle')}
        isOpen={activeSection === 'identity'}
        onToggle={() => setActiveSection(activeSection === 'identity' ? null : 'identity')}
      >
        {/* NOME */}
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label={t('profile_editor.label_name')}>
            <Toggle
              active={local.name?.enabled ?? true}
              onClick={() => patch((d) => (d.name.enabled = !(d.name?.enabled ?? true)))}
            />
          </Row>

          <input
            type="text"
            value={local.name?.text ?? ''}
            onChange={(e) => patch((d) => (d.name.text = e.target.value))}
            placeholder={t('profile_editor.placeholder_full_name')}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <FontPicker value={local.name?.style?.fontFamily ?? ""} onChange={(v) => patch((d) => { d.name.style = d.name.style || {}; d.name.style.fontFamily = v || undefined })} />

            <SegmentedSize
              value={(local.name?.size ?? 'md') as 'sm' | 'md' | 'lg'}
              onChange={(s) => patch((d) => (d.name.size = s))}
            />

            <MiniButton
              active={(local.name?.style?.fontWeight ?? 700) === 700}
              onClick={() => patch((d) => {
                d.name.style = d.name.style || {}
                d.name.style.fontWeight = d.name.style.fontWeight === 700 ? 400 : 700
              })}
            >
              B
            </MiniButton>
          </div>

          <Row label={t('profile_editor.label_color')}>
            <ColorPickerPro
              value={local.name?.color ?? '#0B1220'}
              onChange={(hex) => patch((d) => (d.name.color = hex))}
              onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.name.color = hex)))}
            />
          </Row>
        </div>

        {/* PROFISSÃO */}
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label={t('profile_editor.label_profession')}>
            <Toggle
              active={local.profession?.enabled ?? false}
              onClick={() => patch((d) => (d.profession.enabled = !(d.profession?.enabled ?? false)))}
            />
          </Row>

          <input
            type="text"
            value={local.profession?.text ?? ''}
            onChange={(e) => patch((d) => {
              d.profession.text = e.target.value
              if (e.target.value.trim()) d.profession.enabled = true
            })}
            placeholder={t('profile_editor.placeholder_profession')}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <FontPicker value={local.profession?.style?.fontFamily ?? ""} onChange={(v) => patch((d) => { d.profession.style = d.profession.style || {}; d.profession.style.fontFamily = v || undefined })} />

            <SegmentedSize
              value={(local.profession?.size ?? 'sm') as 'sm' | 'md' | 'lg'}
              onChange={(s) => patch((d) => (d.profession.size = s))}
            />

            <MiniButton
              active={(local.profession?.style?.fontWeight ?? 400) === 700}
              onClick={() => patch((d) => {
                d.profession.style = d.profession.style || {}
                d.profession.style.fontWeight = d.profession.style.fontWeight === 700 ? 400 : 700
              })}
            >
              B
            </MiniButton>
          </div>

          <Row label={t('profile_editor.label_color')}>
            <ColorPickerPro
              value={local.profession?.color ?? '#374151'}
              onChange={(hex) => patch((d) => (d.profession.color = hex))}
              onEyedropper={() => pickEyedropper((hex) => patch((d) => (d.profession.color = hex)))}
            />
          </Row>
        </div>

        {/* EMPRESA */}
        <div style={{ padding: 12, background: 'rgba(0,0,0,0.02)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Row label={t('profile_editor.label_company')}>
            <Toggle
              active={local.company?.enabled ?? true}
              onClick={() => patch((d) => {
                d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
                d.company.enabled = !d.company.enabled
              })}
            />
          </Row>

          <input
            type="text"
            value={local.company?.text ?? ''}
            onChange={(e) => patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.text = e.target.value
              if (e.target.value.trim()) d.company.enabled = true
            })}
            placeholder={t('profile_editor.placeholder_company')}
            style={inputStyle}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <FontPicker value={local.company?.style?.fontFamily ?? ""} onChange={(v) => patch((d) => { d.company = d.company || { enabled: true, text: "", size: "sm", color: "#6B7280" }; d.company.style = d.company.style || {}; d.company.style.fontFamily = v || undefined })} />

            <SegmentedSize
              value={(local.company?.size ?? 'sm') as 'sm' | 'md' | 'lg'}
              onChange={(s) => patch((d) => {
                d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
                d.company.size = s
              })}
            />

            <MiniButton
              active={(local.company?.style?.fontWeight ?? 400) === 700}
              onClick={() => patch((d) => {
                d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
                d.company.style = d.company.style || {}
                d.company.style.fontWeight = d.company.style.fontWeight === 700 ? 400 : 700
              })}
            >
              B
            </MiniButton>
          </div>

          <Row label={t('profile_editor.label_color')}>
            <ColorPickerPro
              value={local.company?.color ?? '#6B7280'}
              onChange={(hex) => patch((d) => {
                d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
                d.company.color = hex
              })}
              onEyedropper={() => pickEyedropper((hex) => patch((d) => {
                d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
                d.company.color = hex
              }))}
            />
          </Row>
        </div>

        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 0' }} />

        <Row label={t('profile_editor.label_alignment')}>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['left', 'center', 'right'] as const).map((align) => (
              <MiniButton
                key={align}
                active={((local.layout as any)?.align ?? 'center') === align}
                onClick={() => patch((d) => {
                  d.layout = d.layout || {}
                  ;(d.layout as any).align = align
                })}
              >
                {align === 'left' ? '◀' : align === 'center' ? '●' : '▶'}
              </MiniButton>
            ))}
          </div>
        </Row>

        <Row label={t('profile_editor.label_line_spacing')}>
          <input
            type="range"
            min={0}
            max={24}
            step={2}
            value={local.layout?.lineGap ?? 10}
            onChange={(e) => patch((d) => {
              d.layout = d.layout || {}
              ;(d.layout as any).lineGap = Number(e.target.value)
            })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{local.layout?.lineGap ?? 10}px</span>
        </Row>
      </CollapsibleSection>

      {/* ========== SECÇÃO 4: CONTAINER ========== */}
      <CollapsibleSection
        title={`📦 ${t('profile_editor.section_container')}`}
        subtitle={t('profile_editor.section_container_subtitle')}
        isOpen={activeSection === 'container'}
        onToggle={() => setActiveSection(activeSection === 'container' ? null : 'container')}
      >
        <Row label={t('profile_editor.label_enable_container')}>
          <Toggle
            active={local.container?.enabled ?? false}
            onClick={() => patch((d) => {
              d.container = d.container || {}
              d.container.enabled = !(d.container.enabled ?? false)
            })}
          />
        </Row>

        {(local.container?.enabled ?? false) && (
          <>
            <Row label={t('profile_editor.label_bg_color')}>
              <ColorPickerPro
                value={local.container?.bgColor ?? '#ffffff'}
                onChange={(hex) => patch((d) => {
                  d.container = d.container || {}
                  d.container.bgColor = hex
                })}
                onEyedropper={() => pickEyedropper((hex) => patch((d) => {
                  d.container = d.container || {}
                  d.container.bgColor = hex
                }))}
              />
            </Row>

            <Row label={t('profile_editor.label_shadow')}>
              <Toggle
                active={local.container?.shadow ?? false}
                onClick={() => patch((d) => {
                  d.container = d.container || {}
                  d.container.shadow = !(d.container.shadow ?? false)
                })}
              />
            </Row>

            <Row label={t('profile_editor.label_border')}>
              <Toggle
                active={(local.container?.borderWidth ?? 0) > 0}
                onClick={() => patch((d) => {
                  d.container = d.container || {}
                  d.container.borderWidth = (d.container.borderWidth ?? 0) > 0 ? 0 : 1
                })}
              />
            </Row>

            {(local.container?.borderWidth ?? 0) > 0 && (
              <>
                <Row label={t('profile_editor.label_thickness')}>
                  <input
                    type="range"
                    min={1}
                    max={6}
                    step={1}
                    value={local.container?.borderWidth ?? 1}
                    onChange={(e) => patch((d) => {
                      d.container = d.container || {}
                      d.container.borderWidth = Number(e.target.value)
                    })}
                    style={{ flex: 1 }}
                  />
                  <span style={rightNum}>{local.container?.borderWidth ?? 1}px</span>
                </Row>

                <Row label={t('profile_editor.label_border_color')}>
                  <ColorPickerPro
                    value={local.container?.borderColor ?? 'rgba(0,0,0,0.12)'}
                    onChange={(hex) => patch((d) => {
                      d.container = d.container || {}
                      d.container.borderColor = hex
                    })}
                    onEyedropper={() => pickEyedropper((hex) => patch((d) => {
                      d.container = d.container || {}
                      d.container.borderColor = hex
                    }))}
                  />
                </Row>
              </>
            )}

            <Row label={t('profile_editor.label_radius')}>
              <input
                type="range"
                min={0}
                max={32}
                step={2}
                value={local.container?.radius ?? 16}
                onChange={(e) => patch((d) => {
                  d.container = d.container || {}
                  d.container.radius = Number(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.container?.radius ?? 16}px</span>
            </Row>

            <Row label={t('profile_editor.label_padding')}>
              <input
                type="range"
                min={0}
                max={32}
                step={2}
                value={local.container?.padding ?? 12}
                onChange={(e) => patch((d) => {
                  d.container = d.container || {}
                  d.container.padding = Number(e.target.value)
                })}
                style={{ flex: 1 }}
              />
              <span style={rightNum}>{local.container?.padding ?? 12}px</span>
            </Row>

            <Row label={t('profile_editor.label_width')}>
              <select
                value={local.container?.widthMode ?? 'full'}
                onChange={(e) => patch((d) => {
                  d.container = d.container || {}
                  d.container.widthMode = e.target.value as any
                })}
                style={selectStyle}
              >
                <option value="full">100%</option>
                <option value="custom">Personalizada</option>
              </select>
            </Row>

            {local.container?.widthMode === 'custom' && (
              <Row label={t('profile_editor.label_width_px')}>
                <input
                  type="range"
                  min={200}
                  max={400}
                  step={10}
                  value={local.container?.customWidthPx ?? 320}
                  onChange={(e) => patch((d) => {
                    d.container = d.container || {}
                    d.container.customWidthPx = Number(e.target.value)
                  })}
                  style={{ flex: 1 }}
                />
                <span style={rightNum}>{local.container?.customWidthPx ?? 320}px</span>
              </Row>
            )}
          </>
        )}

        {!(local.container?.enabled ?? false) && (
          <div style={{ fontSize: 11, opacity: 0.6 }}>
            {t('profile_editor.tip_enable_container')}
          </div>
        )}
      </CollapsibleSection>

      {/* ========== SECÇÃO 5: LAYOUT & POSIÇÃO ========== */}
      <CollapsibleSection
        title={`📐 ${t('profile_editor.section_position')}`}
        subtitle={t('profile_editor.section_position_subtitle')}
        isOpen={activeSection === 'position'}
        onToggle={() => setActiveSection(activeSection === 'position' ? null : 'position')}
      >
        <Row label={t('profile_editor.label_offset_x')}>
          <input
            type="range"
            min={-80}
            max={80}
            step={2}
            value={local.offset?.x ?? 0}
            onChange={(e) => patch((d) => {
              d.offset = d.offset || { x: 0, y: 0 }
              d.offset.x = Number(e.target.value)
            })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{local.offset?.x ?? 0}px</span>
        </Row>

        <Row label={t('profile_editor.label_offset_y')}>
          <input
            type="range"
            min={-80}
            max={80}
            step={2}
            value={local.offset?.y ?? 0}
            onChange={(e) => patch((d) => {
              d.offset = d.offset || { x: 0, y: 0 }
              d.offset.y = Number(e.target.value)
            })}
            style={{ flex: 1 }}
          />
          <span style={rightNum}>{local.offset?.y ?? 0}px</span>
        </Row>

        <Row label="">
          <Button onClick={() => patch((d) => { d.offset = { x: 0, y: 0 } })}>
            Reset posição
          </Button>
        </Row>

        <div style={{ fontSize: 11, opacity: 0.6 }}>
          {t('profile_editor.tip_offset')}
        </div>
      </CollapsibleSection>

    </div>
  )
}

// =======================
// Componentes auxiliares
// =======================

const rightNum: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  minWidth: 45,
  textAlign: 'right',
}

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontWeight: 600,
  fontSize: 12,
  minWidth: 100,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  fontSize: 13,
  fontWeight: 500,
}

function CollapsibleSection({ title, subtitle, isOpen, onToggle, children }: {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>{subtitle}</div>}
        </div>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: 'rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            transition: 'transform 0.2s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▼
        </div>
      </button>
      {isOpen && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.8 }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
    </div>
  )
}

function Button({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 12,
        border: '1px solid rgba(0,0,0,0.10)',
        background: '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 12,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function MiniButton({ children, onClick, active }: { children: React.ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        border: active ? '2px solid #3b82f6' : '1px solid rgba(0,0,0,0.10)',
        background: active ? 'rgba(59,130,246,0.1)' : '#fff',
        cursor: 'pointer',
        fontWeight: 700,
        fontSize: 11,
        color: active ? '#3b82f6' : '#333',
        transition: 'all 0.15s',
        minWidth: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

function Toggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: active ? '#3b82f6' : '#e5e7eb',
        position: 'relative',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: active ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  )
}

function ShapeIcon({ kind }: { kind: 'circle' | 'rounded' | 'square' }) {
  const base: React.CSSProperties = {
    width: 16,
    height: 16,
    background: 'currentColor',
  }
  if (kind === 'circle') return <span style={{ ...base, borderRadius: 999 }} />
  if (kind === 'rounded') return <span style={{ ...base, borderRadius: 4 }} />
  return <span style={{ ...base, borderRadius: 0 }} />
}

function SegmentedSize({ value, onChange }: { value: 'sm' | 'md' | 'lg'; onChange: (s: 'sm' | 'md' | 'lg') => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 10, border: '1px solid rgba(0,0,0,0.10)', background: '#fff' }}>
      {(['sm', 'md', 'lg'] as const).map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          style={{
            height: 24,
            minWidth: 28,
            padding: '0 8px',
            borderRadius: 8,
            border: value === s ? '1px solid rgba(0,0,0,0.18)' : '1px solid transparent',
            background: value === s ? '#0B1220' : 'transparent',
            color: value === s ? '#fff' : '#0B1220',
            fontSize: 10,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {s.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
