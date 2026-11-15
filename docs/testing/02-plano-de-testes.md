# 02 — Plano de testes

## Escopo

Validar lógica pura do backend e do frontend sem banco. A FASE 1 está concluída;
a FASE 2 cobre regras, serviços puros e builders do frontend, sem conectar ao
backend nem acessar MySQL.

## Fora do escopo

Integração ou sistema de backend que acesse MySQL, E2E contra o backend real,
testes nativos iOS/Android, performance/carga pesada, acessibilidade
automatizada e comparação visual. Evidências de atividades, validação por
Padrinho e notificações/e-mail não estão implementados e são pendências de
escopo, não requisitos que a suíte possa aprovar.

## Ambientes e dados

Não há preparação de banco, `.env.test`, conexão MySQL ou alteração de dados. Os
testes automatizados incluídos nesta entrega rodam sem banco.

## Fases e cronograma

| Fase | Entrega |
|---|---|
| 0 | Fundação, configuração, helpers, smoke tests e documentação inicial |
| 1 | Unidade do backend |
| 2 | Unidade do frontend |
| 3 | Integração backend com MySQL — excluída |
| 4 | Integração frontend via mock, sem banco |
| 5 | Sistema/contratos que dependem de MySQL — excluídos |
| 6 | E2E com backend real — excluída |
| 7 | Regressão das suítes mantidas |
| 8 | UAT, exploratório e consolidação documental |

Executar uma fase por vez; avançar somente após autorização. A FASE 2 é a
entrega atual; a FASE 3 e as fases dependentes de MySQL continuam excluídas.

## Métricas e aprovação

Registrar quantidade de testes aprovados, falhas esperadas documentadas,
pendências, cobertura e resultado das suítes sem banco. Resultados não
representam validação de persistência, SQL ou endpoints que dependem do MySQL.

## Riscos

Riscos conhecidos estão catalogados em [10 — Achados e riscos](./10-achados-e-riscos.md).
Manter o escopo sem banco; não substituir integração real por mock para alegar
que o comportamento de persistência foi validado.
