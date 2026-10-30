-- Para bancos criados antes do aceite dos termos (LGPD). Execute uma única vez.
USE on_the_job;

ALTER TABLE usuario
  ADD COLUMN termos_aceitos_em DATETIME    NULL,
  ADD COLUMN termos_versao     VARCHAR(10) NULL;
