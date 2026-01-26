'use client'

import { useRef, useState } from 'react'
import { ProfileSettings } from '@/components/blocks/types/profile'
import { useColorPicker } from '@/components/editor/ColorPickerContext'
import { uploadCardImage } from '@/lib/uploadCardImage'
import SwatchRow from '@/components/editor/SwatchRow'
import { FONT_OPTIONS } from '@/lib/fontes'
import { Section } from '@/components/editor/ui'




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
      y: input.offset?.y ?? 0,
    },
  }
}

function stop(e: any) {
  e.preventDefault?.()
  e.stopPropagation?.()
}

const pillBtn: React.CSSProperties = {
  height: 26,
  minWidth: 26,
  padding: '0 10px',
  paddingTop: 0,
  paddingBottom: 0,
  borderRadius: 999,
  border: '1px solid rgba(0,0,0,0.12)',
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  lineHeight: '26px',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
  userSelect: 'none',
}

export default function ProfileBlockEditor({ cardId, settings, onChange }: Props) {
  const [local, setLocal] = useState<ProfileSettings>(() => normalize(settings))
  const [uploading, setUploading] = useState(false)
  const avatarRef = useRef<HTMLInputElement>(null)

  const { openPicker } = useColorPicker()

  function patch(fn: (d: ProfileSettings) => void) {
    const next = structuredClone(local)
    fn(next)
    setLocal(next)
    onChange(next)
  }

  function stepFromEvent(e: React.MouseEvent) {
    return e.shiftKey ? 10 : 2
  }

  function openEyedropperFor(target: 'name' | 'profession' | 'company') {
    openPicker({
      mode: 'eyedropper' as any,
      onPick: (hex: string) => {
        patch((d) => {
          d[target].color = hex
        })
      },
    } as any)
  }

  function openEyedropperBorder() {
    openPicker({
      mode: 'eyedropper' as any,
      onPick: (hex: string) => {
        patch((d) => {
          d.avatar!.borderColor = hex
        })
      },
    } as any)
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
    <div className="flex flex-col gap-3">
      <Section title="Avatar">
        <div className="flex justify-between items-center">
          <span className="text-sm">Mostrar avatar</span>
          <input
            type="checkbox"
            checked={local.avatar?.enabled ?? false}
            onChange={(e) => patch((d) => (d.avatar!.enabled = e.target.checked))}
          />
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            onClick={(e) => {
              stop(e)
              avatarRef.current?.click()
            }}
            className="h-7 rounded-xl border border-black/10 px-3"
            disabled={uploading}
          >
            {uploading ? 'A enviar...' : 'Alterar avatar'}
          </button>

          {local.avatar?.image ? (
            <img
              src={local.avatar.image}
              alt="Avatar preview"
              style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover' }}
            />
          ) : (
            <span className="text-xs text-black/50">Sem avatar</span>
          )}

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
        </div>

        <div className="flex flex-col gap-2">
  <div className="flex justify-between items-center">
    <span className="text-sm">Tamanho</span>
    <span className="text-xs text-black/50">{local.avatar?.sizePx ?? 108}px</span>
  </div>

  <input
    type="range"
    min={72}
    max={180}
    step={1}
    value={(local.avatar as any)?.sizePx ?? 108}
    onChange={(e) =>
      patch((d) => {
        d.avatar!.sizePx = Number(e.target.value)
      })
    }
  />
</div>
       <div className="flex flex-col gap-2">
  <div className="flex justify-between items-center">
    <span className="text-sm">Tamanho</span>
    <span className="text-xs text-black/50">{local.avatar?.sizePx ?? 108}px</span>
  </div>

  <input
    type="range"
    min={72}
    max={180}
    step={1}
    value={(local.avatar as any)?.sizePx ?? 108}
    onChange={(e) =>
      patch((d) => {
        d.avatar!.sizePx = Number(e.target.value)
      })
    }
  />
</div>


        <div className="flex justify-between items-center">
          <span className="text-sm">Forma</span>

          <Segmented
            value={local.avatar?.shape ?? 'circle'}
            options={[
              { key: 'circle', label: <ShapeIcon kind="circle" /> },
              { key: 'rounded', label: <ShapeIcon kind="rounded" /> },
              { key: 'square', label: <ShapeIcon kind="square" /> },
            ]}
            onChange={(k) =>
              patch((d) => {
                d.avatar!.shape = k as any
              })
            }
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Borda</span>
            <span className="text-xs text-black/50">{local.avatar?.borderWidth ?? 0}px</span>
          </div>
{/* ✅ NOVO: Glow/Halo */}
<div className="flex flex-col gap-2">
  <div className="flex justify-between items-center">
    <span className="text-sm">Glow (halo)</span>
    <input
      type="checkbox"
      checked={(local.avatar?.glow as any)?.enabled ?? false}
      onChange={(e) =>
        patch((d) => {
          d.avatar!.glow = d.avatar!.glow || { enabled: false, color: 'rgba(59,130,246,0.18)', size: 6 }
          d.avatar!.glow!.enabled = e.target.checked
        })
      }
    />
  </div>

  {((local.avatar?.glow as any)?.enabled ?? false) && (
    <>
      <div className="flex justify-between items-center">
        <span className="text-xs text-black/50">Tamanho</span>
        <span className="text-xs text-black/50">{(local.avatar?.glow as any)?.size ?? 6}px</span>
      </div>

      <input
        type="range"
        min={2}
        max={20}
        step={1}
        value={(local.avatar?.glow as any)?.size ?? 6}
        onChange={(e) =>
          patch((d) => {
            d.avatar!.glow = d.avatar!.glow || { enabled: true, color: 'rgba(59,130,246,0.18)', size: 6 }
            d.avatar!.glow!.size = Number(e.target.value)
          })
        }
      />

      <SwatchRow
        value={(local.avatar?.glow as any)?.color ?? 'rgba(59,130,246,0.18)'}
        onChange={(hex) =>
          patch((d) => {
            d.avatar!.glow = d.avatar!.glow || { enabled: true, color: 'rgba(59,130,246,0.18)', size: 6 }
            d.avatar!.glow!.color = hex
          })
        }
        onEyedropper={() =>
          openPicker({
            onPick: (hex: string) => {
              patch((d) => {
                d.avatar!.glow = d.avatar!.glow || { enabled: true, color: 'rgba(59,130,246,0.18)', size: 6 }
                d.avatar!.glow!.color = hex
              })
            },
          } as any)
        }
      />
    </>
  )}
</div>

{/* ✅ NOVO: Sombra */}
<div className="flex flex-col gap-2">
  <div className="flex justify-between items-center">
    <span className="text-sm">Sombra</span>
    <input
      type="checkbox"
      checked={(local.avatar?.shadow as any)?.enabled ?? false}
      onChange={(e) =>
        patch((d) => {
          d.avatar!.shadow = d.avatar!.shadow || { enabled: false, intensity: 0.18 }
          d.avatar!.shadow!.enabled = e.target.checked
        })
      }
    />
  </div>

  {((local.avatar?.shadow as any)?.enabled ?? false) && (
    <>
      <div className="flex justify-between items-center">
        <span className="text-xs text-black/50">Intensidade</span>
        <span className="text-xs text-black/50">
          {(((local.avatar?.shadow as any)?.intensity ?? 0.18) * 100).toFixed(0)}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={0.6}
        step={0.05}
        value={(local.avatar?.shadow as any)?.intensity ?? 0.18}
        onChange={(e) =>
          patch((d) => {
            d.avatar!.shadow = d.avatar!.shadow || { enabled: true, intensity: 0.18 }
            d.avatar!.shadow!.intensity = Number(e.target.value)
          })
        }
      />
    </>
  )}
</div>

          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={local.avatar?.borderWidth ?? 0}
            onChange={(e) => patch((d) => (d.avatar!.borderWidth = Number(e.target.value)))}
          />

          <SwatchRow
            value={local.avatar?.borderColor ?? '#FFFFFF'}
            onChange={(hex) =>
              patch((d) => {
                d.avatar!.borderColor = hex
              })
            }
            onEyedropper={openEyedropperBorder}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Posição do avatar (offset)</span>

            <button
              type="button"
              className="h-7 rounded-xl border border-black/10 px-3"
              onClick={() =>
                patch((d) => {
                  d.avatar!.offsetX = 0
                  d.avatar!.offsetY = null
                })
              }
              title="Reset (auto)"
            >
              Reset
            </button>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              className="h-7 w-7 rounded-xl border border-black/10"
              onClick={(e) =>
                patch((d) => {
                  d.avatar!.offsetX = (d.avatar!.offsetX ?? 0) - stepFromEvent(e)
                })
              }
              title="Esquerda (Shift = 10px)"
            >
              ⬅️
            </button>

            <button
              type="button"
              className="h-7 w-7 rounded-xl border border-black/10"
              onClick={(e) =>
                patch((d) => {
                  d.avatar!.offsetX = (d.avatar!.offsetX ?? 0) + stepFromEvent(e)
                })
              }
              title="Direita (Shift = 10px)"
            >
              ➡️
            </button>

            <button
              type="button"
              className="h-7 w-7 rounded-xl border border-black/10"
              onClick={(e) =>
                patch((d) => {
                  const current = d.avatar!.offsetY == null ? 0 : (d.avatar!.offsetY as number)
                  d.avatar!.offsetY = current - stepFromEvent(e)
                })
              }
              title="Cima (Shift = 10px)"
            >
              ⬆️
            </button>

            <button
              type="button"
              className="h-7 w-7 rounded-xl border border-black/10"
              onClick={(e) =>
                patch((d) => {
                  const current = d.avatar!.offsetY == null ? 0 : (d.avatar!.offsetY as number)
                  d.avatar!.offsetY = current + stepFromEvent(e)
                })
              }
              title="Baixo (Shift = 10px)"
            >
              ⬇️
            </button>

            <span className="text-xs text-black/50">
              X: {local.avatar?.offsetX ?? 0}px · Y:{' '}
              {local.avatar?.offsetY == null ? 'auto' : `\${local.avatar?.offsetY}px`}
            </span>
          </div>

          <span className="text-xs text-black/40 leading-tight">
            Dica: mantém Shift pressionado para mover 10px.
          </span>
        </div>
      </Section>

      <Section title="Posição do bloco (vertical)">
        <div className="flex justify-between items-center">
          <span className="text-sm">Offset Y</span>

          <button
            type="button"
            className="h-7 rounded-xl border border-black/10 px-2"
            onClick={() =>
              patch((d) => {
  d.offset = d.offset || ({ y: 0 } as any)
  d.offset!.y = 0
})
            }
            title="Reset"
          >
            Reset
          </button>
        </div>

        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            className="h-7 w-7 rounded-xl border border-black/10"
            onClick={(e) =>
              patch((d) => {
  const off = (d.offset ?? { y: 0 }) as any
  off.y = (off.y ?? 0) - stepFromEvent(e)
  d.offset = off
})

            }
            title="Subir (Shift = 10px)"
          >
            ⬆️
          </button>

          <button
            type="button"
            className="h-7 w-7 rounded-xl border border-black/10"
            onClick={(e) =>
              patch((d) => {
  const off = (d.offset ?? { y: 0 }) as any
  off.y = (off.y ?? 0) + stepFromEvent(e)
  d.offset = off
})

            }
            title="Descer (Shift = 10px)"
          >
            ⬇️
          </button>

          <span className="text-xs text-black/50">Y: {local.offset?.y ?? 0}px</span>
        </div>

        <span className="text-xs text-black/40 leading-tight">
          Isto move o bloco “Perfil” inteiro no preview (não é o avatar).
        </span>
      </Section>
<div className="flex flex-col gap-2">
  <div className="flex justify-between items-center">
    <span className="text-sm">Espaçamento entre linhas</span>
    <span className="text-xs text-black/50">{local.layout?.lineGap ?? 10}px</span>
  </div>

  <input
    type="range"
    min={1}
    max={20}
    step={1}
    value={local.layout?.lineGap ?? 10}
    onChange={(e) =>
      patch((d) => {
  const layout = d.layout || ({} as any)
  layout.lineGap = Number(e.target.value)
  d.layout = layout
})

    }
  />

  <span className="text-xs text-black/40 leading-tight">
    Controla o espaço entre Nome, Profissão e Empresa.
  </span>
</div>

      <Section title="Identidade">
        <TextLine
          label="Nome"
          value={local.name.text}
          color={local.name.color ?? '#0B1220'}
          enabled={local.name.enabled}
          fontFamily={local.name.style?.fontFamily ?? ''}
          bold={(local.name.style?.fontWeight ?? 700) === 700}
          size={(local.name.size ?? 'md') as any}
          onToggle={(v) => patch((d) => (d.name.enabled = v))}
          onText={(v) => patch((d) => (d.name.text = v))}
          onColor={(hex) => patch((d) => (d.name.color = hex))}
          onFontFamily={(ff) =>
            patch((d) => {
  const style = d.name.style || ({} as any)
  style.fontFamily = ff || undefined
  d.name.style = style
})

          }
          onBold={(b) =>
            patch((d) => {
  const style = d.name.style || ({} as any)
  style.fontWeight = b ? 700 : 400
  d.name.style = style
})

          }
          onSize={(s) => patch((d) => (d.name.size = s as any))}
          onEyedropper={() => openEyedropperFor('name')}
        />
<div className="flex justify-between items-center">
  <span className="text-sm">Alinhamento</span>

  <Segmented
    value={((local.layout as any)?.align) ?? 'center'}

    options={[
      { key: 'left', label: 'Esq' },
      { key: 'center', label: 'Centro' },
      { key: 'right', label: 'Dir' },
    ]}
    onChange={(k) =>
      patch((d) => {
  const layout = d.layout || ({} as any)
  layout.align = k as any
  d.layout = layout
})

    }
  />
</div>

        <TextLine
          label="Profissão"
          value={local.profession.text}
          color={local.profession.color ?? '#374151'}
          enabled={local.profession.enabled}
          fontFamily={local.profession.style?.fontFamily ?? ''}
          bold={(local.profession.style?.fontWeight ?? 400) === 700}
          size={(local.profession.size ?? 'sm') as any}
          onToggle={(v) => patch((d) => (d.profession.enabled = v))}
          onText={(v) =>
            patch((d) => {
              d.profession.text = v
              if (v.trim()) d.profession.enabled = true
            })
          }
          onColor={(hex) => patch((d) => (d.profession.color = hex))}
          onFontFamily={(ff) =>
            patch((d) => {
  const style = d.profession.style || ({} as any)
  style.fontFamily = ff || undefined
  d.profession.style = style
})

          }
          onBold={(b) =>
            patch((d) => {
  const style = d.profession.style || ({} as any)
  style.fontWeight = b ? 700 : 400
  d.profession.style = style
})

          }
          onSize={(s) => patch((d) => (d.profession.size = s as any))}
          onEyedropper={() => openEyedropperFor('profession')}
        />

        <TextLine
          label="Empresa"
          value={local.company?.text ?? ''}
          color={local.company?.color ?? '#6B7280'}
          enabled={local.company?.enabled ?? true}
          fontFamily={local.company?.style?.fontFamily ?? ''}
          bold={(local.company?.style?.fontWeight ?? 400) === 700}
          size={((local.company?.size ?? 'sm') as any)}
          onToggle={(v) =>
            patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.enabled = v
            })
          }
          onText={(v) =>
            patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.text = v
              d.company.enabled = true
            })
          }
          onColor={(hex) =>
            patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.color = hex
            })
          }
          onFontFamily={(ff) =>
            patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.style
              const style = d.company.style || ({} as any)
  style.fontFamily = ff || undefined
  d.company.style = style
})
          }
          onBold={(b) =>
            patch((d) => {
  d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
  const style = d.company.style || ({} as any)
  style.fontWeight = b ? 700 : 400
  d.company.style = style
})

          }
          onSize={(s) =>
            patch((d) => {
              d.company = d.company || { enabled: true, text: '', size: 'sm', color: '#6B7280' }
              d.company.size = s as any
            })
          }
          onEyedropper={() => openEyedropperFor('company')}
        />
      </Section>
    </div>
  )
}

function ShapeIcon({ kind }: { kind: 'circle' | 'rounded' | 'square' }) {
  const common: React.CSSProperties = {
    width: 14,
    height: 14,
    display: 'inline-block',
    background: 'currentColor',
    flex: '0 0 auto',
  }

  if (kind === 'circle') return <span aria-hidden style={{ ...common, borderRadius: 999 }} />
  if (kind === 'rounded') return <span aria-hidden style={{ ...common, borderRadius: 4 }} />
  return <span aria-hidden style={{ ...common, borderRadius: 0 }} />
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: { key: string; label: React.ReactNode }[]
  onChange: (key: string) => void
}) {
  return (
    <div
      data-no-block-select="1"
      onPointerDown={stop}
      onMouseDown={stop}
      style={{
        display: 'inline-flex',
        gap: 6,
        padding: 4,
        borderRadius: 999,
        border: '1px solid rgba(0,0,0,0.10)',
        background: 'rgba(255,255,255,0.75)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.03)',
      }}
    >
      {options.map((o) => {
        const selected = o.key === value
        return (
          <button
            key={o.key}
            type="button"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            onClick={(e) => {
              stop(e)
              onChange(o.key)
            }}
            style={{
              ...pillBtn,
              minWidth: 30,
              border: selected ? '1px solid rgba(0,0,0,0.18)' : '1px solid transparent',
              background: selected ? '#0B1220' : 'transparent',
              color: selected ? '#fff' : '#0B1220',
              boxShadow: selected ? '0 6px 16px rgba(0,0,0,0.12)' : 'none',
            }}
            aria-pressed={selected}
            title={o.key}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function TextLine({
  label,
  value,
  color,
  enabled,
  fontFamily,
  bold,
  size,
  onToggle,
  onText,
  onColor,
  onFontFamily,
  onBold,
  onSize,
  onEyedropper,
}: {
  label: string
  value: string
  color: string
  enabled: boolean
  fontFamily: string
  bold: boolean
  size: 'sm' | 'md' | 'lg'
  onToggle: (v: boolean) => void
  onText: (v: string) => void
  onColor: (hex: string) => void
  onFontFamily: (ff: string) => void
  onBold: (b: boolean) => void
  onSize: (s: 'sm' | 'md' | 'lg') => void
  onEyedropper: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-sm">{label}</span>

        <input
          type="checkbox"
          checked={enabled}
          data-no-block-select="1"
          onPointerDown={stop}
          onMouseDown={stop}
          onChange={(e) => onToggle(e.target.checked)}
          title="Ativar/desativar"
        />
      </div>

      <input
        value={value}
        onChange={(e) => onText(e.target.value)}
        disabled={false}
        className="h-7 rounded-xl border border-black/10 px-3"
      />

      {/* Grupo compacto: Fonte + Tam. + Bold */}
      <div
        className="flex items-center gap-2 flex-wrap"
        style={{
          padding: 6,
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.08)',
          background: 'rgba(255,255,255,0.7)',
        }}
      >
        <div className="flex items-center gap-2" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <span className="text-xs text-black/50" style={{ width: 34 }}>
            Fonte
          </span>

          <select
            value={fontFamily}
            onChange={(e) => onFontFamily(e.target.value)}
            className="h-7 rounded-lg border border-black/10 px-2 text-sm"
            style={{ flex: 1, minWidth: 140 }}
            title="Fonte"
          >
            <option value="">Tema</option>
            {FONT_OPTIONS.map((o) => (
              <option key={o.label} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-black/50">Tam.</span>

          <div
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            style={{
              display: 'inline-flex',
              gap: 4,
              padding: 3,
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,0.10)',
              background: '#fff',
            }}
          >
            {(['sm', 'md', 'lg'] as const).map((k) => {
              const selected = k === size
              return (
                <button
                  key={k}
                  type="button"
                  onClick={(e) => {
                    stop(e)
                    onSize(k)
                  }}
                  style={{
                    height: 24,
                    minWidth: 28,
                    padding: '0 8px',
                    borderRadius: 999,
                    border: selected ? '1px solid rgba(0,0,0,0.18)' : '1px solid transparent',
                    background: selected ? '#0B1220' : 'transparent',
                    color: selected ? '#fff' : '#0B1220',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                  aria-pressed={selected}
                  title={k.toUpperCase()}
                >
                  {k.toUpperCase()}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            data-no-block-select="1"
            onPointerDown={stop}
            onMouseDown={stop}
            onClick={(e) => {
              stop(e)
              onBold(!bold)
            }}
            title="Bold"
            aria-pressed={bold}
            style={{
              height: 28,
              width: 34,
              borderRadius: 10,
              border: '1px solid rgba(0,0,0,0.10)',
              background: bold ? '#0B1220' : '#fff',
              color: bold ? '#fff' : '#0B1220',
              fontWeight: 900,
              cursor: 'pointer',
            }}
          >
            B
          </button>
        </div>
      </div>

      <SwatchRow value={color} onChange={onColor} onEyedropper={onEyedropper} />
    </div>
  )
}
