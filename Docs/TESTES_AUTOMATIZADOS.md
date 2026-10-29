# Testes automatizados

## Objetivo

Este projeto inclui testes automatizados para validar regras de negócio do backend sem precisar iniciar o servidor ou conectar ao banco de dados. Os testes usam o executor nativo `node:test` e não exigem a instalação de novas dependências.

## Como executar

Na pasta raiz do repositório, execute:

```powershell
npm --prefix Backend test
```

Ou, dentro da pasta `Backend`:

```powershell
npm test
```

É necessário ter o Node.js instalado. O resultado é apresentado no terminal; cada teste aparece como aprovado ou reprovado, e o comando retorna código de erro se alguma verificação falhar.

## O que é verificado

- **Geração da jornada:** criação das 25 atividades, distribuição em cinco semanas, cálculo de datas e limite dos prazos ao último dia da jornada.
- **Regras das atividades:** estados pendente, em andamento, atrasada e concluída; possibilidade de iniciar; conclusão com atraso; progresso e resumo semanal.
## Limitações

Esses testes verificam funções e regras isoladas. Eles não iniciam a API, não acessam o MySQL e não testam telas, navegação ou integração entre frontend e backend. Também não substituem testes manuais ou testes de ponta a ponta. A execução pode revelar erros nas regras cobertas, mas não garante a ausência de problemas em áreas não testadas.
