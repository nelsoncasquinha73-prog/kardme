export function getBaseTemplateBlocks() {
  return [
    {
      type: 'header',
      order: 0,
      settings: {
        layout: { avatarDock: 'inline' },
        avatar: {
          enabled: true,
          size: 80,
          shape: 'circle',
          offset: 0,
          border: { enabled: false, width: 0, color: '#000000' },
        },
      },
      style: { headingAlign: 'center' },
      title: 'Header',
      enabled: true,
    },
    {
      type: 'profile',
      order: 1,
      settings: { verticalOffset: 0, uploadedImageUrl: null, showName: true, showTitle: true },
      style: { headingAlign: 'center' },
      title: 'Profile',
      enabled: true,
    },
    {
      type: 'social',
      order: 2,
      settings: { items: [] },
      style: { headingAlign: 'center' },
      title: 'Social',
      enabled: true,
    },
    {
      type: 'contact',
      order: 3,
      settings: { items: [] },
      style: { headingAlign: 'center' },
      title: 'Contact',
      enabled: true,
    },

    // restantes desligados
    { type: 'gallery', order: 4, settings: { items: [] }, style: {}, title: 'Gallery', enabled: false },
    { type: 'services', order: 5, settings: { items: [] }, style: {}, title: 'Services', enabled: false },
    { type: 'bio', order: 6, settings: { text: '' }, style: {}, title: 'Bio', enabled: false },
    {
      type: 'lead_form',
      order: 7,
      settings: { title: '', description: '', fields: { name: true, email: true, phone: false, message: false } },
      style: {},
      title: 'Lead Form',
      enabled: false,
    },
    { type: 'business_hours', order: 8, settings: { items: [] }, style: {}, title: 'Business Hours', enabled: false },
    { type: 'cta_buttons', order: 9, settings: { items: [] }, style: {}, title: 'CTA Buttons', enabled: false },
    { type: 'free_text', order: 10, settings: { text: '' }, style: {}, title: 'Free Text', enabled: false },
    { type: 'info_utilities', order: 11, settings: { type: 'restaurant', items: [] }, style: {}, title: 'Info Utilities', enabled: false },
    { type: 'decorations', order: 12, settings: { decorations: [] }, style: {}, title: 'Decorations', enabled: false },
  ]
}
