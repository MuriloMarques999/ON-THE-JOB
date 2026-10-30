import { VERSAO_TERMOS } from '@/constants/termos';
import { hojeISO } from '@/data/jornada';
import {
  adicionarColaborador,
  adicionarGestor,
  assinarDocumento,
  assinarDocumentoGestor,
  concluirAtividade,
  enviarFeedback,
  iniciarAtividade,
  solicitarAssinatura,
  type NovoColaborador,
  type NovoGestor,
  type ResultadoDb,
} from '@/data/mutations';
import {
  consultarAcompanhamento,
  consultarAssinaturaGestor,
  consultarAssinaturas,
  consultarAtencao,
  consultarAtividades,
  consultarDocumentos,
  consultarEquipe,
  consultarHomeColaborador,
  consultarHomeGestor,
  consultarHomeRH,
  consultarPainelGestores,
  listarGestores,
} from '@/data/queries';
import { criarDbInicial } from '@/data/seed';
import type { DadosConclusao } from '@/services/pdf/conclusao';
import type { Db, FiltroJornada, Perfil, Pessoa, StatusJornada } from '@/data/types';

/*
 * MODO DE TESTE (sem backend)
 * Ligado com `npm run mock` (EXPO_PUBLIC_MOCK=1). O api.ts entrega cada chamada para cá em vez de
 * usar a rede, e este arquivo responde como o servidor responderia, usando os dados de exemplo
 * (data/seed.ts) e as regras antigas do front (data/queries.ts e data/mutations.ts).
 *
 * - Usuários do seed entram com a senha 123456 (rh@, gestor@ e colaborador@platform.com, entre outros).
 * - Quem o RH cadastra fica "pendente" até concluir a conta pelo link do convite, que aparece na
 *   tela de login (e no console).
 * - No navegador, os dados ficam no localStorage: sobrevivem ao recarregar a página.
 *   Para começar do zero, use "Apagar dados de teste" na tela de login.
 */

export const MODO_TESTE = process.env.EXPO_PUBLIC_MOCK === '1';

const SENHA_PADRAO = '123456';
const CHAVE = 'on-the-job:mock';

type Conta = {
  senha: string | null; // null = convite ainda não concluído
  convite?: string;
  termosEm?: string;
  termosVersao?: string;
};

type Estado = { db: Db; contas: Record<string, Conta> };

export type Convite = { nome: string; email: string; perfil: Perfil; token: string };

/* ----------------------------- estado ----------------------------- */

function estadoInicial(): Estado {
  const db = criarDbInicial();
  const contas: Record<string, Conta> = {};
  for (const p of db.pessoas) contas[p.email] = { senha: SENHA_PADRAO };
  return { db, contas };
}

function carregar(): Estado {
  try {
    const salvo = globalThis.localStorage?.getItem(CHAVE);
    if (salvo) return JSON.parse(salvo) as Estado;
  } catch {
    // sem localStorage (celular) ou dado corrompido: começa do seed
  }
  return estadoInicial();
}

let estado: Estado = MODO_TESTE ? carregar() : { db: criarDbInicial(), contas: {} };

function salvar() {
  try {
    globalThis.localStorage?.setItem(CHAVE, JSON.stringify(estado));
  } catch {
    // só em memória
  }
}

export function apagarDadosTeste() {
  estado = estadoInicial();
  salvar();
}

// Convites ainda não concluídos (a tela de login mostra os links)
export function convitesPendentes(): Convite[] {
  return estado.db.pessoas
    .filter((p) => estado.contas[p.email]?.convite)
    .map((p) => ({ nome: p.nome, email: p.email, perfil: p.perfil, token: estado.contas[p.email].convite! }));
}

/* ----------------------------- respostas ----------------------------- */

type Resposta = { status: number; json: unknown };

const ok = (json: unknown = { ok: true }, status = 200): Resposta => ({ status, json });
const erro = (status: number, mensagem: string): Resposta => ({ status, json: { erro: mensagem } });

const termosAceitos = (email: string) => estado.contas[email]?.termosVersao === VERSAO_TERMOS;

function sessao(p: Pessoa) {
  const aceitos = termosAceitos(p.email);
  return {
    token: `mock-${p.id}`,
    usuario: {
      nome: p.nome,
      email: p.email,
      role: p.perfil,
      termosAceitos: aceitos,
      termosAceitosEm: aceitos ? estado.contas[p.email].termosEm ?? null : null,
    },
  };
}

function aplicar(r: ResultadoDb, sucesso: Resposta = ok()): Resposta {
  if ('erro' in r) return erro(r.erro.startsWith('Já') || r.erro.startsWith('Você já') ? 409 : 400, r.erro);
  estado = { ...estado, db: r.db };
  salvar();
  return sucesso;
}

// Mesmo perfil exigido por cada grupo de rotas no backend
function perfilDaRota(caminho: string): Perfil | null {
  if (/^\/(rh|gestores|colaboradores)(\/|$)/.test(caminho)) return 'rh';
  if (caminho.startsWith('/minha-jornada')) return 'colaborador';
  if (caminho.startsWith('/minha-equipe')) return 'gestor';
  return null;
}

function criarConvite(email: string) {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  estado.contas[email] = { senha: null, convite: token };
  return token;
}

function rotasAuth(caminho: string, corpo: Record<string, unknown>, viewer: Pessoa | null): Resposta {
  if (caminho === '/auth/login') {
    const email = String(corpo.email ?? '').trim().toLowerCase();
    const p = estado.db.pessoas.find((x) => x.email === email);
    const conta = estado.contas[email];
    if (!corpo.role || !email || !corpo.senha) return erro(400, 'Informe perfil, e-mail e senha.');
    if (!p || !conta) return erro(401, 'E-mail ou senha incorretos.');
    if (!conta.senha) return erro(403, 'Conclua seu cadastro pelo link enviado por e-mail.');
    if (conta.senha !== corpo.senha) return erro(401, 'E-mail ou senha incorretos.');
    if (p.perfil !== corpo.role) return erro(403, 'Este usuário não tem acesso ao perfil selecionado.');
    return ok(sessao(p));
  }

  if (caminho === '/auth/concluir-conta') {
    const email = String(corpo.email ?? '').trim().toLowerCase();
    const senha = String(corpo.senha ?? '');
    const conta = estado.contas[email];
    if (!conta?.convite || conta.convite !== corpo.token) return erro(400, 'Link inválido ou expirado.');
    estado.contas[email] = { senha };
    salvar();
    return ok();
  }

  if (caminho === '/auth/aceitar-termos') {
    if (!viewer) return erro(401, 'Faça login para continuar.');
    if (corpo.aceito !== true) return erro(400, 'É preciso aceitar os termos para continuar.');
    estado.contas[viewer.email] = { ...estado.contas[viewer.email], termosEm: hojeISO(), termosVersao: VERSAO_TERMOS };
    salvar();
    return ok(sessao(viewer));
  }

  return erro(404, 'Rota não encontrada.');
}

function rotasGet(rota: string, params: URLSearchParams, viewer: Pessoa): Resposta {
  const { db } = estado;
  let m: RegExpMatchArray | null;

  switch (rota) {
    case '/rh/home':
      return ok(consultarHomeRH(db, viewer));
    case '/rh/assinaturas':
      return ok(consultarAssinaturas(db, viewer));
    case '/rh/acompanhamento':
      return ok(consultarAcompanhamento(db, viewer, (params.get('filtro') || undefined) as FiltroJornada | undefined));
    case '/rh/painel-gestores':
      return ok(consultarPainelGestores(db, viewer));
    case '/gestores':
      return ok(listarGestores(db, viewer));
    case '/minha-jornada/home':
      return ok(consultarHomeColaborador(db, viewer));
    case '/minha-jornada/atividades':
      return ok(consultarAtividades(db, viewer));
    case '/minha-jornada/documentos': {
      const conta = estado.contas[viewer.email];
      const termos = conta?.termosEm ? { versao: conta.termosVersao, aceitoEm: conta.termosEm } : undefined;
      return ok({ ...consultarDocumentos(db, viewer), termos });
    }
    case '/minha-equipe/home':
      return ok(consultarHomeGestor(db, viewer));
    case '/minha-equipe/equipe':
      return ok(consultarEquipe(db, viewer, (params.get('status') || undefined) as StatusJornada | undefined));
    case '/minha-equipe/atencao':
      return ok(consultarAtencao(db, viewer));
  }

  if ((m = rota.match(/^\/minha-equipe\/documentos\/([^/]+)\/conclusao$/))) {
    const dados = conclusaoParaGestor(viewer, decodeURIComponent(m[1]));
    return dados ? ok(dados) : erro(404, 'Documento assinado não encontrado.');
  }
  if ((m = rota.match(/^\/minha-equipe\/documentos\/([^/]+)\/assinatura$/))) {
    const tela = consultarAssinaturaGestor(db, viewer, decodeURIComponent(m[1]));
    return tela ? ok(tela) : erro(404, 'Documento não encontrado.');
  }
  return erro(404, 'Rota não encontrada.');
}

// Termo de conclusão visto pelo gestor: montado com as MESMAS consultas da tela de Documentos do
// colaborador (como se fosse ele), para o PDF sair idêntico. Só da equipe dele e com as duas assinaturas.
function conclusaoParaGestor(gestor: Pessoa, documentoId: string): DadosConclusao | null {
  const { db } = estado;
  const doc = db.documentos.find((d) => d.id === documentoId);
  const colaborador = doc && db.pessoas.find((p) => p.id === doc.colaboradorId && p.gestorId === gestor.id);
  if (!doc || !colaborador) return null;

  const docs = consultarDocumentos(db, colaborador);
  if (!docs.assinaturaColaborador || !docs.assinaturaGestor) return null;

  return {
    colaborador: { nome: docs.nome, cargo: docs.cargo, email: colaborador.email },
    inicio: docs.inicio,
    fim: docs.fim,
    semanas: consultarAtividades(db, colaborador).semanas.map((sem) => ({
      semana: sem.semana,
      tema: docs.semanas.find((x) => x.semana === sem.semana)?.tema ?? '',
      atividades: sem.atividades,
    })),
    feedbacks: consultarHomeColaborador(db, colaborador).feedbacks,
    assinaturaColaborador: docs.assinaturaColaborador,
    assinaturaGestor: docs.assinaturaGestor,
  };
}

function rotasPost(rota: string, corpo: Record<string, unknown>, viewer: Pessoa): Resposta {
  const { db } = estado;
  const nome = String(corpo.nome ?? '');
  let m: RegExpMatchArray | null;

  if (rota === '/colaboradores' || rota === '/gestores') {
    const dados = corpo as unknown as NovoColaborador & NovoGestor;
    const r = rota === '/colaboradores' ? adicionarColaborador(db, viewer, dados) : adicionarGestor(db, viewer, dados);
    if ('erro' in r) return aplicar(r);

    const email = dados.email.trim().toLowerCase();
    const perfil = rota === '/colaboradores' ? 'colaborador' : 'gestor';
    const token = criarConvite(email);
    console.log(`[teste] Convite ${perfil}: /concluir-conta?perfil=${perfil}&email=${email}&token=${token}`);
    const nova = r.db.pessoas.find((p) => p.email === email)!;
    return aplicar(r, ok({ id: nova.id, nome: nova.nome, email }, 201));
  }

  if ((m = rota.match(/^\/minha-jornada\/atividades\/([^/]+)\/iniciar$/))) return aplicar(iniciarAtividade(db, viewer, m[1]));
  if ((m = rota.match(/^\/minha-jornada\/atividades\/([^/]+)\/concluir$/))) return aplicar(concluirAtividade(db, viewer, m[1]));
  if ((m = rota.match(/^\/minha-jornada\/documentos\/([^/]+)\/assinar$/))) return aplicar(assinarDocumento(db, viewer, m[1], nome));
  if ((m = rota.match(/^\/minha-equipe\/colaboradores\/([^/]+)\/feedbacks$/)))
    return aplicar(enviarFeedback(db, viewer, m[1], String(corpo.texto ?? '')));
  if ((m = rota.match(/^\/minha-equipe\/documentos\/([^/]+)\/assinar$/)))
    return aplicar(assinarDocumentoGestor(db, viewer, m[1], nome));
  if ((m = rota.match(/^\/rh\/documentos\/([^/]+)\/solicitar-assinatura$/))) return aplicar(solicitarAssinatura(db, viewer, m[1]));

  return erro(404, 'Rota não encontrada.');
}

// Ponto de entrada usado pelo api.ts no lugar do fetch
export async function responderMock(
  metodo: 'GET' | 'POST',
  caminho: string,
  corpo: unknown,
  token: string | null
): Promise<Resposta> {
  await new Promise((r) => setTimeout(r, 150)); // simula a rede (telas de "carregando" continuam aparecendo)

  const [rota, query = ''] = caminho.split('?');
  const dados = (corpo ?? {}) as Record<string, unknown>;
  const viewer = token ? estado.db.pessoas.find((p) => `mock-${p.id}` === token) ?? null : null;

  if (rota.startsWith('/auth/')) return rotasAuth(rota, dados, viewer);

  // Mesmas checagens do middleware do backend: token, termos aceitos e perfil da rota
  if (!viewer) return erro(401, 'Faça login para continuar.');
  if (!termosAceitos(viewer.email)) return erro(403, 'Aceite os termos de uso para acessar a plataforma.');
  const perfil = perfilDaRota(rota);
  if (perfil && perfil !== viewer.perfil) return erro(403, 'Você não tem permissão para esta ação.');

  return metodo === 'GET' ? rotasGet(rota, new URLSearchParams(query), viewer) : rotasPost(rota, dados, viewer);
}
