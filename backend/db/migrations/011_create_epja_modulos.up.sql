CREATE TABLE IF NOT EXISTS epja_modulos (
  id             SERIAL PRIMARY KEY,
  materia_id     INT NOT NULL REFERENCES epja_materias(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  resumen        TEXT NOT NULL DEFAULT '',
  contenido      JSONB NOT NULL DEFAULT '""',
  palabras       INT NOT NULL DEFAULT 0,
  orden          INT NOT NULL DEFAULT 0,
  publicado      BOOLEAN NOT NULL DEFAULT false,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epja_modulos_materia ON epja_modulos (materia_id, orden, id);
