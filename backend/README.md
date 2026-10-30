# ON THE J'OB — Backend

API da plataforma de **digitalização do On The Job** (M. Dias Branco S.A. — Fábrica Fortaleza). O programa de onboarding era feito em papel; este sistema registra, acompanha, valida e assina digitalmente as atividades dos novos colaboradores, com histórico e rastreabilidade para RH, gestores e colaboradores.

O backend atende o aplicativo em `frontend/` (Expo / React Native, também rodando no navegador).

## Tecnologias

- Node.js + Express
- MySQL (`mysql2/promise`, pool de conexões)
- JWT (`jsonwebtoken`) para autenticação
- `bcryptjs` para o hash das senhas
- `dotenv`, `cors`, `nodemon` (desenvolvimento)

## Funcionalidades principais

- **Perfis e permissões:** RH, Gestor e Colaborador. Cada perfil só enxerga o que lhe cabe: o RH vê tudo, o gestor vê a sua equipe, o colaborador vê apenas a própria jornada.
- **Cadastro pelo RH:** só o RH cadastra gestores e colaboradores. O sistema gera um **convite** (link com token) para a pessoa concluir o cadastro e criar a senha.
- **Jornada de 30 dias corridos:** ao cadastrar um colaborador, são criadas 25 atividades fixas, em 5 grupos de 5 (as "semanas" do app), com início e prazo próprios a partir da admissão.
- **Atividades:** o colaborador inicia e conclui as atividades. O status (pendente, em andamento, atrasada, concluída) é **calculado** pelas datas e pelas ações, nunca guardado.
- **Feedbacks:** o gestor envia feedbacks aos colaboradores da sua equipe; o colaborador os vê na tela inicial.
- **Assinatura digital do termo de conclusão:** o colaborador só assina depois de concluir todas as atividades. Depois dele, o gestor assina. O processo só termina com as duas assinaturas.
- **Acompanhamento do RH:** painel geral, lista de jornadas com filtro por situação, painel por gestor, assinaturas assinadas e pendentes, e pedido de assinatura.
- **Histórico:** eventos importantes (cadastros, assinaturas etc.) são gravados na tabela `evento` e aparecem na tela inicial do RH.

## Segurança

- Senhas guardadas com hash (bcrypt).
- Autenticação por JWT (validade de 8 horas), enviado como `Authorization: Bearer <token>`.
- Convite de cadastro com token aleatório guardado como hash (SHA-256), válido por **7 dias** e de **uso único**.
- Bloqueio de login: **3 senhas erradas** bloqueiam a conta por **15 minutos**.
- Senha com no mínimo 8 caracteres, com letra maiúscula, minúscula, número e caractere especial.
- Rotas protegidas por perfil; um perfil nunca acessa dados de outro.
- Segredos ficam no `.env`, que **não** vai para o git (use o `.env.example` como modelo).

## Como rodar

Pré-requisitos: Node.js e MySQL.

1. Crie o banco e as tabelas: abra o MySQL Workbench e execute `backend/sql/schema.sql`. Ele cria o banco `on_the_job` do zero.
2. Copie `backend/.env.example` para `backend/.env` e preencha os valores (usuário e senha do MySQL, um `JWT_SECRET` aleatório etc.).
3. Instale as dependências, na raiz do projeto:
   ```
   npm run install
   ```
4. Crie o primeiro usuário de RH, dentro da pasta `backend`:
   - **Produção/AWS:** `node src/scripts/criar-rh.js` (pergunta nome, e-mail e senha).
   - **Desenvolvimento:** `node src/scripts/seed-teste.js` cria usuários de teste de todos os perfis (senha fraca, só para uso local).
5. Suba backend e front juntos, na raiz do projeto:
   ```
   npm run dev
   ```
   Para subir só o backend, dentro de `backend`: `npm run dev`.

A API roda em `http://localhost:3000`. Para checar se está no ar: `GET /teste`.

### Variáveis de ambiente (`.env`)

| Variável | Para que serve |
|---|---|
| `PORT` | Porta da API (3000) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Conexão com o MySQL |
| `JWT_SECRET` | Segredo usado para assinar os tokens |
| `JWT_EXPIRES_IN` | Validade do token |
| `APP_URL` | Endereço do front, usado para montar o link do convite |

## Estrutura do código

```
backend/
├── sql/
│   └── schema.sql              # Banco completo (tabelas e relacionamentos)
└── src/
    ├── server.js               # Sobe o servidor
    ├── app.js                  # Configura o Express e monta as rotas
    ├── config/
    │   ├── db.js               # Pool de conexão MySQL
    │   ├── jornada.js          # As 25 atividades e o cálculo das datas (30 dias)
    │   └── regras.js           # Status das atividades, progresso, biblioteca, data de fim
    ├── middlewares/
    │   └── auth.js             # Valida o token e o perfil de acesso
    ├── routes/                 # Define os endereços de cada grupo de rotas
    ├── controllers/            # Lógica de cada rota (valida, grava, responde)
    ├── services/
    │   ├── equipe.js           # Monta a visão da equipe e das pendências do gestor
    │   ├── rh.js               # Monta os painéis e listas do RH
    │   └── eventos.js          # Registra eventos no histórico
    └── scripts/
        ├── criar-rh.js         # Cria o primeiro usuário de RH (produção/AWS)
        └── seed-teste.js       # Cria usuários de teste de cada perfil
```

## Endpoints

Todas as rotas, exceto as de `/auth`, exigem o token. Erros voltam como `{ "erro": "mensagem" }`, com os códigos 400 (dados inválidos), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 409 (conflito, ex.: e-mail já cadastrado), 423 (conta bloqueada) e 500.

### Autenticação
| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Login por perfil (`role`), e-mail e senha. Devolve o token e os dados do usuário |
| POST | `/auth/concluir-conta` | Conclui o cadastro pelo convite: `{ email, token, senha }` |

### Cadastros (RH)
| Método | Rota | Descrição |
|---|---|---|
| GET | `/gestores` | Lista os gestores |
| POST | `/gestores` | Cadastra gestor e gera o convite |
| POST | `/colaboradores` | Cadastra colaborador, cria a jornada e gera o convite |

### Colaborador — `/minha-jornada`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/minha-jornada/home` | Resumo, próximas atividades e feedbacks |
| GET | `/minha-jornada/atividades` | Atividades por semana, com status |
| POST | `/minha-jornada/atividades/:id/iniciar` | Inicia uma atividade |
| POST | `/minha-jornada/atividades/:id/concluir` | Conclui uma atividade |
| GET | `/minha-jornada/documentos` | Termo de conclusão, resumo e biblioteca |
| POST | `/minha-jornada/documentos/:id/assinar` | Assina o termo (`{ nome }`) |

### Gestor — `/minha-equipe`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/minha-equipe/home` | Resumo da equipe e itens de atenção |
| GET | `/minha-equipe/equipe?status=` | Colaboradores da equipe, com filtro opcional |
| GET | `/minha-equipe/atencao` | Pendências (feedback e assinatura) e histórico |
| POST | `/minha-equipe/colaboradores/:id/feedbacks` | Envia feedback (`{ texto }`) |
| GET | `/minha-equipe/documentos/:id/assinatura` | Dados da tela de assinatura do gestor |
| POST | `/minha-equipe/documentos/:id/assinar` | Assina o termo (`{ nome }`) |

### RH — `/rh`
| Método | Rota | Descrição |
|---|---|---|
| GET | `/rh/home` | Indicadores gerais e últimos eventos |
| GET | `/rh/assinaturas` | Documentos assinados e pendentes |
| GET | `/rh/acompanhamento?filtro=` | Jornadas de todos, com filtro opcional |
| GET | `/rh/painel-gestores` | Visão consolidada por gestor |
| POST | `/rh/documentos/:id/solicitar-assinatura` | Registra o pedido de assinatura |

## Regras de negócio implementadas

- Somente o RH cadastra gestores e colaboradores.
- O programa dura **30 dias corridos** a partir da admissão.
- As atividades são fixas, iguais para qualquer cargo. A primeira começa em D+1 e cada uma tem prazo de 2 dias, sem passar do dia 30.
- O colaborador só assina o termo depois de concluir **todas** as atividades.
- O gestor só assina depois do colaborador. O processo só é concluído com as duas assinaturas.
- Visibilidade: RH vê todos os processos, gestor vê a própria equipe, colaborador vê só a própria jornada.

## Limitações e pendências conhecidas

- **E-mail do convite:** ainda não é enviado. O link do convite aparece no console do servidor (linhas `[api]`) e é entregue manualmente.
- **Notificações e lembretes** (e-mail e WhatsApp) não estão implementados. O botão "solicitar assinatura" só registra o pedido.
- O login do front fica só em memória: ao recarregar a página, é preciso entrar de novo.
- A biblioteca de documentos é uma lista fixa de 4 itens; os arquivos PDF ainda não são servidos pelo backend.
- Exportação do documento final em PDF não implementada.
- Fora do escopo desta versão: perfil Padrinho, validação das atividades pelo gestor, recuperação de senha.