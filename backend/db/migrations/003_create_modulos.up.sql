CREATE TABLE IF NOT EXISTS modulos (
  id             SERIAL PRIMARY KEY,
  curso_id       INT  NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  titulo         TEXT NOT NULL,
  contenido      JSONB NOT NULL DEFAULT '[]',
  palabras       INT  NOT NULL DEFAULT 0,
  orden          INT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modulos_curso ON modulos (curso_id, orden);