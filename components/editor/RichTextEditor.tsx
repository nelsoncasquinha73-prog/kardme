'use client'

import React, { useCallback } from 'react'
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Extension } from '@tiptap/core'
import TextStyle from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const COLORS = ['#000000', '#374151', '#6B7280', '#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF']
const HIGHLIGHTS = ['transparent', '#FEF08A', '#BBF7D0', '#BFDBFE', '#DDD6FE', '#FBCFE8', '#FED7AA']

export default function RichTextEditor({ value, onChange, placeholder = 'Escreve aqui...', minHeight = 100 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-blue-500 underline' } }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none',
        style: `min-height: ${minHeight}px; padding: 12px; font-size: 14px; line-height: 1.6;`,
      },
    },
    immediatelyRender: false,
  })

  const setLink = useCallback(() => {
    if (!editor) return
    const url = window.prompt('URL:', editor.getAttributes('link').href || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }, [editor])

  if (!editor) return null

  const btnStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 8px',
    borderRadius: 6,
    border: 'none',
    background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
    color: active ? '#3b82f6' : '#374151',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 600,
    transition: 'all 0.15s',
  })

  const ToolbarButton = ({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) => (
    <button type="button" onClick={onClick} style={btnStyle(active || false)} title={title}>{children}</button>
  )

  const Toolbar = () => (
    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
      <ToolbarButton active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Negrito">B</ToolbarButton>
      <ToolbarButton active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Itálico"><i>I</i></ToolbarButton>
      <ToolbarButton active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Sublinhado"><u>U</u></ToolbarButton>
      <ToolbarButton active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Riscado"><s>S</s></ToolbarButton>
      
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
      
      <ToolbarButton active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Alinhar esquerda">◀</ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrar">●</ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Alinhar direita">▶</ToolbarButton>
      
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
      
      <ToolbarButton active={editor.isActive('link')} onClick={setLink} title="Link">🔗</ToolbarButton>
      
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
      
      {/* Color picker */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 11, color: '#666', marginRight: 4 }}>Cor:</span>
        {COLORS.slice(0, 6).map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => editor.chain().focus().setColor(color).run()}
            style={{
              width: 18, height: 18, borderRadius: 4, border: color === '#FFFFFF' ? '1px solid #ddd' : '1px solid transparent',
              background: color, cursor: 'pointer', padding: 0,
            }}
            title={color}
          />
        ))}
      </div>
      
      <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
      
      {/* Highlight picker */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 2 }}>
        <span style={{ fontSize: 11, color: '#666', marginRight: 4 }}>Destaque:</span>
        {HIGHLIGHTS.slice(0, 5).map((color, i) => (
          <button
            key={color}
            type="button"
            onClick={() => i === 0 ? editor.chain().focus().unsetHighlight().run() : editor.chain().focus().setHighlight({ color }).run()}
            style={{
              width: 18, height: 18, borderRadius: 4, border: '1px solid #ddd',
              background: color === 'transparent' ? 'linear-gradient(135deg, #fff 45%, #ef4444 50%, #fff 55%)' : color,
              cursor: 'pointer', padding: 0,
            }}
            title={i === 0 ? 'Remover destaque' : color}
          />
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      <Toolbar />
      
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
        <div style={{ display: 'flex', gap: 2, padding: 6, background: '#1f2937', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={{ ...btnStyle(editor.isActive('bold')), color: '#fff', background: editor.isActive('bold') ? 'rgba(255,255,255,0.2)' : 'transparent' }}>B</button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={{ ...btnStyle(editor.isActive('italic')), color: '#fff', background: editor.isActive('italic') ? 'rgba(255,255,255,0.2)' : 'transparent' }}><i>I</i></button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={{ ...btnStyle(editor.isActive('underline')), color: '#fff', background: editor.isActive('underline') ? 'rgba(255,255,255,0.2)' : 'transparent' }}><u>U</u></button>
          <button type="button" onClick={setLink} style={{ ...btnStyle(editor.isActive('link')), color: '#fff', background: editor.isActive('link') ? 'rgba(255,255,255,0.2)' : 'transparent' }}>🔗</button>
        </div>
      </BubbleMenu>
      
      <EditorContent editor={editor} />
    </div>
  )
}
