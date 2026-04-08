'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { TextAlign } from '@tiptap/extension-text-align'
import { FiBold, FiItalic, FiUnderline, FiLink2, FiAlignLeft, FiAlignCenter, FiAlignRight } from 'react-icons/fi'
import { useState } from 'react'
import styles from './EmailTextBlockEditor.module.css'

interface EmailTextBlockEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function EmailTextBlockEditor({ content, onChange, placeholder }: EmailTextBlockEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showSizePicker, setShowSizePicker] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
      }),
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['paragraph'] }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']
  const colors = ['#111827', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6']

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? styles.active : ''}
          title="Bold"
        >
          <FiBold size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? styles.active : ''}
          title="Italic"
        >
          <FiItalic size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? styles.active : ''}
          title="Underline"
        >
          <FiUnderline size={16} />
        </button>

        <div className={styles.separator} />

        <div className={styles.dropdown}>
          <button onClick={() => setShowSizePicker(!showSizePicker)} title="Font size">
            A
          </button>
          {showSizePicker && (
            <div className={styles.dropdownMenu}>
              {fontSizes.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    editor.chain().focus().setMark('textStyle', { fontSize: size }).run()
                    setShowSizePicker(false)
                  }}
                  style={{ fontSize: size }}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.dropdown}>
          <button onClick={() => setShowColorPicker(!showColorPicker)} title="Text color">
            🎨
          </button>
          {showColorPicker && (
            <div className={styles.colorPickerContainer}>
              <div className={styles.colorGrid}>
                {colors.map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      editor.chain().focus().setColor(color).run()
                      setShowColorPicker(false)
                    }}
                    style={{ backgroundColor: color, width: 24, height: 24, borderRadius: 4, border: 'none', cursor: 'pointer' }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                onChange={(e) => {
                  editor.chain().focus().setColor(e.target.value).run()
                  setShowColorPicker(false)
                }}
                style={{ width: '100%', height: 32, border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', marginTop: 8 }}
                title="Custom color"
              />
            </div>
          )}
        </div>

        <div className={styles.separator} />

        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={editor.isActive({ textAlign: 'left' }) ? styles.active : ''}
          title="Align left"
        >
          <FiAlignLeft size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={editor.isActive({ textAlign: 'center' }) ? styles.active : ''}
          title="Align center"
        >
          <FiAlignCenter size={16} />
        </button>

        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={editor.isActive({ textAlign: 'right' }) ? styles.active : ''}
          title="Align right"
        >
          <FiAlignRight size={16} />
        </button>

        <div className={styles.separator} />

        <button
          onClick={() => {
            const url = prompt('Enter URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={editor.isActive('link') ? styles.active : ''}
          title="Add link"
        >
          <FiLink2 size={16} />
        </button>
      </div>

      <EditorContent editor={editor} className={styles.editor} />
    </div>
  )
}
