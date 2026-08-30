DROP TABLE IF EXISTS epja_autoevaluacion_intentos CASCADE;

ALTER TABLE epja_modulos
  DROP CONSTRAINT IF EXISTS epja_modulos_certificado_modo_check,
  DROP COLUMN IF EXISTS certificado_modo,
  DROP COLUMN IF EXISTS autoevaluacion;
