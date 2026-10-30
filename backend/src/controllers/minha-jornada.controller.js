const db = require('../config/db');
const { hojeISO } = require('../config/jornada');
const R = require('../config/regras');
const { registrarEvento } = require('../services/eventos');
const { TITULO_DOCUMENTO } = require('../services/equipe');

function erroInterno(res, e) {
  console.error(e);
  return res.status(500).json({ erro: 'Erro interno. Tente novamente.' });
}

// Datas sempre como "AAAA-MM-DD" (corta a hora, se o banco devolver data e hora)
const dia = (v) => (v ? String(v).slice(0, 10) : undefined);

// Quem está logado (pelo token) -> o colaborador e o onboarding dele
async function carregarColaborador(idUsuario) {
  const [rows] = await db.query(
    `SELECT c.id_colaborador, c.id_gestor, u.nome, u.cargo, u.termos_aceitos_em, u.termos_versao,
            o.id_onboarding, o.data_inicio
       FROM colaborador c
       JOIN usuario u ON u.id_usuario = c.id_usuario
       JOIN onboarding o ON o.id_colaborador = c.id_colaborador
      WHERE c.id_usuario = ?`,
    [idUsuario]
  );
  return rows[0] || null;
}

// A semana vem da posição da atividade na jornada (5 por semana)
async function carregarAtividades(idOnboarding) {
  const [rows] = await db.query(
    `SELECT id_tarefa, descricao, envolvidos, data_inicio, prazo, iniciada_em, data_conclusao
       FROM tarefa WHERE id_onboarding = ? ORDER BY id_tarefa`,
    [idOnboarding]
  );
  return rows.map((r, i) => ({
    id: String(r.id_tarefa),
    semana: Math.floor(i / R.ATIVIDADES_POR_SEMANA) + 1,
    titulo: r.descricao,
    envolvidos: r.envolvidos,
    inicio: dia(r.data_inicio),
    prazo: dia(r.prazo),
    iniciadaEm: dia(r.iniciada_em),
    concluidaEm: dia(r.data_conclusao),
  }));
}

const naoEncontrado = (res) => res.status(404).json({ erro: 'Colaborador não encontrado.' });

/* ---------------------------- leituras ---------------------------- */

// GET /minha-jornada/home
async function home(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);

    const hoje = hojeISO();
    const atividades = await carregarAtividades(colab.id_onboarding);
    const { concluidas, total, percentual } = R.progresso(atividades);

    // Feedbacks recebidos dos gestores (mais recentes primeiro)
    const [fbs] = await db.query(
      `SELECT f.id_feedback, f.texto, f.data, u.nome AS autor
         FROM feedback f
         JOIN gestor g ON g.id_gestor = f.id_gestor
         JOIN usuario u ON u.id_usuario = g.id_usuario
        WHERE f.id_colaborador = ? ORDER BY f.id_feedback DESC`,
      [colab.id_colaborador]
    );

    // As 2 não concluídas com prazo mais próximo
    const proximas = atividades
      .filter((a) => !a.concluidaEm)
      .sort((a, b) => a.prazo.localeCompare(b.prazo))
      .slice(0, 2)
      .map((a) => R.paraItem(a, hoje));

    return res.json({
      hoje,
      concluidas,
      total,
      percentual,
      todasConcluidas: total > 0 && concluidas === total,
      proximas,
      feedbacks: fbs.map((f) => ({
        id: String(f.id_feedback),
        texto: f.texto,
        data: dia(f.data),
        autor: f.autor,
      })),
    });
  } catch (e) {
    return erroInterno(res, e);
  }
}

// GET /minha-jornada/atividades
async function listarAtividades(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);

    const hoje = hojeISO();
    const atividades = await carregarAtividades(colab.id_onboarding);
    const itens = atividades.map((a) => R.paraItem(a, hoje));
    const numeros = Array.from(new Set(itens.map((i) => i.semana))).sort((a, b) => a - b);

    const semanas = numeros.map((semana) => {
      const doGrupo = itens.filter((i) => i.semana === semana);
      return {
        semana,
        total: doGrupo.length,
        concluidas: doGrupo.filter((i) => i.status === 'concluida').length,
        atrasadas: doGrupo.filter((i) => i.status === 'atrasada').length,
        atividades: doGrupo,
      };
    });

    const { concluidas, total, percentual } = R.progresso(atividades);
    return res.json({ hoje, total, concluidas, percentual, semanas });
  } catch (e) {
    return erroInterno(res, e);
  }
}

// GET /minha-jornada/documentos
async function documentos(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);

    const atividades = await carregarAtividades(colab.id_onboarding);
    const { concluidas, total, percentual } = R.progresso(atividades);

    const [forms] = await db.query(
      `SELECT id_formulario, assinatura_colaborador, data_assinatura_colaborador,
              assinatura_gestor, data_assinatura
         FROM formulario WHERE id_onboarding = ? LIMIT 1`,
      [colab.id_onboarding]
    );
    const termo = forms[0];

    const [[{ n: totalFeedbacks }]] = await db.query(
      'SELECT COUNT(*) AS n FROM feedback WHERE id_colaborador = ?',
      [colab.id_colaborador]
    );

    // O formulário On The Job só entra na biblioteca depois da assinatura do GESTOR
    const formulario = termo?.data_assinatura
      ? [{
          id: `form-${colab.id_colaborador}`,
          titulo: 'Formulário On The Job',
          tipo: 'Institucional',
          formato: 'PDF',
          url: `/docs/formulario-${colab.id_colaborador}.pdf`,
        }]
      : [];

    return res.json({
      nome: colab.nome,
      cargo: colab.cargo ?? '',
      inicio: dia(colab.data_inicio),
      fim: R.dataFimJornada(dia(colab.data_inicio)),
      atividadesRealizadas: concluidas,
      total,
      percentual,
      feedbacks: totalFeedbacks,
      liberado: total > 0 && concluidas === total,
      documentoId: termo ? String(termo.id_formulario) : undefined,
      assinaturaColaborador: termo?.data_assinatura_colaborador
        ? { nome: termo.assinatura_colaborador || colab.nome, data: dia(termo.data_assinatura_colaborador) }
        : undefined,
      assinaturaGestor: termo?.data_assinatura
        ? { nome: termo.assinatura_gestor || 'Gestor', data: dia(termo.data_assinatura) }
        : undefined,
      semanas: R.resumoSemanas(atividades),
      biblioteca: [...R.BIBLIOTECA, ...formulario],
      // Termos de uso / LGPD aceitos no primeiro acesso (sempre visíveis, mesmo antes de liberar)
      termos: colab.termos_aceitos_em
        ? { versao: colab.termos_versao, aceitoEm: dia(colab.termos_aceitos_em) }
        : undefined,
    });
  } catch (e) {
    return erroInterno(res, e);
  }
}

/* ----------------------------- ações ----------------------------- */
// O colaborador não altera o status: só registra que iniciou ou concluiu (com a data).
// Concluir é definitivo.

async function buscarAtividade(req, colab) {
  const [rows] = await db.query(
    `SELECT id_tarefa, data_inicio, iniciada_em, data_conclusao
       FROM tarefa WHERE id_tarefa = ? AND id_onboarding = ?`,
    [req.params.id, colab.id_onboarding]
  );
  return rows[0] || null;
}

// POST /minha-jornada/atividades/:id/iniciar
async function iniciar(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);
    const a = await buscarAtividade(req, colab);
    if (!a) return res.status(404).json({ erro: 'Atividade não encontrada.' });

    const hoje = hojeISO();
    if (a.data_conclusao) return res.status(409).json({ erro: 'Esta atividade já foi concluída.' });
    if (a.iniciada_em) return res.status(409).json({ erro: 'Esta atividade já foi iniciada.' });
    if (hoje < dia(a.data_inicio)) {
      return res.status(400).json({ erro: 'Esta atividade ainda não está disponível para início.' });
    }

    await db.query("UPDATE tarefa SET iniciada_em = ?, status = 'em_andamento' WHERE id_tarefa = ?", [hoje, a.id_tarefa]);
    return res.json({ ok: true });
  } catch (e) {
    return erroInterno(res, e);
  }
}

// POST /minha-jornada/atividades/:id/concluir
async function concluir(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);
    const a = await buscarAtividade(req, colab);
    if (!a) return res.status(404).json({ erro: 'Atividade não encontrada.' });

    const hoje = hojeISO();
    if (a.data_conclusao) return res.status(409).json({ erro: 'Esta atividade já foi concluída.' });
    if (hoje < dia(a.data_inicio)) return res.status(400).json({ erro: 'Esta atividade ainda não está disponível.' });

    await db.query(
      "UPDATE tarefa SET iniciada_em = COALESCE(iniciada_em, ?), data_conclusao = ?, status = 'concluida' WHERE id_tarefa = ?",
      [hoje, hoje, a.id_tarefa]
    );
    return res.json({ ok: true });
  } catch (e) {
    return erroInterno(res, e);
  }
}

// POST /minha-jornada/documentos/:id/assinar   { nome }
// O colaborador assina primeiro, só depois de concluir todas as atividades.
async function assinar(req, res) {
  try {
    const colab = await carregarColaborador(req.usuario.id);
    if (!colab) return naoEncontrado(res);

    const [forms] = await db.query(
      `SELECT id_formulario, data_assinatura_colaborador
         FROM formulario WHERE id_formulario = ? AND id_onboarding = ?`,
      [req.params.id, colab.id_onboarding]
    );
    const termo = forms[0];
    if (!termo) return res.status(404).json({ erro: 'Documento não encontrado.' });
    if (termo.data_assinatura_colaborador) {
      return res.status(409).json({ erro: 'Você já assinou este documento.' });
    }

    const atividades = await carregarAtividades(colab.id_onboarding);
    if (atividades.length === 0 || !atividades.every((a) => a.concluidaEm)) {
      return res.status(400).json({ erro: 'Conclua todas as atividades antes de assinar.' });
    }

    const nome = String(req.body.nome || '').trim().replace(/\s+/g, ' ');
    if (nome.split(' ').length < 2) {
      return res.status(400).json({ erro: 'Digite seu nome completo para assinar.' });
    }

    await db.query(
      'UPDATE formulario SET assinatura_colaborador = ?, data_assinatura_colaborador = ? WHERE id_formulario = ?',
      [nome, hojeISO(), termo.id_formulario]
    );
    await registrarEvento(`${colab.nome} assinou o "${TITULO_DOCUMENTO}". Aguardando assinatura do gestor.`);
    return res.json({ ok: true });
  } catch (e) {
    return erroInterno(res, e);
  }
}

module.exports = { home, listarAtividades, documentos, iniciar, concluir, assinar };