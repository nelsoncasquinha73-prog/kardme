'use client'

import React from 'react'

type Props = {
  settings: any
  style?: any
  onChangeSettings: (s: any) => void
  onChangeStyle: (s: any) => void
}

export default function LeadFormBlockEditor({ settings, style, onChangeSettings, onChangeStyle }: Props) {
  // Por agora editor simples, só para mostrar texto informativo
  return (
    <div style={{ padding: 16 }}>
      <p>Este bloco exibe um formulário para captar leads.</p>
      <p>Configurações futuras podem ser adicionadas aqui.</p>
    </div>
  )
}
