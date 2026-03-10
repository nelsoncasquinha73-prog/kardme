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
      <p style={{ marginBottom: '12px' }}>Quando um visitante interage com um cartão e decide preencher um formulário, podem ser recolhidos:</p>
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

      <h3 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '12px' }}>2.3 Dados de conta</h3>
      <p style={{ marginBottom: '12px' }}>Ao criar uma conta na Kardme, recolhemos:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Nome completo</li>
        <li>E-mail</li>
        <li>Palavra-passe (encriptada)</li>
        <li>Dados de faturação (se aplicável)</li>
        <li>Informações do perfil profissional inseridas pelo utilizador</li>
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
        <li>Comunicações relacionadas com o serviço (notificações, atualizações, suporte)</li>
      </ul>
      <p style={{ marginBottom: '24px', fontWeight: 'bold' }}>A Kardme não vende dados pessoais a terceiros.</p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>4. Base legal do tratamento (RGPD)</h2>
      <p style={{ marginBottom: '12px' }}>Os dados são tratados com base em:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li><strong>Consentimento</strong> do titular dos dados (ex.: preenchimento voluntário de formulários)</li>
        <li><strong>Interesse legítimo</strong> (segurança, prevenção de abuso, melhoria do serviço, analytics)</li>
        <li><strong>Execução de contrato</strong> (prestação do serviço Kardme, gestão de subscrições)</li>
        <li><strong>Cumprimento de obrigação legal</strong> (faturação, obrigações fiscais)</li>
      </ul>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>5. Partilha de dados com terceiros</h2>
      <p style={{ marginBottom: '12px' }}>Os dados podem ser partilhados com:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li>Fornecedores tecnológicos (hosting, infraestrutura, segurança, analytics, e-mail)</li>
        <li>Processadores de pagamento (Stripe, PayPal)</li>
        <li>Plataformas externas ativadas pelo Titular do Cartão (ex.: CRM, integrações)</li>
        <li>Autoridades competentes, quando exigido por lei</li>
      </ul>
      <p style={{ marginBottom: '24px' }}>
        Todos os fornecedores são selecionados com base na sua conformidade com o RGPD e legislação aplicável.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>6. Transferências internacionais de dados</h2>
      <p style={{ marginBottom: '24px' }}>
        Alguns dos nossos fornecedores tecnológicos podem estar localizados fora do Espaço Económico Europeu (EEE). Nesses casos, asseguramos que existem garantias adequadas, como cláusulas contratuais-tipo aprovadas pela Comissão Europeia ou decisões de adequação.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>7. Conservação dos dados</h2>
      <p style={{ marginBottom: '24px' }}>
        Os dados pessoais são conservados apenas durante o período necessário para as finalidades para as quais foram recolhidos, ou conforme exigido por lei. Dados de leads são mantidos enquanto a conta do Titular do Cartão estiver ativa. Após eliminação da conta, os dados são apagados no prazo máximo de 30 dias, salvo obrigação legal de conservação.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>8. Segurança</h2>
      <p style={{ marginBottom: '24px' }}>
        A Kardme implementa medidas técnicas e organizativas adequadas para proteger os dados pessoais contra acesso não autorizado, perda, alteração ou divulgação indevida, incluindo encriptação de dados, controlo de acessos e monitorização contínua.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>9. Cookies e tecnologias semelhantes</h2>
      <p style={{ marginBottom: '24px' }}>
        A Kardme pode utilizar cookies e tecnologias semelhantes para melhorar a experiência do utilizador, análise de tráfego e personalização do serviço. O utilizador pode gerir as suas preferências de cookies através das definições do navegador.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>10. Direitos dos titulares de dados</h2>
      <p style={{ marginBottom: '12px' }}>Nos termos do RGPD, o utilizador tem direito a:</p>
      <ul style={{ marginBottom: '24px', paddingLeft: '20px' }}>
        <li><strong>Acesso</strong> — saber que dados temos sobre si</li>
        <li><strong>Retificação</strong> — corrigir dados incorretos ou incompletos</li>
        <li><strong>Apagamento</strong> — solicitar a eliminação dos seus dados</li>
        <li><strong>Limitação do tratamento</strong> — restringir o uso dos seus dados</li>
        <li><strong>Oposição</strong> — opor-se ao tratamento dos seus dados</li>
        <li><strong>Portabilidade</strong> — receber os seus dados num formato estruturado</li>
        <li><strong>Retirada de consentimento</strong> — a qualquer momento, sem afetar a licitude do tratamento anterior</li>
      </ul>
      <p style={{ marginBottom: '24px' }}>
        Para exercer qualquer destes direitos: <strong>admin@kardme.com</strong>
      </p>
      <p style={{ marginBottom: '24px' }}>
        Tem também o direito de apresentar reclamação junto da <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong> — <a href="https://www.cnpd.pt" style={{ color: '#3b82f6' }}>www.cnpd.pt</a>
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>11. Alterações a esta política</h2>
      <p style={{ marginBottom: '24px' }}>
        A Kardme reserva-se o direito de alterar esta Política de Privacidade a qualquer momento. As alterações serão publicadas nesta página com a data de atualização. Recomendamos a consulta periódica desta página.
      </p>

      <h2 style={{ fontSize: '20px', marginTop: '32px', marginBottom: '16px' }}>12. Contacto</h2>
      <p style={{ marginBottom: '8px' }}>
        Para questões sobre privacidade e proteção de dados:
      </p>
      <p style={{ marginBottom: '8px' }}><strong>Kardme</strong></p>
      <p style={{ marginBottom: '8px' }}>Responsável: Nelson Casquinha</p>
      <p style={{ marginBottom: '8px' }}>E-mail: <strong>admin@kardme.com</strong></p>
      <p>Portugal</p>
    </main>
  )
}
