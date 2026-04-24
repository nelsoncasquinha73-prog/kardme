'use client'
import styles from './LeadMagnetPreview.module.css'

interface LeadMagnet {
  id: string
  slug: string
  title: string
  magnet_type: string
  welcome_email_subject: string
  welcome_email_body: string
  file_url: string | null
  thank_you_message: string
  capture_page_title: string
  capture_page_subtitle: string
  capture_page_image: string | null
  capture_page_button_text: string
  leads_count: number
}

interface PreviewProps {
  magnet: LeadMagnet
}

export default function LeadMagnetPreview({ magnet }: PreviewProps) {
  const emailBodyFormatted = magnet.welcome_email_body
    .split('\n')
    .map((line, i) => <div key={i}>{line || <br />}</div>)

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewSection}>
        <h3 className={styles.previewTitle}>📄 Página de Captura</h3>
        <div className={styles.mockup}>
          <div className={styles.mockupHeader}>
            <div className={styles.mockupBar}></div>
          </div>
          <div className={styles.mockupContent}>
            {magnet.capture_page_image && (
              <img src={magnet.capture_page_image} alt="Capa" className={styles.mockupImage} />
            )}
            <h2 className={styles.mockupTitle}>{magnet.capture_page_title || 'Título da Campanha'}</h2>
            <p className={styles.mockupSubtitle}>{magnet.capture_page_subtitle || 'Subtítulo'}</p>
            <button className={styles.mockupButton}>{magnet.capture_page_button_text || 'Receber'}</button>
          </div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <h3 className={styles.previewTitle}>📧 Email de Boas-vindas</h3>
        <div className={styles.emailPreview}>
          <div className={styles.emailHeader}>
            <strong>De:</strong> {magnet.title || 'Kardme'}
            <br />
            <strong>Assunto:</strong> {magnet.welcome_email_subject || 'Sem assunto'}
          </div>
          <div className={styles.emailBody}>{emailBodyFormatted}</div>
        </div>
      </div>

      <div className={styles.previewSection}>
        <h3 className={styles.previewTitle}>✅ Mensagem de Sucesso</h3>
        <div className={styles.successPreview}>
          <p>{magnet.thank_you_message || 'Obrigado!'}</p>
        </div>
      </div>

      <div className={styles.previewSection}>
        <h3 className={styles.previewTitle}>📊 Info</h3>
        <div className={styles.infoBox}>
          <p><strong>Slug:</strong> /{magnet.slug}</p>
          <p><strong>Tipo:</strong> {magnet.magnet_type}</p>
          <p><strong>Leads:</strong> {magnet.leads_count}</p>
        </div>
      </div>
    </div>
  )
}
