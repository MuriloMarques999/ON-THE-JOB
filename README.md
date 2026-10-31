# Digitalização do ON THE JOB

## Sobre o Projeto
Este projeto visa resolver o processo de "On The Job" da empresa Fábrica Fortaleza (M. Dias Branco S.A.), que atualmente é burocrático, manual e pouco rastreável. O objetivo principal é digitalizar e centralizar o processo, permitindo o registro, acompanhamento, validação e assinatura digital das atividades, garantindo agilidade, rastreabilidade e segurança.

## Funcionalidades e Fluxo do MVP
O fluxo principal da aplicação consiste nas seguintes etapas:
1. O RH cadastra o colaborador.
2. O Gestor recebe a documentação e disponibiliza as atividades.
3. O Colaborador acessa a plataforma e registra as atividades concluídas.
4. O Gestor ou Padrinho acompanha o progresso e valida a execução.
5. Colaborador e Gestor realizam a assinatura digital.
6. O RH monitora o status geral e acessa o documento final gerado.

## Tecnologias Utilizadas
* **Frontend:** React native
* **Backend:** Node.js e Python
* **Banco de Dados:** MySQL
* **Nuvem & Infraestrutura:** AWS
* **Controle de Versão:** GitHub

## Como iniciar
Instale as dependências uma vez, na pasta raiz do projeto:

```bash
npm run instalar
```

Depois, inicie cada parte em um terminal separado.

No primeiro terminal, inicie o backend:

```bash
cd backend
npm run dev
```

No segundo terminal, inicie o frontend web:

```bash
cd frontend
npm run web
```

## Equipe
* Anne Carlini de Oliveira
* Matheus Silva Santos
* João Vitor Nogueira Alves
* Murilo Marques Dantas Vieira

## Requisitos e Escopo
* **Obrigatório:** Cadastro, login, registro/acompanhamento de atividades, histórico, permissões de usuário, gestão de evidências, banco de dados e segurança.
* **Desejável:** Dashboard interativo, notificações, geração de relatórios, versão mobile.
