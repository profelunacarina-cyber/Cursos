CREATE TABLE IF NOT EXISTS cursos (
  id             SERIAL PRIMARY KEY,
  seccion_id     INT  NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  etiqueta       TEXT NOT NULL DEFAULT '',
  titulo         TEXT NOT NULL,
  descripcion    TEXT NOT NULL DEFAULT '',
  estado         TEXT NOT NULL DEFAULT 'proximamente'
                 CHECK (estado IN ('disponible', 'proximamente', 'preparacion', 'externo')),
  enlace         TEXT NOT NULL DEFAULT '',
  origen_html    TEXT NOT NULL DEFAULT '',
  texto_enlace   TEXT NOT NULL DEFAULT '',
  metas          JSONB NOT NULL DEFAULT '[]',
  destacado      BOOLEAN NOT NULL DEFAULT false,
  insignia       TEXT NOT NULL DEFAULT '',
  orden          INT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cursos ADD COLUMN IF NOT EXISTS origen_html TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_cursos_seccion ON cursos (seccion_id, orden);
