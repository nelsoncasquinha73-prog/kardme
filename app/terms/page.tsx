export const metadata = {
  title: 'Termos e Condições — Kardme',
  description: 'Termos e Condições de Utilização da Kardme',
}

export default function TermsPage() {
  return (
    <main style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px', lineHeight: 1.8, fontSize: '15px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Termos e Condições de Utilização</h1>
      <p style={{ opacity: 0.6, fontSize: '13px', marginBottom: '32px' }}>Última atualização: 10/03/2026</p>

      <p style={{ marginBottom: '24px' }}>
        Estes Termos e Condições regulam o acesso e utilização da plataforma Kardme (incluindo cartões de visita digitais, funcionalidades QR/NFC, formulários de leads, painel/CRM e quaisquer funcionalidades associadas). Ao criar uma conta, aceder ou utilizar o Serviço, o utilizador concorda com estes Termos.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>1. Identificação do responsável pelo Serviço</h2>
      <p style={{ marginBottom: '24px' }}>
        O Serviço é disponibilizado por <strong>Nelson Casquinha</strong> (ENI), NIF <strong>223017493</strong>, Portugal (&quot;Kardme&quot;).<br />
        Contacto: <strong>admin@kardme.com</strong>
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>2. Descrição do Serviço</h2>
      <p style={{ marginBottom: '12px' }}>A Kardme permite:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Criar e publicar cartões digitais</li>
        <li>Partilhar cartões via link, QR Code e NFC</li>
        <li>Configurar links, botões e blocos de conteúdo</li>
        <li>Recolher leads através de formulários</li>
        <li>Consultar e gerir leads (CRM) e métricas/analytics</li>
        <li>Participar no programa de afiliados</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>3. Conteúdo e conduta</h2>
      <p style={{ marginBottom: '12px' }}>
        O utilizador é o único responsável pelo conteúdo que publica no cartão. É proibido utilizar o Serviço para:
      </p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Conteúdo ilegal, fraudulento, difamatório ou que viole direitos de terceiros</li>
        <li>Spam, phishing, malware ou recolha abusiva de dados</li>
        <li>Tentativas de acesso não autorizado ou exploração de vulnerabilidades</li>
      </ul>
      <p style={{ marginBottom: '24px' }}>Podemos suspender ou remover conteúdo/cartões que violem estes Termos ou a lei.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>4. Planos, pagamentos e faturação</h2>
      <p style={{ marginBottom: '12px' }}>A Kardme oferece planos gratuitos e pagos (mensal e anual).</p>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>Pagamento:</h3>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Os pagamentos são processados via <strong>Stripe</strong> e/ou <strong>PayPal</strong></li>
        <li>Os preços e funcionalidades são apresentados no momento de subscrição</li>
        <li>Planos pagos renovam-se automaticamente, salvo cancelamento prévio</li>
      </ul>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>Reembolsos:</h3>
      <p style={{ marginBottom: '24px' }}>Reembolsos são avaliados caso a caso. Contacte <strong>admin@kardme.com</strong> para solicitar.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>5. Programa de Afiliados</h2>
      <p style={{ marginBottom: '12px' }}>A Kardme oferece um programa de afiliados com comissões por vendas.</p>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>Comissões:</h3>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>A comissão mínima é de <strong>20%</strong> por venda realizada através do link do afiliado</li>
        <li>Comissões superiores a 20% podem ser negociadas</li>
        <li>As comissões são pagas em EUR (euros)</li>
      </ul>

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>Condições:</h3>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>O afiliado não pode realizar auto-compras ou compras fraudulentas</li>
        <li>A Kardme reserva-se o direito de recusar ou cancelar participação de afiliados que violem estas condições</li>
        <li>Pagamentos de comissões ocorrem conforme calendário definido pela Kardme</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>6. Integração com CRM e exportação de leads</h2>
      <p style={{ marginBottom: '24px' }}>
        O Titular do Cartão pode ativar funcionalidades que permitem exportação de leads e envio automático para plataformas externas. O tratamento posterior fica sujeito às políticas dessas plataformas.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>7. Limitação de responsabilidade</h2>
      <p style={{ marginBottom: '12px' }}>Na máxima extensão permitida por lei:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>A Kardme não é responsável por perdas indiretas, lucros cessantes ou danos consequenciais</li>
        <li>A Kardme não é responsável por ações do Titular do Cartão perante Visitantes</li>
        <li>O utilizador é responsável por verificar a conformidade legal do seu uso (incluindo RGPD)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>8. Suspensão e cessação</h2>
      <p style={{ marginBottom: '12px' }}>Podemos suspender ou terminar o acesso em caso de:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Violação destes Termos</li>
        <li>Uso abusivo, risco de segurança ou fraude</li>
        <li>Exigência legal</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>9. Alterações aos Termos</h2>
      <p style={{ marginBottom: '24px' }}>
        A Kardme reserva-se o direito de alterar estes Termos a qualquer momento. As alterações serão comunicadas através da plataforma ou por e-mail. A continuação do uso do Serviço após a notificação constitui aceitação dos novos Termos.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>10. Propriedade intelectual</h2>
      <p style={{ marginBottom: '24px' }}>
        Todo o conteúdo da plataforma Kardme (design, código, marca, logótipos, textos e funcionalidades) é propriedade da Kardme ou dos seus licenciantes. O utilizador não pode copiar, modificar, distribuir ou utilizar qualquer elemento da plataforma sem autorização prévia por escrito.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>11. Lei aplicável e resolução de litígios</h2>
      <p style={{ marginBottom: '24px' }}>
        Estes Termos regem-se pela lei portuguesa. Em caso de litígio, as partes procurarão uma resolução amigável. Na impossibilidade, será competente o foro da comarca de Lisboa, Portugal.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>12. Contacto</h2>
      <p style={{ marginBottom: '24px' }}>
        Para questões sobre estes Termos: <strong>admin@kardme.com</strong>
      </p>
    </main>
  )
}
