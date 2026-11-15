# 10 — Achados e riscos

Achados confirmados na leitura inicial. Não corrigir código de produção durante
as fases de teste. Quando aplicável, testes associados documentam o comportamento
observado sem transformar um defeito em sucesso; itens sem teste mantêm essa
condição explicitada.

| ID | Severidade | Evidência / risco | Teste associado |
|---|---|---|---|
| A1 | Alta | Frontend calcula jornada de 35 dias e semanas de 7 dias; backend usa 30 dias, semanas de 6 dias e teto D+30. Afeta seed e modo mock. | Parcial: FASE 2 verifica separadamente a regra legada frontend; paridade permanece sem teste, sem conexão ao backend/MySQL |
| A2 | Alta | Mock diverge do backend em bloqueio, senha/expiração de convite, feedback, e-mail, IDs e inferência de conflito. | Parcial: FASE 2 testa login/termos e respostas locais; não são testes de contrato nem validam paridade com backend |
| A3 | Média | Datas usam `hojeISO()` no Node e `NOW()` no MySQL, potencialmente em fusos/dias diferentes. | Parcial: testes unitários de `hojeISO`/fuso; diferença Node/MySQL não testada |
| A4 | Média | Claim `termos` no JWT mantém autorização até a expiração do token após mudança de versão. | A criar: teste de segurança para versão dos termos |
| A5 | Baixa | Login diferencia e-mail pendente com 403 e mensagem específica, permitindo enumeração. | A criar: teste de login e registro de risco |
| A6 | Média | Cadastro de gestor/colaborador obtém conexão antes do `try`; falha do pool pode escapar do tratamento JSON padrão. | A criar: teste com falha de `getConnection` |
| A7 | Baixa | App não define 404 nem handler global; rota ausente e JSON malformado podem retornar HTML Express. | A criar: teste de contrato de erro |
| A8 | Média | Solicitação de assinatura apenas valida; não notifica, embora textos da UI prometam notificação. | A criar: teste do endpoint e pendência de escopo |
| A9 | Alta — escopo | Evidências e validação por Padrinho constam como obrigatórias no README, mas não existem no código. | A criar: critérios UAT/matriz como lacuna |
| A10 | Baixa | README do backend cita `npm run install` em vez de `npm run instalar` e omite duas rotas. | A criar: revisão de documentação |
| A11 | Baixa | Sessão do frontend existe apenas em memória; recarregar a página desloga. | A criar: teste E2E e nota UAT |
| A12 | Baixa | `tarefa.status` é gravado, mas o status exibido é calculado pelas datas; o dado persistido pode divergir. | A criar: teste de regra e consistência |
| A13 | Média | Regra de senha está duplicada no controller, script de RH e frontend. | A criar: tabela comum de casos nos três fluxos |
| A14 | Informação | Usuários do seed não aceitaram termos; primeiro login informa `termosAceitos=false`. | Não testado: login/seed dependem de banco e estão fora do escopo |
| A15 | Baixa | CORS está aberto e não há Helmet nem rate limit geral além do bloqueio por conta. | A criar: teste/documentação de segurança para produção |
| A16 | Média | Ações de verificar e depois gravar não usam transação/UPDATE condicional; chamadas paralelas podem duplicar efeitos/eventos. | A criar: teste concorrente `test.failing` se reproduzido |

## Estado após a FASE 2

Os testes unitários cobrem as regras puras de datas, status, equipe, filtros,
assinaturas, painel e middleware JWT descritas no catálogo. A3 foi coberto
parcialmente: datas locais e soma de dias foram testadas, mas a diferença entre
o relógio do Node e `NOW()` do MySQL não pode ser verificada sem integração.

A FASE 2 acrescenta testes de formatadores, jornada legada, mutações imutáveis,
consultas com seed fixo, builders de PDF, cliente HTTP com `fetch` falso,
respostas do mock local e extração do primeiro nome. Os resultados comprovam
somente os comportamentos unitários exercitados no frontend; não demonstram
integração, paridade com o backend, persistência ou geração/renderização final
dos PDFs.

## Limite de escopo

Não serão criados nem executados, no escopo atual, testes que conectem ao MySQL,
recriem schema ou validem persistência/SQL. Portanto, achados cuja verificação
exija essas operações permanecem riscos conhecidos e não devem ser reportados
como aprovados. Testes de tela/provider integrados com mock podem ser adicionados
em fase posterior, sem alegar validação do backend.
