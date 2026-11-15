# 04 — Catálogo de casos de teste

Os testes automatizados listados nesta fase são unitários e não acessam MySQL.
Casos de integração/persistência permanecem fora do escopo atual.

| ID | Requisito | Tipo | Pré-condição e descrição | Resultado esperado | Automatizado | Arquivo |
|---|---|---|---|---|---|---|
| CT-JOR-001 | RN-03 | Unidade backend | Gerar a jornada a partir de uma data fixa e conferir todos os 25 títulos, envolvidos, inícios e prazos. | Modelo completo conforme regra de 30 dias. | Sim | `backend/tests/unit/config/jornada.test.js` |
| CT-JOR-002 | RN-02/RN-03 | Unidade backend | Consultar duração e última atividade da jornada. | Duração de 30 dias e último prazo D+30. | Sim | `backend/tests/unit/config/jornada.test.js` |
| CT-JOR-003 | Datas | Unidade backend | Somar dias em virada de ano/mês, ano bissexto e valores negativos. | Data ISO correta. | Sim | `backend/tests/unit/config/jornada.test.js` |
| CT-JOR-004 | A3 | Unidade backend | Obter data local às 23:59 e às 00:01, incluindo mês/dia com zero à esquerda. | `hojeISO()` retorna a data local `AAAA-MM-DD`. | Sim | `backend/tests/unit/config/jornada.test.js` |
| CT-JOR-005 | Datas | Unidade backend | Repetir soma de dias sob UTC, Los Angeles e Tóquio. | Resultados independentes do fuso configurado. | Sim | `backend/tests/unit/config/jornada.test.js` |
| CT-JOR-006 | RN-02 | Unidade backend | Calcular fim da jornada. | Admissão + 30 dias corridos. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-STA-001 | RN-04 | Unidade backend | Conferir tabela de status pendente, em andamento, atrasada e concluída. | Status calculado; conclusão prevalece sobre atraso e prazo igual a hoje não atrasa. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-STA-002 | RN-04 | Unidade backend | Converter atividade em item, conferindo atraso e permissão para iniciar nas bordas de data. | `comAtraso` e `podeIniciar` seguem prazo/início. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-STA-003 | RN-04 | Unidade backend | Calcular progresso para lista vazia e frações 1/3 e 2/3. | Percentual arredondado, com zero para lista vazia. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-STA-004 | RN-04 | Unidade backend | Agrupar atividades concluídas de várias semanas, inclusive semana sem tema. | Semanas ordenadas; tarefas pendentes omitidas; tema ausente vazio. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-API-003 | Biblioteca | Unidade backend | Consultar a biblioteca institucional. | Quatro documentos PDF com IDs `b-1` a `b-4`. | Sim | `backend/tests/unit/config/regras.test.js` |
| CT-EQP-001 | RN-06 | Unidade backend | Avaliar jornada vazia, pendente, atrasada, em andamento e concluída. | Precedência dos status respeitada; lista vazia fica pendente. | Sim | `backend/tests/unit/services/equipe.test.js` |
| CT-ASS-001 | RN-07 | Unidade backend | Verificar assinatura sem documento/tarefas, atividades incompletas e etapas de assinatura. | Pendência correta: colaborador, gestor ou nenhuma. | Sim | `backend/tests/unit/services/equipe.test.js` |
| CT-EQP-002 | RN-12 | Unidade backend | Montar equipe com diferentes status, atrasos e progresso. | Ordem: atraso, pendência, andamento, conclusão; desempates por atrasos e menor progresso. | Sim | `backend/tests/unit/services/equipe.test.js` |
| CT-EQP-003 | RN-12 | Unidade backend | Resumir atividades pendentes e motivos de atenção. | Prazo crescente, no máximo cinco itens e motivo singular/plural correto. | Sim | `backend/tests/unit/services/equipe.test.js` |
| CT-EQP-004 | RN-12 | Unidade backend | Montar itens pendentes e histórico de assinaturas/feedbacks. | Apenas pendências aplicáveis; pendentes ASC e histórico DESC por data. | Sim | `backend/tests/unit/services/equipe.test.js` |
| CT-RH-001 | RN-06 | Unidade backend | Aplicar filtros concluídas, atrasadas, onboarding e valor inválido. | Predicados correspondem ao status; valor padrão inclui não concluídas. | Sim | `backend/tests/unit/services/rh.test.js` |
| CT-ASS-002 | RN-12 | Unidade backend | Listar documentos pendentes e assinados com diferentes datas. | Data de espera correta; pendentes ASC e assinados DESC. | Sim | `backend/tests/unit/services/rh.test.js` |
| CT-RH-002 | RN-12 | Unidade backend | Agregar painel de gestores com status, atrasos e pendências variadas. | Ordenação por atrasos, total de pendências e nome; médias e contagens corretas. | Sim | `backend/tests/unit/services/rh.test.js` |
| CT-SEG-001 | RN-09 | Unidade backend | Autenticar sem header, com Basic, token inválido/adulterado ou expirado. | 401 e mensagem apropriada; `next` não chamado. | Sim | `backend/tests/unit/middlewares/auth.test.js` |
| CT-SEG-002 | RN-09 | Unidade backend | Autenticar com JWT válido. | Claims do token anexados a `req.usuario`; `next` chamado. | Sim | `backend/tests/unit/middlewares/auth.test.js` |
| CT-SEG-003 | RN-10 | Unidade backend | Usar JWT válido sem aceite de termos na rota protegida. | 403 e mensagem de aceite; `next` não chamado. | Sim | `backend/tests/unit/middlewares/auth.test.js` |
| CT-SEG-004 | RN-10 | Unidade backend | Usar JWT válido com termos aceitos. | Middleware permite a requisição. | Sim | `backend/tests/unit/middlewares/auth.test.js` |
| CT-SEG-005 | RN-01/RN-08 | Unidade backend | Verificar uma ou várias roles autorizadas e uma role recusada. | `next` para perfil permitido; 403 para perfil não autorizado. | Sim | `backend/tests/unit/middlewares/auth.test.js` |
| CT-RH-003 | RN-09 | Unidade backend | Registrar evento sem conexão explícita. | INSERT usa texto e data corrente pela conexão padrão. | Sim | `backend/tests/unit/services/eventos.test.js` |
| CT-RH-004 | RN-09 | Unidade backend | Registrar evento com conexão fornecida. | INSERT usa a conexão recebida e não a conexão padrão. | Sim | `backend/tests/unit/services/eventos.test.js` |
| CT-JOR-101 | Jornada frontend | Unidade frontend | Gerar atividades e documentos para uma admissão fixa, incluindo a fórmula legada. | 25 atividades, semanas de 7 dias e duração de 35 dias no frontend; não representa paridade com o backend. | Sim | `frontend/__tests__/unit/jornada.test.ts` |
| CT-JOR-102 | Jornada frontend | Unidade frontend | Injetar ações simuladas por índice ao gerar atividades. | As ações e datas correspondem a cada atividade, sem afetar as demais. | Sim | `frontend/__tests__/unit/jornada.test.ts` |
| CT-STA-101 | Status frontend | Unidade frontend | Calcular status antes/no/depois do prazo, iniciada e concluída. | Status calculado conforme a regra local do frontend; conclusão prevalece. | Sim | `frontend/__tests__/unit/jornada.test.ts` |
| CT-STA-102 | Status frontend | Unidade frontend | Calcular atraso de conclusão e disponibilidade para iniciar. | Limites de data seguem as funções puras do frontend. | Sim | `frontend/__tests__/unit/jornada.test.ts` |
| CT-ASS-101 | Assinatura frontend | Unidade frontend | Criar o termo de conclusão com e sem datas de assinatura. | Um documento por colaborador, com datas informadas e fim da jornada legado. | Sim | `frontend/__tests__/unit/jornada.test.ts` |
| CT-API-101 | Formatação frontend | Unidade frontend | Formatar datas completas, vazias e rótulos de prazo. | Formato brasileiro e texto correto para prazo vencido, hoje ou futuro. | Sim | `frontend/__tests__/unit/format.test.ts` |
| CT-API-102 | Formatação frontend | Unidade frontend | Conferir rótulos de status e filtros. | Mapas de status e de filtros contêm os rótulos esperados. | Sim | `frontend/__tests__/unit/format.test.ts` |
| CT-API-103 | Formatação frontend | Unidade frontend | Conferir todas as chaves dos mapas de status e rótulos de filtros. | Mapas cobrem os estados e filtros tipados do frontend. | Sim | `frontend/__tests__/unit/format.test.ts` |
| CT-CAD-101 | Mutação frontend | Unidade frontend | Tentar cadastrar colaborador/gestor sem perfil RH. | A mutação retorna a mensagem de permissão correspondente. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-CAD-102 | Mutação frontend | Unidade frontend | Repetir e-mail existente em diferentes letras. | Duplicidade detectada após normalização do e-mail. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-CAD-103 | Mutação frontend | Unidade frontend | Cadastrar colaborador com gestor ausente ou e-mail duplicado. | Erros mantêm a validação e sua ordem; nenhum dado é criado. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-CAD-104 | Mutação frontend | Unidade frontend | Cadastrar colaborador e gestor com data e relógio controlados. | Dados normalizados, IDs, eventos e atividades gerados de forma determinística. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-API-104 | Mutação frontend | Unidade frontend | Solicitar assinatura com perfil incorreto, documento ausente, assinado ou pendente. | Erros e resultado sem alteração correspondem à regra local. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-ATV-101 | Mutação frontend | Unidade frontend | Iniciar e concluir atividade com base profundamente congelada. | Novo estado é devolvido sem mutar a fixture original. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-ATV-102 | Mutação frontend | Unidade frontend | Tentar iniciar/concluir com perfil, data e estado inválidos. | Mensagens e precedência de validação preservadas. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-ASS-102 | Mutação frontend | Unidade frontend | Assinar termo como colaborador antes/depois de concluir atividades. | Permissão, existência, conclusão, nome completo e normalização verificados. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-EQP-101 | Mutação frontend | Unidade frontend | Enviar feedback fora da equipe, vazio e válido. | Apenas gestor da equipe envia; texto externo é removido sem mutar a base. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-ASS-103 | Mutação frontend | Unidade frontend | Assinar termo como gestor em vários estados e equipes. | Equipe, atividades, assinatura prévia, nome completo e duplicidade são validados. | Sim | `frontend/__tests__/unit/mutations.test.ts` |
| CT-QRY-101 | Consultas frontend | Unidade frontend | Consultar colaboradores visíveis e gestores por perfil. | RH vê todos, gestor sua equipe, colaborador apenas a si; listagem de gestores é RH-only. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-102 | Consultas frontend | Unidade frontend | Consultar status e contagens da home RH com data fixa. | Status e contagens derivam do seed determinístico. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-103 | Consultas frontend | Unidade frontend | Filtrar acompanhamento RH por situação e perfil. | Progresso e filtros correspondem aos mesmos status calculados. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-104 | Consultas frontend | Unidade frontend | Consultar atividades e home do colaborador autenticado. | Totais, próximas tarefas e feedbacks limitam-se ao colaborador. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-105 | Consultas frontend | Unidade frontend | Consultar documentos antes e depois das assinaturas do gestor. | Liberação, resumo, assinatura e inclusão do formulário na biblioteca seguem os dados do seed. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-106 | Consultas frontend | Unidade frontend | Consultar equipe, filtro, home e atenção do gestor. | Escopo da equipe, prioridade e filtros são aplicados pelo frontend. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-QRY-107 | Consultas frontend | Unidade frontend | Consultar assinaturas e painel de gestores como RH. | Disponibilidade depende das atividades; listas e resumo derivam do seed. | Sim | `frontend/__tests__/unit/queries.test.ts` |
| CT-PDF-101 | PDF frontend | Unidade frontend | Formatar datas com/sem horário e valor ausente. | Conteúdo usa data/hora brasileira sem renderizar arquivo nativo. | Sim | `frontend/__tests__/unit/pdf.test.ts` |
| CT-PDF-102 | PDF frontend | Unidade frontend | Gerar o modelo do comprovante de aceite de termos. | Título, versão, seções, perfil e dados do aceite aparecem nos blocos. | Sim | `frontend/__tests__/unit/pdf.test.ts` |
| CT-PDF-103 | PDF frontend | Unidade frontend | Gerar o modelo do termo de conclusão com atividades, feedback e assinaturas. | Resumo, atraso, datas, texto e assinaturas compõem o documento; relógio controlado. | Sim | `frontend/__tests__/unit/pdf.test.ts` |
| CT-API-201 | Cliente API frontend | Unidade frontend | Fazer GET com resposta JSON. | URL, método, headers e ausência de corpo verificados. | Sim | `frontend/__tests__/unit/api.test.ts` |
| CT-API-202 | Cliente API frontend | Unidade frontend | Fazer POST autenticado. | Token, content-type e serialização do corpo verificados. | Sim | `frontend/__tests__/unit/api.test.ts` |
| CT-API-203 | Cliente API frontend | Unidade frontend | Receber 401 com token e resposta sem JSON. | Erro HTTP convertido e callback de sessão expirada chamado. | Sim | `frontend/__tests__/unit/api.test.ts` |
| CT-API-204 | Cliente API frontend | Unidade frontend | Receber 401 sem token e falha de rede. | Mensagem HTTP preservada sem encerrar sessão; falha de rede retorna status 0. | Sim | `frontend/__tests__/unit/api.test.ts` |
| CT-MCK-101 | Mock frontend | Unidade frontend | Importar mock habilitado e controlar o temporizador. | Resposta não ocorre antes dos 150 ms e não requer servidor. | Sim | `frontend/__tests__/unit/mock-api.test.ts` |
| CT-MCK-102 | Mock frontend | Unidade frontend | Entrar com usuário seed, tentar rota sem aceite, aceitar termos e consultar RH. | Fluxo local de sessão/termos permite resposta simulada após aceite; não valida backend. | Sim | `frontend/__tests__/unit/mock-api.test.ts` |
| CT-MCK-103 | Mock frontend | Unidade frontend | Tentar login com conta ausente e perfil divergente. | Respostas simuladas de credencial/perfil são retornadas. | Sim | `frontend/__tests__/unit/mock-api.test.ts` |
| CT-AUT-101 | Autenticação frontend | Unidade frontend | Extrair primeiro nome de nomes com espaços, vazios ou ausentes. | Primeiro nome normalizado ou string vazia. | Sim | `frontend/__tests__/unit/auth-context.test.ts` |

## Limites dos casos

Os testes de eventos verificam o comando SQL e a conexão escolhida com doubles
isolados; não executam SQL nem provam persistência. Verificação de tokens,
bloqueio de conta, controllers e consultas reais permanece fora desta fase.
Os casos frontend verificam funções, estado em memória, cliente com `fetch`
falso e mock local; não comprovam paridade com o backend, persistência, SQL,
renderização de PDF, integração com MySQL nem funcionamento visual/nativo.
