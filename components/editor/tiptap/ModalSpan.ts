import { Mark, mergeAttributes } from '@tiptap/core'

export const ModalSpan = Mark.create({
  name: 'modalSpan',

  addAttributes() {
    return {
      modalId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-modal-id'),
        renderHTML: (attributes) => {
          if (!attributes.modalId) return {}
          return { 'data-modal-id': attributes.modalId }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-modal-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        style: 'text-decoration: underline; cursor: pointer; color: #3b82f6;',
      }),
      0,
    ]
  },
})
