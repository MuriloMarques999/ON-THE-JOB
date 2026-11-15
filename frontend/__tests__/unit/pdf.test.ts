import { SECOES_TERMOS, TITULO_TERMOS } from '../../src/constants/termos';
import { documentoConclusao } from '../../src/services/pdf/conclusao';
import { dataHora } from '../../src/services/pdf/modelo';
import { documentoTermos } from '../../src/services/pdf/termos';
import type { DadosConclusao } from '../../src/services/pdf/conclusao';

describe('builders de documentos PDF', () => {
  it('CT-PDF-101 formata datas e ausências sem dependência de renderizador nativo', () => {
    expect(dataHora('2026-10-29')).toBe('29/10/2026');
    expect(dataHora('2026-10-29 14:03:11')).toBe('29/10/2026 às 14:03');
    expect(dataHora(undefined)).toBe('-');
  });

  it('CT-PDF-102 inclui conteúdo, dados de aceite e perfil no comprovante dos termos', () => {
    const pdf = documentoTermos({
      nome: 'Ana Silva',
      email: 'ana@platform.com',
      perfil: 'gestor',
      aceitoEm: '2026-03-10 09:14:00',
      versao: '1.0',
    });

    expect(pdf).toMatchObject({
      titulo: `${TITULO_TERMOS} - Ana Silva`,
      arquivo: 'termos-de-uso-lgpd-v1.0.pdf',
    });
    expect(pdf.blocos).toContainEqual({ tipo: 'subtitulo', texto: 'Versão 1.0' });
    expect(pdf.blocos).toContainEqual({ tipo: 'subsecao', texto: SECOES_TERMOS[0].titulo });
    expect(pdf.blocos).toContainEqual({
      tipo: 'campos',
      itens: [
        ['Nome', 'Ana Silva'],
        ['E-mail', 'ana@platform.com'],
        ['Perfil', 'Gestor'],
        ['Aceito em', '10/03/2026 às 09:14'],
        ['Versão dos termos', '1.0'],
      ],
    });
  });

  it('CT-PDF-103 resume conclusão, atrasos, feedback e assinaturas no termo de onboarding', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-10T12:00:00'));
    const dados: DadosConclusao = {
      colaborador: { nome: 'Ana Silva', cargo: 'Analista', email: 'ana@platform.com' },
      inicio: '2026-02-01',
      fim: '2026-03-08',
      semanas: [
        {
          semana: 1,
          tema: 'Integração',
          atividades: [
            {
              id: 'c-1-a1',
              semana: 1,
              titulo: 'Apresentação',
              envolvidos: 'RH - Colaborador',
              inicio: '2026-02-02',
              prazo: '2026-02-04',
              iniciadaEm: '2026-02-02',
              concluidaEm: '2026-02-04',
              status: 'concluida',
              comAtraso: false,
              podeIniciar: true,
            },
            {
              id: 'c-1-a2',
              semana: 1,
              titulo: 'Acessos',
              envolvidos: 'RH - Colaborador',
              inicio: '2026-02-03',
              prazo: '2026-02-05',
              concluidaEm: '2026-02-06',
              status: 'concluida',
              comAtraso: true,
              podeIniciar: true,
            },
            {
              id: 'c-1-a3',
              semana: 1,
              titulo: 'Treinamento',
              envolvidos: 'Gestor - Colaborador',
              inicio: '2026-02-04',
              prazo: '2026-02-06',
              status: 'pendente',
              comAtraso: false,
              podeIniciar: true,
            },
          ],
        },
      ],
      feedbacks: [{ texto: 'Ótimo trabalho', data: '2026-02-07', autor: 'João Silva' }],
      assinaturaColaborador: { nome: 'Ana Silva', data: '2026-03-09' },
      assinaturaGestor: { nome: 'João Silva', data: '2026-03-10' },
    };

    try {
      const pdf = documentoConclusao(dados);
      expect(pdf).toMatchObject({
        titulo: 'Termo de Conclusão do Onboarding - Ana Silva',
        arquivo: 'termo-de-conclusao-ana-silva.pdf',
      });
      expect(pdf.blocos).toContainEqual({
        tipo: 'subtitulo',
        texto: 'Formulário On The Job • emitido em 10/03/2026',
      });
      expect(pdf.blocos).toContainEqual({
        tipo: 'campos',
        itens: expect.arrayContaining([
          ['Atividades concluídas', '2 de 3 (67%)'],
          ['Concluídas no prazo', '1'],
          ['Concluídas com atraso', '1'],
          ['Feedbacks recebidos', '1'],
          ['Última atividade concluída em', '06/02/2026'],
        ]),
      });
      expect(pdf.blocos).toContainEqual({
        tipo: 'texto',
        texto: '07/02/2026 - João Silva: "Ótimo trabalho"',
      });
      expect(pdf.blocos).toContainEqual({
        tipo: 'assinaturas',
        itens: [
          { papel: 'Colaborador', nome: 'Ana Silva', data: '09/03/2026' },
          { papel: 'Gestor responsável', nome: 'João Silva', data: '10/03/2026' },
        ],
      });
    } finally {
      jest.useRealTimers();
    }
  });
});
