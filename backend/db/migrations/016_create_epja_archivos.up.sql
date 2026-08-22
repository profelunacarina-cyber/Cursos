CREATE TABLE IF NOT EXISTS epja_archivos (
  id             TEXT PRIMARY KEY,
  nombre         TEXT NOT NULL,
  tipo_mime      TEXT NOT NULL,
  contenido      BYTEA NOT NULL,
  tamanio        INT NOT NULL,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epja_archivos_creado
  ON epja_archivos (creado_en DESC);
