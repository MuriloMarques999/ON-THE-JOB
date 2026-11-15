# 03 — Arquitetura de testes

## Camadas

```text
Expo / React Native
  ├─ Unidade: lógica de dados, API, contexto e PDFs puros
  ├─ Integração: telas/providers + API/mock com React Native Testing Library
  └─ Integração futura: telas/providers + mock-api, sem banco

Express
  ├─ Unidade: regras, serviços puros e middleware (sem banco)
  └─ Integração/sistema com acesso a MySQL: fora do escopo
```

## Organização

- `backend/jest.config.js`: apenas testes `unit`, sem setup de banco.
- `backend/tests/unit/`: regras puras e middleware, sem conexão MySQL.
- `backend/tests/setup/`: ambiente unitário, tokens JWT e relógio controlado.
- `frontend/jest.config.js` e `frontend/jest.setup.ts`: preset Expo, alias,
  ambiente e mocks.
- `frontend/__tests__/{unit,integration}/`: fora de `src/app`, para não criar
  rotas Expo Router.
- `e2e/`: pacote Playwright independente (entrega da FASE 6).

## Ferramentas e ambientes

Jest, `jest-expo` e React Native Testing Library. Os comandos mantidos não
iniciam nem consultam banco; não há fixture, variável de ambiente ou setup para
conectar MySQL.

## Dados e helpers

Testes unitários podem congelar somente o relógio JavaScript sem fake timers de
timeout. Factories dependentes de banco não fazem parte do escopo.

O mock do frontend é um modo de execução da aplicação. Seu uso em futuros testes
de interface valida o frontend, não equivale a teste de contrato ou persistência
do backend.

## CI e manutenção

Os comandos por pacote e as regras de segurança estão em
[09 — Execução e relatórios](./09-execucao-e-relatorios.md). Ao adicionar um
teste, use um ID `CT-*` no nome, escolha a camada mais baixa capaz de verificar
o comportamento sem acessar banco e atualize o catálogo da FASE 1 em diante.
