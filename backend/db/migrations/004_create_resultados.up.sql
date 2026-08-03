CREATE TABLE IF NOT EXISTS resultados (
  id          SERIAL PRIMARY KEY,
  curso_slug  TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  apellido    TEXT NOT NULL,
  aciertos    INT  NOT NULL CHECK (aciertos >= 0),
  total       INT  NOT NULL CHECK (total > 0),
  porcentaje  INT  NOT NULL,
  aprobado    BOOLEAN NOT NULL,
  modo        TEXT NOT NULL DEFAULT '',
  detalle     JSONB NOT NULL DEFAULT '[]',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resultados_curso ON resultados (curso_slug, creado_en DESC);
