ALTER TABLE epja_modulos
  ADD COLUMN IF NOT EXISTS autoevaluacion JSONB NOT NULL
    DEFAULT '{"activa":false,"notaAprobacion":60,"preguntas":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS certificado_modo TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE epja_modulos
  DROP CONSTRAINT IF EXISTS epja_modulos_certificado_modo_check;

ALTER TABLE epja_modulos
  ADD CONSTRAINT epja_modulos_certificado_modo_check
  CHECK (certificado_modo IN ('manual', 'automatico'));

CREATE TABLE IF NOT EXISTS epja_autoevaluacion_intentos (
  id             BIGSERIAL PRIMARY KEY,
  estudiante_id  INT NOT NULL REFERENCES epja_estudiantes(id) ON DELETE CASCADE,
  modulo_id      INT NOT NULL REFERENCES epja_modulos(id) ON DELETE CASCADE,
  aciertos       INT NOT NULL CHECK (aciertos >= 0),
  total          INT NOT NULL CHECK (total > 0),
  porcentaje     INT NOT NULL CHECK (porcentaje BETWEEN 0 AND 100),
  aprobado       BOOLEAN NOT NULL DEFAULT false,
  respuestas     JSONB NOT NULL DEFAULT '[]'::jsonb,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (aciertos <= total)
);

CREATE INDEX IF NOT EXISTS idx_epja_autoevaluacion_intentos_estudiante
  ON epja_autoevaluacion_intentos (estudiante_id, modulo_id, creado_en DESC);
