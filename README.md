# Digitalização do ON THE JOB

Aplicação para digitalizar o processo de onboarding **On The Job** da Fábrica Fortaleza (M. Dias Branco S.A.). O sistema centraliza o cadastro, a jornada de atividades, o acompanhamento, os feedbacks, as assinaturas digitais e o histórico do processo.

## Visão geral

O projeto é dividido em:

- [`Backend/`](./Backend/) — API Node.js/Express e persistência MySQL.
- [`Frontend/`](./Frontend/) — aplicativo Expo/React Native com suporte para web, Android e iOS.
- [`Database/`](./Database/) e [`Docs/`](./Docs/) — materiais complementares do projeto.

### Fluxo principal

1. O RH cadastra gestores e colaboradores.
2. O sistema envia um convite para conclusão do cadastro.
3. O colaborador acompanha e executa 25 atividades em uma jornada de 30 dias.
4. O gestor acompanha sua equipe e envia feedbacks.
5. O colaborador assina o termo de conclusão após finalizar as atividades.
6. O gestor assina em seguida e o RH acompanha o resultado.

## Tecnologias

- **Frontend:** Expo SDK 57, React Native, React, TypeScript e Expo Router.
- **Backend:** Node.js e Express.
- **Banco de dados:** MySQL.
- **E-mail:** Resend.
- **Execução web:** Expo Web.

## Pré-requisitos

- Node.js e npm.
- MySQL instalado e em execução para utilizar a API.

## Instalação

Na raiz do projeto, instale todas as dependências:

```bash
npm run instalar
```

Esse comando instala as dependências da raiz, do backend e do frontend.

Antes de iniciar a API:

1. Execute [`Backend/sql/schema.sql`](./Backend/sql/schema.sql) no MySQL.
2. Crie `Backend/.env` com as variáveis descritas no [`Backend/README.md`](./Backend/README.md).
3. Crie o primeiro usuário de RH:

   ```bash
   npm --prefix Backend run criar-rh
   ```

Para desenvolvimento local, também é possível criar usuários de teste:

```bash
npm --prefix Backend run seed
```

## Como iniciar

### Iniciar tudo junto

Na raiz do projeto:

```bash
npm run dev
```

Esse comando inicia o backend e o frontend web simultaneamente.

### Iniciar separadamente

Também é possível iniciar cada parte em um terminal separado.

**Primeiro terminal — backend:**

```bash
cd Backend
npm run dev
```

**Segundo terminal — frontend web:**

```bash
cd Frontend
npm run web
```

Por padrão, a API fica disponível em `http://localhost:3000`. Para verificar a conexão com o banco:

```bash
curl http://localhost:3000/teste
```

## Modo de demonstração sem backend

O frontend possui dados de exemplo e uma API simulada:

```bash
npm run mock
```

Esse modo inicia o Expo Web sem MySQL. As contas de exemplo usam a senha `123456`.

## Comandos principais

| Comando | Descrição |
|---|---|
| `npm run instalar` | Instala todas as dependências |
| `npm run dev` | Inicia backend e frontend web juntos |
| `npm run mock` | Inicia o frontend com dados simulados |
| `npm --prefix Backend run start` | Inicia apenas a API |
| `npm --prefix Frontend run web` | Inicia apenas o frontend web |
| `npm --prefix Frontend run android` | Inicia no Android |
| `npm --prefix Frontend run ios` | Inicia no iOS |
| `npm --prefix Frontend run lint` | Executa o lint do frontend |

## Equipe

- Anne Carlini de Oliveira
- Matheus Silva Santos
- João Vitor Nogueira Alves
- Murilo Marques Dantas Vieira

## Limitações atuais

Notificações automáticas, recuperação de senha, perfil Padrinho, validação individual das atividades pelo gestor e persistência da sessão após recarregar a página ainda não estão implementados.
