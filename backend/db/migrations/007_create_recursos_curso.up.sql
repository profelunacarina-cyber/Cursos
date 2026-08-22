CREATE TABLE IF NOT EXISTS recursos_curso (
  id             SERIAL PRIMARY KEY,
  curso_id       INT NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('evaluacion', 'herramienta')),
  titulo         TEXT NOT NULL,
  contenido_html TEXT NOT NULL DEFAULT '',
  configuracion  JSONB NOT NULL DEFAULT '{}',
  activo         BOOLEAN NOT NULL DEFAULT false,
  orden          INT NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recursos_curso ON recursos_curso (curso_id, orden);
