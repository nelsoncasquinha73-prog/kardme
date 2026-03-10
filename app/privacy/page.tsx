export const metadata = {
  title: 'Política de Privacidade — Kardme',
  description: 'Política de Privacidade da Kardme',
}

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.8, fontSize: '15px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Política de Privacidade</h1>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '32px' }}>Última atualização: 10/03/2026</p>

      <p style={{ marginBottom: '24px' }}>
        A Kardme respeita a sua privacidade e está comprometida com a proteção dos dados pessoais recolhidos através dos cartões digitais, funcionalidades NFC/QR e da plataforma tecnológica associada.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>1. Quem é o responsável pelo tratamento?</h2>
      <p style={{ marginBottom: '16px' }}>
        Os dados pessoais recolhidos através de um cartão Kardme podem envolver dois responsáveis pelo tratamento:
      </p>
      <ol style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li style={{ marginBottom: '8px' }}><strong>O Titular do Cartão</strong> (pessoa ou empresa que utiliza o Kardme para receber contactos e leads).</li>
        <li><strong>A Kardme / Plataforma</strong>, enquanto fornecedora da tecnologia e responsável pelo tratamento dos dados necessários ao funcionamento técnico do serviço.</li>
      </ol>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>2. Dados que recolhemos</h2>
      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>2.1 Dados fornecidos voluntariamente (Leads)</h3>
      <p style={{ marginBottom: '12px' }}>Quando um visitante interage com um cartão, podem ser recolhidos:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Nome e apelido</li>
        <li>E-mail</li>
        <li>Telefone/WhatsApp</li>
        <li>Empresa / cargo</li>
        <li>Cidade/país (se aplicável)</li>
        <li>Mensagem ou pedido</li>
      </ul>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>2.2 Dados recolhidos automaticamente</h3>
      <p style={{ marginBottom: '12px' }}>Quando um cartão é aberto por link, QR Code ou NFC, podem ser recolhidos dados técnicos como:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Endereço IP</li>
        <li>Tipo de dispositivo e sistema operativo</li>
        <li>Navegador utilizado</li>
        <li>Data e hora de acesso</li>
        <li>Páginas/áreas visitadas e interações</li>
        <li>Origem do acesso (ex.: QR, NFC, link)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>3. Finalidades do tratamento</h2>
      <p style={{ marginBottom: '12px' }}>Os dados podem ser utilizados para:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Permitir o contacto entre o visitante e o Titular do Cartão</li>
        <li>Responder a pedidos de informação e contactos comerciais</li>
        <li>Gerir e organizar leads e contactos</li>
        <li>Melhorar a experiência e funcionalidades da Kardme</li>
        <li>Produzir estatísticas e métricas de utilização</li>
        <li>Prevenção de fraude, segurança e auditoria técnica</li>
        <li>Cumprimento de obrigações legais</li>
      </ul>
      <p style={{ marginBottom: '24px', fontWeight: 'bold' }}>A Kardme não vende dados pessoais.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>4. Base legal do tratamento (RGPD)</h2>
      <p style={{ marginBottom: '12px' }}>Os dados são tratados com base em:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Consentimento do titular dos dados</li>
        <li>Interesse legítimo (segurança, prevenção de abuso, melhoria do serviço)</li>
        <li>Execução de contrato (prestação do serviço Kardme)</li>
        <li>Cumprimento de obrigação legal</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>5. Partilha de dados com terceiros</h2>
      <p style={{ marginBottom: '12px' }}>Os dados podem ser partilhados com:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Fornecedores tecnológicos (hosting, infraestrutura, segurança, analytics, e-mail, etc.)</li>
        <li>Plataformas externas ativadas pelo Titular do Cartão (ex.: CRM)</li>
        <li>Autoridades competentes, quando exigido por lei</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>6. Segurança</h2>
      <p style={{ marginBottom: '24px' }}>
        A Kardme implementa medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>7. Direitos dos titulares de dados</h2>
      <p style={{ marginBottom: '12px' }}>Nos termos do RGPD, o utilizador tem direito a:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Acesso</li>
        <li>Retificação</li>
        <li>Apagamento</li>
        <li>Limitação do tratamento</li>
        <li>Oposição</li>
        <li>Portabilidade</li>
        <li>Retirada de consentimento</li>
      </ul>

      <p style={{ marginBottom: '24px' }}>
        Para exercer direitos ou questões sobre privacidade: <strong>admin@kardme.com</strong>
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>8. Contacto</h2>
      <p>
        Para questões sobre privacidade e proteção de dados: <strong>admin@kardme.com</strong>
      </p>
    </main>
  )
}
