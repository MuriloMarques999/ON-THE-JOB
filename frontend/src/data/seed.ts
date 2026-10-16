import { criarAtividades, criarDocumentos } from './jornada';
import type { Db, Pessoa, StatusAtividade } from './types';

/*
 * DADOS DE EXEMPLO (descartável quando o backend existir).
 * Os e-mails de rh@, gestor@ e colaborador@platform.com são os mesmos dos usuários de teste do login.
 */

// Primeiras `concluidas` atividades concluídas, depois os status de `proximas`, o resto pendente.
const padrao =
  (concluidas: number, proximas: StatusAtividade[] = []) =>
  (i: number): StatusAtividade =>
    i < concluidas ? 'concluida' : (proximas[i - concluidas] ?? 'pendente');

export function criarDbInicial(): Db {
  const pessoas: Pessoa[] = [
    { id: 'rh-1', nome: 'Camila Rocha', email: 'rh@platform.com', perfil: 'rh', cargo: 'Analista de RH' },

    { id: 'g-1', nome: 'João Vitor Nogueira', email: 'gestor@platform.com', perfil: 'gestor', cargo: 'Gestor de Tecnologia', area: 'Tecnologia' },
    { id: 'g-2', nome: 'Carlos Meneses', email: 'carlos.meneses@platform.com', perfil: 'gestor', cargo: 'Gestor de Operações', area: 'Operações' },

    // Equipe do João
    { id: 'c-1', nome: 'Anne Carlini', email: 'colaborador@platform.com', perfil: 'colaborador', cargo: 'Product Manager', gestorId: 'g-1', dataInicio: '2026-09-01' },
    { id: 'c-2', nome: 'Matheus Silva Santos', email: 'matheus.santos@platform.com', perfil: 'colaborador', cargo: 'Desenvolvedor', gestorId: 'g-1', dataInicio: '2026-09-10' },

    // Equipe do Carlos (o João não enxerga estas pessoas)
    { id: 'c-3', nome: 'Beatriz Lima', email: 'beatriz.lima@platform.com', perfil: 'colaborador', cargo: 'Analista de Operações', gestorId: 'g-2', dataInicio: '2026-08-15' },
    { id: 'c-4', nome: 'Rafael Torres', email: 'rafael.torres@platform.com', perfil: 'colaborador', cargo: 'Analista de Logística', gestorId: 'g-2', dataInicio: '2026-08-03' },
    { id: 'c-5', nome: 'Julia Mendes', email: 'julia.mendes@platform.com', perfil: 'colaborador', cargo: 'Assistente Administrativo', gestorId: 'g-2', dataInicio: '2026-09-14' },
  ];

  return {
    pessoas,

    atividades: [
      ...criarAtividades('c-1', '2026-09-01', padrao(10, ['atrasada'])), // 50%, com atraso
      ...criarAtividades('c-2', '2026-09-10', padrao(5, ['em_andamento'])), // 25%, em dia
      ...criarAtividades('c-3', '2026-08-15', padrao(12, ['em_andamento'])), // 60%
      ...criarAtividades('c-4', '2026-08-03', padrao(20)), // 100%
      ...criarAtividades('c-5', '2026-09-14', padrao(2, ['atrasada', 'atrasada', 'atrasada'])), // 10%, atrasada
    ],

    documentos: [
      ...criarDocumentos('c-1', { ciencia: ['2026-09-02', undefined] }), // falta o gestor assinar
      ...criarDocumentos('c-2'), // falta o colaborador assinar
      ...criarDocumentos('c-3', { ciencia: ['2026-08-16', '2026-08-17'] }),
      ...criarDocumentos('c-4', { ciencia: ['2026-08-04', '2026-08-05'], conclusao: ['2026-09-08', '2026-09-09'] }),
      ...criarDocumentos('c-5', { ciencia: ['2026-09-15', undefined] }),
    ],

    feedbacks: [
      {
        id: 'f-1',
        colaboradorId: 'c-1',
        gestorId: 'g-1',
        texto: 'Boa evolução técnica, está se ambientando no ambiente de trabalho e se aprofundando nas ferramentas internas.',
        data: '2026-09-11',
      },
      {
        id: 'f-2',
        colaboradorId: 'c-3',
        gestorId: 'g-2',
        texto: 'Ótima comunicação com a equipe e muito proativa nas entregas.',
        data: '2026-09-05',
      },
    ],

    eventos: [
      { id: 'e-1', texto: 'Lembrete automático enviado para 4 colaboradores com prazo em 2 dias.', data: '2026-10-03' },
      { id: 'e-2', texto: 'Alerta de atraso de assinatura de documento enviado ao gestor João Nogueira.', data: '2026-10-02' },
    ],
  };
}
