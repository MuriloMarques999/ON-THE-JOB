# 01 — Estratégia de testes

## Objetivo

Reduzir o risco no fluxo de onboarding de 30 dias, validando regras de negócio,
permissões, persistência, contratos entre o frontend e o backend e as jornadas
essenciais dos perfis de RH, gestor e colaborador.

## Abordagem

- **Unidade (prioridade alta):** regras puras de datas, status, assinatura,
  painéis, formatadores, builders de PDF e cliente de API; execução rápida e sem
  banco.
- **Integração frontend (prioridade futura):** telas e providers com React
  Native Testing Library e mock-api, sem depender de banco.
- **Integração backend com MySQL, sistema que acessa MySQL e E2E contra o
  backend real:** fora do escopo atual.
- **Regressão:** processo contínuo; todo bug corrigido recebe um teste
  `CT-REG-NNN`.
- **Aceitação (UAT, prioridade alta):** cenários por perfil e aceite documentado.
- **Exploratório (prioridade média):** sessões com charter para riscos que não
  são bem cobertos por automação.

## Pirâmide e metas

Alvo futuro aproximado: 60% unidade, 30% integração e 10% sistema/E2E. Após
medir a cobertura, estabelecer limites realistas para as áreas ainda incluídas;
não perseguir 100% sem justificativa.

## Fora do escopo inicial

Testes que conectem ou alterem MySQL, integração/sistema backend dependentes do
banco e E2E com backend real estão excluídos. Testes nativos iOS/Android
(Detox/Maestro), carga pesada, acessibilidade automatizada e testes visuais
também ficam para evolução futura.

## Princípios de qualidade

Testes independentes e determinísticos; um assunto por teste; seletores
acessíveis; sem snapshots extensos ou sleep. Bugs existentes são documentados
sem alterar produção. Sem testes de banco, não se afirma cobertura de
persistência nem de comportamento integrado com MySQL.
