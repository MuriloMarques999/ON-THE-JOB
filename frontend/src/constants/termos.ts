/*
 * Termos de uso e política de privacidade (LGPD — Lei nº 13.709/2018).
 * Aceitos no primeiro acesso. Ao alterar o texto, suba a versão aqui e em backend/src/config/termos.js:
 * todos os usuários precisarão aceitar de novo no próximo login.
 */
export const VERSAO_TERMOS = '1.0';

export const TITULO_TERMOS = 'Termos de Uso e Política de Privacidade';

export const SECOES_TERMOS: { titulo: string; texto: string }[] = [
  {
    titulo: '1. Sobre a plataforma',
    texto:
      'O On the job é a plataforma digital de acompanhamento do programa de integração (onboarding) de novos colaboradores. Ela registra atividades, feedbacks e assinaturas do processo, com acesso de RH, gestores e colaboradores.',
  },
  {
    titulo: '2. Dados pessoais coletados',
    texto:
      'Tratamos os dados informados no seu cadastro (nome, e-mail, telefone, cargo e área), os registros da sua jornada (atividades, datas de início e conclusão, feedbacks) e as assinaturas digitais do termo de conclusão, além de dados técnicos de acesso, como data e hora do login.',
  },
  {
    titulo: '3. Finalidade do tratamento',
    texto:
      'Os dados são usados exclusivamente para conduzir, acompanhar e comprovar o programa de integração: organizar as atividades, permitir o acompanhamento pelo gestor e pelo RH, registrar feedbacks e formalizar a conclusão do programa.',
  },
  {
    titulo: '4. Base legal',
    texto:
      'O tratamento se apoia na execução do contrato de trabalho e no cumprimento de obrigações legais e regulatórias do empregador (art. 7º, incisos II e V, da LGPD), bem como no legítimo interesse em acompanhar a integração dos colaboradores.',
  },
  {
    titulo: '5. Compartilhamento',
    texto:
      'Seus dados são acessados apenas por quem participa do seu processo: você, seu gestor e a equipe de RH. Cada perfil enxerga somente o que lhe cabe. Os dados não são vendidos nem compartilhados com terceiros, exceto quando exigido por lei ou por ordem de autoridade competente.',
  },
  {
    titulo: '6. Armazenamento e segurança',
    texto:
      'Os dados ficam armazenados em ambiente protegido, com senhas criptografadas, acesso por login individual e bloqueio após tentativas incorretas. Eles são mantidos pelo tempo necessário às finalidades acima e aos prazos legais aplicáveis.',
  },
  {
    titulo: '7. Seus direitos',
    texto:
      'Você pode, a qualquer momento, solicitar a confirmação e o acesso aos seus dados, a correção de dados incompletos ou desatualizados, informações sobre o compartilhamento e a eliminação de dados desnecessários, nos termos do art. 18 da LGPD. Para isso, procure a equipe de RH.',
  },
  {
    titulo: '8. Responsabilidades do usuário',
    texto:
      'Você se compromete a manter sua senha em sigilo, a não compartilhar seu acesso e a usar a plataforma apenas para as finalidades do programa. As informações de outros colaboradores que você eventualmente acessar são confidenciais.',
  },
  {
    titulo: '9. Alterações',
    texto:
      'Estes termos podem ser atualizados. Quando isso acontecer, a nova versão será apresentada no seu próximo acesso e precisará ser aceita para continuar usando a plataforma.',
  },
];

