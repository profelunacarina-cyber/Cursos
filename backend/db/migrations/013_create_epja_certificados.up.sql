CREATE TABLE IF NOT EXISTS epja_certificados (
  id            SERIAL PRIMARY KEY,
  codigo        TEXT UNIQUE NOT NULL,
  estudiante_id INT NOT NULL REFERENCES epja_estudiantes(id) ON DELETE CASCADE,
  modulo_id     INT NOT NULL REFERENCES epja_modulos(id) ON DELETE CASCADE,
  emitido_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  revocado_en   TIMESTAMPTZ,
  UNIQUE (estudiante_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_epja_certificados_estudiante ON epja_certificados (estudiante_id, emitido_en DESC);
