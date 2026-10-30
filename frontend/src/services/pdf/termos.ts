import { SECOES_TERMOS, TITULO_TERMOS } from '@/constants/termos';

import { dataHora, type DocumentoPdf } from './modelo';

// Dados do aceite que vão no fim do PDF (comprovante para a LGPD)
export type RegistroAceite = {
  nome: string;
  email: string;
  perfil: 'rh' | 'gestor' | 'colaborador';
  aceitoEm: string; // "AAAA-MM-DD" ou "AAAA-MM-DD hh:mm:ss"
  versao: string;
};

const PERFIS: Record<RegistroAceite['perfil'], string> = { rh: 'RH', gestor: 'Gestor', colaborador: 'Colaborador' };

// PDF dos termos de uso / LGPD aceitos, com o registro do aceite
export function documentoTermos(r: RegistroAceite): DocumentoPdf {
  return {
    titulo: `${TITULO_TERMOS} - ${r.nome}`,
    arquivo: `termos-de-uso-lgpd-v${r.versao}.pdf`,
    blocos: [
      { tipo: 'marca', texto: 'On the job' },
      { tipo: 'titulo', texto: TITULO_TERMOS },
      { tipo: 'subtitulo', texto: `Versão ${r.versao}` },
      ...SECOES_TERMOS.flatMap((s) => [
        { tipo: 'subsecao' as const, texto: s.titulo },
        { tipo: 'texto' as const, texto: s.texto },
      ]),
      { tipo: 'separador' },
      { tipo: 'secao', texto: 'Registro de aceite' },
      {
        tipo: 'campos',
        itens: [
          ['Nome', r.nome],
          ['E-mail', r.email],
          ['Perfil', PERFIS[r.perfil]],
          ['Aceito em', dataHora(r.aceitoEm)],
          ['Versão dos termos', r.versao],
        ],
      },
      {
        tipo: 'texto',
        pequeno: true,
        texto:
          'O usuário declarou ter lido e aceito os Termos de Uso e a Política de Privacidade, autorizando o tratamento dos seus dados pessoais conforme a LGPD (Lei nº 13.709/2018).',
      },
    ],
  };
}
