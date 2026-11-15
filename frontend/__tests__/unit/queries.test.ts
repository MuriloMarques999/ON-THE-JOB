import { criarDbInicial } from '../../src/data/seed';
import {
  colaboradoresVisiveis,
  consultarAcompanhamento,
  consultarAssinaturas,
  consultarAtividades,
  consultarDocumentos,
  consultarEquipe,
  consultarHomeColaborador,
  consultarHomeGestor,
  consultarHomeRH,
  consultarPainelGestores,
  listarGestores,
  statusJornada,
} from '../../src/data/queries';
import type { Pessoa } from '../../src/data/types';

const db = criarDbInicial('2026-03-10');
const rh = db.pessoas.find((p) => p.id === 'rh-1')!;
const gestor = db.pessoas.find((p) => p.id === 'g-1')!;
const colaborador = db.pessoas.find((p) => p.id === 'c-1')!;
const outroGestor = db.pessoas.find((p) => p.id === 'g-2')!;
const semSessao: Pessoa | null = null;

describe('consultas do frontend com seed fixo', () => {
  it('CT-QRY-101 limita colaboradores visíveis por perfil e só lista gestores para RH', () => {
    expect(colaboradoresVisiveis(db, rh)).toHaveLength(10);
    expect(colaboradoresVisiveis(db, gestor).map((p) => p.id)).toEqual([
      'c-1',
      'c-2',
      'c-6',
      'c-7',
      'c-9',
      'c-10',
      'c-8',
    ]);
    expect(colaboradoresVisiveis(db, colaborador).map((p) => p.id)).toEqual(['c-1']);
    expect(listarGestores(db, rh)).toEqual([
      { id: 'g-1', nome: 'João Vitor Nogueira' },
      { id: 'g-2', nome: 'Carlos Meneses' },
    ]);
    expect(listarGestores(db, gestor)).toEqual([]);
    expect(listarGestores(db, semSessao)).toEqual([]);
  });

  it('CT-QRY-102 calcula status da jornada e contagens consistentes na home RH', () => {
    expect(statusJornada(db, 'c-1', '2026-03-10')).toBe('atrasada');
    expect(statusJornada(db, 'c-4', '2026-03-10')).toBe('concluida');
    expect(statusJornada(db, 'c-7', '2026-03-10')).toBe('pendente');
    expect(consultarHomeRH(db, rh, '2026-03-10').contagens).toEqual({
      emOnboarding: 6,
      concluidas: 4,
      atrasadas: 3,
      gestores: 2,
    });
    expect(consultarHomeRH(db, gestor, '2026-03-10').contagens.emOnboarding).toBe(0);
    expect(consultarHomeRH(db, semSessao, '2026-03-10').contagens.concluidas).toBe(0);
  });

  it('CT-QRY-103 filtra acompanhamento RH e calcula progresso com a mesma base', () => {
    const todos = consultarAcompanhamento(db, rh, undefined, '2026-03-10');
    expect(todos).toHaveLength(10);
    expect(todos.find((item) => item.id === 'c-1')).toMatchObject({
      nome: 'Anne Carlini',
      concluidas: 6,
      total: 25,
      percentual: 24,
      status: 'atrasada',
    });
    expect(consultarAcompanhamento(db, rh, 'concluidas', '2026-03-10').map((item) => item.status)).toEqual([
      'concluida',
      'concluida',
      'concluida',
      'concluida',
    ]);
    expect(consultarAcompanhamento(db, rh, 'atrasadas', '2026-03-10')).toHaveLength(3);
    expect(consultarAcompanhamento(db, rh, 'em_onboarding', '2026-03-10')).toHaveLength(6);
    expect(consultarAcompanhamento(db, gestor, undefined, '2026-03-10')).toEqual([]);
    expect(consultarAcompanhamento(db, semSessao, undefined, '2026-03-10')).toEqual([]);
  });

  it('CT-QRY-104 calcula atividade e home apenas para o colaborador autenticado', () => {
    const atividades = consultarAtividades(db, colaborador, '2026-03-10');
    expect(atividades).toMatchObject({
      hoje: '2026-03-10',
      total: 25,
      concluidas: 6,
      percentual: 24,
    });
    expect(atividades.semanas.flatMap((semana) => semana.atividades)).toHaveLength(25);
    expect(consultarAtividades(db, gestor, '2026-03-10').semanas).toEqual([]);

    const home = consultarHomeColaborador(db, colaborador, '2026-03-10');
    expect(home).toMatchObject({
      concluidas: 6,
      total: 25,
      percentual: 24,
      todasConcluidas: false,
    });
    expect(home.proximas).toHaveLength(2);
    expect(home.proximas[0].prazo <= home.proximas[1].prazo).toBe(true);
    expect(home.feedbacks).toMatchObject([
      {
        id: 'f-1',
        texto: expect.any(String),
        autor: 'João Vitor Nogueira',
      },
    ]);
    expect(consultarHomeColaborador(db, gestor, '2026-03-10').total).toBe(0);
  });

  it('CT-QRY-105 libera documentos e biblioteca conforme as assinaturas existentes', () => {
    const documentos = consultarDocumentos(db, colaborador);
    expect(documentos).toMatchObject({
      nome: 'Anne Carlini',
      inicio: '2026-02-26',
      fim: '2026-04-02',
      atividadesRealizadas: 6,
      total: 25,
      liberado: false,
      documentoId: 'c-1-d1',
      biblioteca: db.biblioteca,
    });
    expect(consultarDocumentos(db, gestor).nome).toBe('');

    const documentoGestor = consultarDocumentos(db, db.pessoas.find((p) => p.id === 'c-9')!);
    expect(documentoGestor.assinaturaColaborador).toMatchObject({ nome: 'Diego Martins' });
    expect(documentoGestor.assinaturaGestor).toBeUndefined();
    expect(documentoGestor.biblioteca).toEqual(db.biblioteca);

    const documentoConcluido = consultarDocumentos(db, db.pessoas.find((p) => p.id === 'c-4')!);
    expect(documentoConcluido.assinaturaGestor).toMatchObject({ nome: 'Carlos Meneses' });
    expect(documentoConcluido.biblioteca).toHaveLength(db.biblioteca.length + 1);
    expect(documentoConcluido.biblioteca.at(-1)?.id).toBe('form-c-4');
  });

  it('CT-QRY-106 restringe equipe, prioridade, pendências e filtro de status do gestor', () => {
    const equipe = consultarEquipe(db, gestor, undefined, '2026-03-10');
    expect(equipe.itens).toHaveLength(7);
    expect(equipe.itens[0].status).toBe('atrasada');
    expect(equipe.itens.some((item) => item.id === 'c-3')).toBe(false);
    expect(consultarEquipe(db, gestor, 'atrasada', '2026-03-10').itens.map((item) => item.status)).toEqual([
      'atrasada',
      'atrasada',
    ]);
    expect(consultarEquipe(db, outroGestor, undefined, '2026-03-10').itens).toHaveLength(3);
    expect(consultarEquipe(db, rh, undefined, '2026-03-10').itens).toEqual([]);

    const home = consultarHomeGestor(db, gestor, '2026-03-10');
    expect(home.totalEquipe).toBe(7);
    expect(home.equipe).toHaveLength(3);
    expect(home.atencao.every((item) => !item.concluido)).toBe(true);
    expect(consultarHomeGestor(db, semSessao, '2026-03-10')).toEqual({
      equipe: [],
      totalEquipe: 0,
      atencao: [],
    });
  });

  it('CT-QRY-107 lista assinaturas disponíveis somente após concluir atividades e ordena pendências', () => {
    const assinaturas = consultarAssinaturas(db, rh);
    expect(assinaturas.pendentes.map((item) => item.id)).toContain('c-6-d1');
    expect(assinaturas.pendentes.map((item) => item.id)).toContain('c-9-d1');
    expect(assinaturas.assinados.map((item) => item.id)).toContain('c-4-d1');
    expect(assinaturas.pendentes.map((item) => item.data)).toEqual(
      [...assinaturas.pendentes.map((item) => item.data)].sort()
    );
    expect(consultarAssinaturas(db, gestor)).toEqual({ assinados: [], pendentes: [] });

    const painel = consultarPainelGestores(db, rh, '2026-03-10');
    expect(painel.resumo).toMatchObject({ gestores: 2, colaboradores: 10, atrasados: 3 });
    expect(painel.gestores).toHaveLength(2);
    expect(consultarPainelGestores(db, semSessao, '2026-03-10').gestores).toEqual([]);
  });
});
