'use client'

import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'

type Props = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: number
}

export default function RichTextEditor({ value, onChange, placeholder = 'Escreve aqui...', minHeight = 100 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Underline,
      TextAlign.configure({ types: ['paragraph'] }),
      Link.configure({ openOnClick: false }),
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

  return (
    <div style={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btnStyle(editor.isActive('bold'))} title="Negrito"><strong>B</strong></button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btnStyle(editor.isActive('italic'))} title="Itálico"><em>I</em></button>
        <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} style={btnStyle(editor.isActive('underline'))} title="Sublinhado"><u>U</u></button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btnStyle(editor.isActive('strike'))} title="Riscado"><s>S</s></button>
        
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
        
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} style={btnStyle(editor.isActive({ textAlign: 'left' }))} title="Esquerda">◀</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} style={btnStyle(editor.isActive({ textAlign: 'center' }))} title="Centro">●</button>
        <button type="button" onClick={() => editor.chain().focus().setTextAlign('right').run()} style={btnStyle(editor.isActive({ textAlign: 'right' }))} title="Direita">▶</button>
        
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />
        
        <button type="button" onClick={setLink} style={btnStyle(editor.isActive('link'))} title="Link">🔗</button>
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
