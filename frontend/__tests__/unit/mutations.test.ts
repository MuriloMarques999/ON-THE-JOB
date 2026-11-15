import {
  adicionarColaborador,
  adicionarGestor,
  assinarDocumento,
  assinarDocumentoGestor,
  concluirAtividade,
  enviarFeedback,
  iniciarAtividade,
  solicitarAssinatura,
} from '../../src/data/mutations';
import type { Atividade, Db, Pessoa } from '../../src/data/types';

const rh: Pessoa = {
  id: 'rh-1',
  nome: 'Camila Rocha',
  email: 'rh@platform.com',
  perfil: 'rh',
  cargo: 'RH',
};
const gestor: Pessoa = {
  id: 'g-1',
  nome: 'João Gestor',
  email: 'gestor@platform.com',
  perfil: 'gestor',
  cargo: 'Gestor',
};
const colaborador: Pessoa = {
  id: 'c-1',
  nome: 'Anne Colaboradora',
  email: 'colaborador@platform.com',
  perfil: 'colaborador',
  cargo: 'Analista',
  gestorId: 'g-1',
  dataInicio: '2026-01-01',
};
const pessoaOutraEquipe: Pessoa = {
  ...colaborador,
  id: 'c-2',
  nome: 'Bia Colaboradora',
  email: 'bia@platform.com',
  gestorId: 'g-2',
};

const atividade = (sobrescritos: Partial<Atividade> = {}): Atividade => ({
  id: 'c-1-a1',
  colaboradorId: 'c-1',
  semana: 1,
  titulo: 'Atividade',
  envolvidos: 'Colaborador',
  inicio: '2026-03-10',
  prazo: '2026-03-12',
  ...sobrescritos,
});

const baseDb = (): Db => ({
  pessoas: [rh, gestor, colaborador, pessoaOutraEquipe],
  atividades: [atividade()],
  documentos: [
    {
      id: 'c-1-d1',
      colaboradorId: 'c-1',
      tipo: 'conclusao',
      titulo: 'Termo de conclusão do onboarding',
      criadoEm: '2026-03-10',
    },
  ],
  biblioteca: [],
  feedbacks: [],
  eventos: [],
});

function congelarProfundo<T>(valor: T): T {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    Object.freeze(valor);
    Object.values(valor).forEach(congelarProfundo);
  }
  return valor;
}

describe('mutations imutáveis e permissões', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('CT-CAD-101 só permite RH cadastrar colaborador ou gestor', () => {
    const db = baseDb();
    const dadosColaborador = {
      nome: 'Nova Pessoa',
      email: 'nova@platform.com',
      telefone: '',
      cargo: 'Analista',
      gestorId: 'g-1',
    };
    const dadosGestor = {
      nome: 'Novo Gestor',
      email: 'novo.gestor@platform.com',
      telefone: '',
      cargo: 'Gestor',
    };

    expect(adicionarColaborador(db, gestor, dadosColaborador)).toEqual({
      erro: 'Você não tem permissão para cadastrar colaboradores.',
    });
    expect(adicionarColaborador(db, null, dadosColaborador)).toEqual({
      erro: 'Você não tem permissão para cadastrar colaboradores.',
    });
    expect(adicionarGestor(db, colaborador, dadosGestor)).toEqual({
      erro: 'Você não tem permissão para cadastrar gestores.',
    });
  });

  it('CT-CAD-102 normaliza e-mail e rejeita duplicidade sem diferenciar maiúsculas', () => {
    const dados = {
      nome: 'Nova Pessoa',
      email: ' COLABORADOR@PLATFORM.COM ',
      telefone: '',
      cargo: 'Analista',
      gestorId: 'g-1',
    };

    expect(adicionarColaborador(baseDb(), rh, dados)).toEqual({
      erro: 'Já existe uma pessoa cadastrada com este e-mail.',
    });
    expect(
      adicionarGestor(baseDb(), rh, {
        nome: 'Outro Gestor',
        email: ' GESTOR@PLATFORM.COM ',
        telefone: '',
        cargo: 'Gestor',
      })
    ).toEqual({ erro: 'Já existe uma pessoa cadastrada com este e-mail.' });
  });

  it('CT-CAD-103 valida existência do gestor após verificar e-mail duplicado', () => {
    const dados = {
      nome: 'Nova Pessoa',
      email: 'nova@platform.com',
      telefone: '',
      cargo: 'Analista',
      gestorId: 'inexistente',
    };

    expect(adicionarColaborador(baseDb(), rh, dados)).toEqual({
      erro: 'Gestor responsável não encontrado.',
    });
    expect(
      adicionarColaborador(baseDb(), rh, { ...dados, email: 'RH@PLATFORM.COM' })
    ).toEqual({ erro: 'Já existe uma pessoa cadastrada com este e-mail.' });
  });

  it('CT-CAD-104 usa a data atual ao cadastrar colaborador e gestor', () => {
    jest.useFakeTimers({ now: new Date('2026-03-10T12:00:00') });
    const spyDateNow = jest.spyOn(Date, 'now').mockReturnValue(12345);

    const novoColaborador = adicionarColaborador(baseDb(), rh, {
      nome: '  Ana  Silva  ',
      email: ' ANA@PLATFORM.COM ',
      telefone: '123',
      cargo: ' Analista ',
      gestorId: 'g-1',
    });
    const novoGestor = adicionarGestor(baseDb(), rh, {
      nome: ' Pedro Souza ',
      email: 'pedro@platform.com',
      telefone: '',
      cargo: ' Gestor ',
    });

    expect('erro' in novoColaborador).toBe(false);
    if ('db' in novoColaborador) {
      expect(novoColaborador.db.pessoas.at(-1)).toMatchObject({
        id: 'c-12345',
        nome: 'Ana  Silva',
        email: 'ana@platform.com',
        dataInicio: '2026-03-10',
      });
      expect(novoColaborador.db.atividades.filter((item) => item.colaboradorId === 'c-12345')).toHaveLength(25);
    }
    expect('erro' in novoGestor).toBe(false);
    if ('db' in novoGestor) {
      expect(novoGestor.db.pessoas.at(-1)).toMatchObject({
        id: 'g-12345',
        nome: 'Pedro Souza',
        email: 'pedro@platform.com',
      });
      expect(novoGestor.db.eventos[0].data).toBe('2026-03-10');
    }

    spyDateNow.mockRestore();
  });

  it('CT-API-104 rejeita solicitação de assinatura por perfil, documento ausente ou já assinado', () => {
    const db = baseDb();
    expect(solicitarAssinatura(db, gestor, 'c-1-d1')).toEqual({
      erro: 'Você não tem permissão para solicitar assinaturas.',
    });
    expect(solicitarAssinatura(db, rh, 'ausente')).toEqual({
      erro: 'Documento não encontrado.',
    });
    const assinados = {
      ...db,
      documentos: [
        { ...db.documentos[0], assinadoColaboradorEm: '2026-03-10', assinadoGestorEm: '2026-03-10' },
      ],
    };
    expect(solicitarAssinatura(assinados, rh, 'c-1-d1')).toEqual({
      erro: 'Este documento já foi assinado.',
    });
    expect(solicitarAssinatura(db, rh, 'c-1-d1')).toEqual({ db });
  });

  it('CT-ATV-101 inicia e conclui atividades com data injetada sem alterar a base congelada', () => {
    const db = congelarProfundo(baseDb());
    const iniciado = iniciarAtividade(db, colaborador, 'c-1-a1', '2026-03-11');
    expect('db' in iniciado && iniciado.db.atividades[0].iniciadaEm).toBe('2026-03-11');
    expect(Object.isFrozen(db.atividades[0])).toBe(true);
    expect(db.atividades[0].iniciadaEm).toBeUndefined();

    const concluido = concluirAtividade(db, colaborador, 'c-1-a1', '2026-03-12');
    expect('db' in concluido && concluido.db.atividades[0]).toMatchObject({
      iniciadaEm: '2026-03-12',
      concluidaEm: '2026-03-12',
    });
    expect(db.atividades[0].concluidaEm).toBeUndefined();
  });

  it('CT-ATV-102 preserva mensagens e ordem de validação de iniciar/concluir', () => {
    const db = baseDb();
    expect(iniciarAtividade(db, gestor, 'c-1-a1', '2026-03-10')).toEqual({
      erro: 'Apenas o colaborador pode alterar as próprias atividades.',
    });
    expect(iniciarAtividade(db, colaborador, 'outra', '2026-03-10')).toEqual({
      erro: 'Atividade não encontrada.',
    });
    expect(iniciarAtividade(db, colaborador, 'c-1-a1', '2026-03-09')).toEqual({
      erro: 'Esta atividade ainda não está disponível para início.',
    });
    expect('db' in iniciarAtividade(db, colaborador, 'c-1-a1', '2026-03-10')).toBe(true);

    const iniciada = { ...db, atividades: [atividade({ iniciadaEm: '2026-03-10' })] };
    expect(iniciarAtividade(iniciada, colaborador, 'c-1-a1', '2026-03-11')).toEqual({
      erro: 'Esta atividade já foi iniciada.',
    });
    expect(concluirAtividade(db, colaborador, 'c-1-a1', '2026-03-09')).toEqual({
      erro: 'Esta atividade ainda não está disponível.',
    });
    const concluida = { ...db, atividades: [atividade({ concluidaEm: '2026-03-10' })] };
    expect(iniciarAtividade(concluida, colaborador, 'c-1-a1', '2026-03-11')).toEqual({
      erro: 'Esta atividade já foi concluída.',
    });
    expect(concluirAtividade(concluida, colaborador, 'c-1-a1', '2026-03-11')).toEqual({
      erro: 'Esta atividade já foi concluída.',
    });
  });

  it('CT-ASS-102 exige conclusão, nome completo e normaliza espaços na assinatura do colaborador', () => {
    const db = baseDb();
    expect(assinarDocumento(db, gestor, 'c-1-d1', 'Ana Silva', '2026-03-10')).toEqual({
      erro: 'Apenas o colaborador pode assinar nesta etapa.',
    });
    expect(assinarDocumento(db, colaborador, 'ausente', 'Ana Silva', '2026-03-10')).toEqual({
      erro: 'Documento não encontrado.',
    });
    expect(
      assinarDocumento(
        { ...db, documentos: [{ ...db.documentos[0], assinadoColaboradorEm: '2026-03-09' }] },
        colaborador,
        'c-1-d1',
        'Ana Silva',
        '2026-03-10'
      )
    ).toEqual({ erro: 'Você já assinou este documento.' });
    expect(assinarDocumento(db, colaborador, 'c-1-d1', 'Ana Silva', '2026-03-10')).toEqual({
      erro: 'Conclua todas as atividades antes de assinar.',
    });

    const prontas: Db = {
      ...db,
      atividades: [atividade({ concluidaEm: '2026-03-10' })],
    };
    expect(assinarDocumento(prontas, colaborador, 'c-1-d1', 'Ana', '2026-03-10')).toEqual({
      erro: 'Digite seu nome completo para assinar.',
    });
    const assinatura = assinarDocumento(prontas, colaborador, 'c-1-d1', '  Ana   Silva  ', '2026-03-10');
    expect('db' in assinatura && assinatura.db.documentos[0]).toMatchObject({
      assinadoColaboradorEm: '2026-03-10',
      assinaturaColaborador: 'Ana Silva',
    });
  });

  it('CT-EQP-101 limita feedback ao gestor da equipe e remove espaços externos', () => {
    const db = baseDb();
    expect(enviarFeedback(db, colaborador, 'c-1', 'Bom trabalho', '2026-03-10')).toEqual({
      erro: 'Apenas o gestor pode enviar feedbacks.',
    });
    expect(enviarFeedback(db, { ...gestor, id: 'g-2' }, 'c-1', 'Bom', '2026-03-10')).toEqual({
      erro: 'Colaborador não encontrado na sua equipe.',
    });
    expect(enviarFeedback(db, gestor, 'c-1', '   ', '2026-03-10')).toEqual({
      erro: 'Escreva o feedback antes de enviar.',
    });
    const resultado = enviarFeedback(db, gestor, 'c-1', '  Bom trabalho  ', '2026-03-10');
    expect('db' in resultado && resultado.db.feedbacks[0]).toMatchObject({
      colaboradorId: 'c-1',
      gestorId: 'g-1',
      texto: 'Bom trabalho',
      data: '2026-03-10',
    });
    expect(db.feedbacks).toEqual([]);
  });

  it('CT-ASS-103 exige equipe própria, atividades concluídas e assinatura do colaborador antes do gestor', () => {
    const db = baseDb();
    expect(assinarDocumentoGestor(db, colaborador, 'c-1-d1', 'João Silva', '2026-03-10')).toEqual({
      erro: 'Apenas o gestor pode assinar nesta etapa.',
    });
    expect(assinarDocumentoGestor(db, gestor, 'ausente', 'João Silva', '2026-03-10')).toEqual({
      erro: 'Documento não encontrado.',
    });
    const foraEquipe = { ...db, documentos: [{ ...db.documentos[0], colaboradorId: 'c-2' }] };
    expect(assinarDocumentoGestor(foraEquipe, gestor, 'c-1-d1', 'João Silva', '2026-03-10')).toEqual({
      erro: 'Documento não encontrado.',
    });

    const prontas = { ...db, atividades: [atividade({ concluidaEm: '2026-03-10' })] };
    expect(assinarDocumentoGestor(prontas, gestor, 'c-1-d1', 'João Silva', '2026-03-10')).toEqual({
      erro: 'O colaborador ainda não assinou este documento.',
    });
    const assinadas = {
      ...prontas,
      documentos: [{ ...prontas.documentos[0], assinadoColaboradorEm: '2026-03-09' }],
    };
    expect(assinarDocumentoGestor(assinadas, gestor, 'c-1-d1', 'João', '2026-03-10')).toEqual({
      erro: 'Digite seu nome completo para assinar.',
    });
    const assinatura = assinarDocumentoGestor(assinadas, gestor, 'c-1-d1', 'João Silva', '2026-03-10');
    expect('db' in assinatura && assinatura.db.documentos[0]).toMatchObject({
      assinadoGestorEm: '2026-03-10',
      assinaturaGestor: 'João Silva',
    });
    expect(
      assinarDocumentoGestor(
        {
          ...assinadas,
          documentos: [{ ...assinadas.documentos[0], assinadoGestorEm: '2026-03-09' }],
        },
        gestor,
        'c-1-d1',
        'João Silva',
        '2026-03-10'
      )
    ).toEqual({ erro: 'Você já assinou este documento.' });
  });
});
