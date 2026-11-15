# 09 — Execução e relatórios

## Comandos

Na raiz:

```sh
npm run test:backend
npm run test:frontend
npm run test:all
npm run test:criticos
```

Backend:

```sh
npm --prefix backend run test:unit
npm --prefix backend run test:coverage
npm --prefix backend run test:criticos
```

Frontend:

```sh
npm --prefix frontend test
npm --prefix frontend run test:unit
npm --prefix frontend run test:integration
npm --prefix frontend run test:coverage
```

As suítes automatizadas implementadas até a FASE 2 são unitárias. Os testes do
mock API exercitam respostas locais sem backend; não há ainda testes de telas ou
providers integrados. O script `test:integration` está reservado e não foi
executado como aprovação de integração.

## Preparação local

Não é necessário iniciar MySQL, configurar `.env.test` ou alterar dados. Os
testes atualmente incluídos são executados sem banco. Para adicionar
dependências Expo, use `npx expo install`.

O projeto registra React Native 0.86.3 e React 19.2.3. Para
`@testing-library/react-native@14.1.0`, os peers publicados exigem Jest ≥29,
React ≥19, React Native ≥0.78 e `test-renderer` ^1.0.0. Foi fixado
`test-renderer@1.0.0`, cuja árvore usa `react-reconciler` 0.31, compatível com
React 19.2; a versão mais recente do renderer exigia React 19.3 indiretamente.
A página versionada
`https://docs.expo.dev/versions/v57.0.0/` foi consultada; o guia versionado
`/develop/unit-testing/` retornou 404. O índice oficial
`https://docs.expo.dev/llms.txt` aponta para o guia atual
`https://docs.expo.dev/develop/unit-testing/`, que recomenda `jest-expo`, Jest
e React Native Testing Library via `npx expo install`. As dependências
selecionadas são `jest-expo@~57.0.6`, `jest@~29.7.0` e
`@types/jest@29.5.14`.

## Cobertura e relatórios

Jest grava cobertura em `backend/coverage/` ou `frontend/coverage/` e exibe
somente o resumo (`--coverageReporters=text-summary`). Na execução da FASE 2,
`npm --prefix frontend run test:coverage` passou com 8 suítes e 41 testes; a
cobertura frontend reportada foi 58,16% de statements, 53,71% de branches,
66,02% de funções e 54,67% de linhas. Esses números cobrem os arquivos
selecionados em `frontend/jest.config.js`, não indicam paridade com o backend
nem aprovação de fluxos não testados.

Na validação conjunta, `npm run test:all` passou com 6 suítes/64 testes backend
e 8 suítes/41 testes frontend. Nenhum desses testes conectou ao MySQL.

## Diagnóstico

- Erros de MySQL, SQL e persistência não são cobertos pelas suítes atuais.
- Falha intermitente: remover a dependência de ordem/tempo, não mascarar com
  retries ou sleep.
- `npx tsc --noEmit` não conclui atualmente por dois imports CSS sem declaração
  (`animated-icon.module.css` e `@/global.css`); não foram reportados erros de
  tipos nos novos arquivos de teste.

## Seletores e rotas

Preferir `getByRole`, `getByText`, `getByPlaceholder` e `getByLabel`. Não foram
adicionados `testID` nesta fase.
