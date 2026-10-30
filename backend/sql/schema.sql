CREATE DATABASE IF NOT EXISTS on_the_job
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE on_the_job;

CREATE TABLE area (
  cod_area   INT AUTO_INCREMENT PRIMARY KEY,
  nome_area  VARCHAR(100) NOT NULL
);

CREATE TABLE usuario (
  id_usuario         INT AUTO_INCREMENT PRIMARY KEY,
  nome               VARCHAR(150) NOT NULL,
  email              VARCHAR(150) NOT NULL UNIQUE,
  senha              VARCHAR(255) NULL,
  status             VARCHAR(20)  NOT NULL DEFAULT 'pendente',   -- pendente | ativo
  perfil_acesso      VARCHAR(20)  NOT NULL,                      -- rh | gestor | colaborador
  telefone           VARCHAR(20)  NULL,
  cargo              VARCHAR(100) NULL,
  token_convite      VARCHAR(255) NULL,                          -- só o hash (SHA-256) do convite
  convite_expira_em  DATETIME     NULL,
  tentativas_falhas  INT          NOT NULL DEFAULT 0,
  bloqueado_ate      DATETIME     NULL,
  termos_aceitos_em  DATETIME     NULL,                          -- aceite dos termos de uso / LGPD
  termos_versao      VARCHAR(10)  NULL                           -- versão aceita (nova versão pede novo aceite)
);

CREATE TABLE gestor (
  id_gestor   INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario  INT NOT NULL UNIQUE,
  cod_area    INT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (cod_area)   REFERENCES area(cod_area)
);

CREATE TABLE colaborador (
  id_colaborador  INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT NOT NULL UNIQUE,
  id_gestor       INT NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  FOREIGN KEY (id_gestor)  REFERENCES gestor(id_gestor)
);

CREATE TABLE onboarding (
  id_onboarding   INT AUTO_INCREMENT PRIMARY KEY,
  id_colaborador  INT NOT NULL UNIQUE,
  data_inicio     DATE NOT NULL,
  data_conclusao  DATE NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'em_andamento',
  FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador)
);

-- Termo de conclusão do onboarding (1 por onboarding)
CREATE TABLE formulario (
  id_formulario               INT AUTO_INCREMENT PRIMARY KEY,
  id_onboarding               INT NOT NULL,
  id_gestor                   INT NOT NULL,
  status                      VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_assinatura             DATETIME NULL,        -- assinatura do GESTOR
  data_assinatura_colaborador DATETIME NULL,
  assinatura_colaborador      VARCHAR(150) NULL,    -- nome digitado
  assinatura_gestor           VARCHAR(150) NULL,
  FOREIGN KEY (id_onboarding) REFERENCES onboarding(id_onboarding),
  FOREIGN KEY (id_gestor)     REFERENCES gestor(id_gestor)
);

-- Atividades da jornada (25 por colaborador). O status é calculado pelas datas.
CREATE TABLE tarefa (
  id_tarefa       INT AUTO_INCREMENT PRIMARY KEY,
  id_onboarding   INT NOT NULL,
  descricao       VARCHAR(255) NOT NULL,
  envolvidos      VARCHAR(60)  NOT NULL DEFAULT '',
  data_inicio     DATE NULL,
  prazo           DATE NULL,
  iniciada_em     DATE NULL,
  data_conclusao  DATE NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pendente',
  FOREIGN KEY (id_onboarding) REFERENCES onboarding(id_onboarding)
);

-- Feedback do gestor para o colaborador
CREATE TABLE feedback (
  id_feedback    INT AUTO_INCREMENT PRIMARY KEY,
  id_colaborador INT NOT NULL,
  id_gestor      INT NOT NULL,
  texto          TEXT NOT NULL,
  data           DATE NOT NULL,
  FOREIGN KEY (id_colaborador) REFERENCES colaborador(id_colaborador),
  FOREIGN KEY (id_gestor)      REFERENCES gestor(id_gestor)
);

-- Histórico exibido na home do RH
CREATE TABLE evento (
  id_evento INT AUTO_INCREMENT PRIMARY KEY,
  texto     VARCHAR(255) NOT NULL,
  data      DATE NOT NULL
);

INSERT INTO area (nome_area) VALUES ('Tecnologia'), ('Operações');