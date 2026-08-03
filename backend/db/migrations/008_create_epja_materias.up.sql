CREATE TABLE IF NOT EXISTS epja_materias (
  id             SERIAL PRIMARY KEY,
  codigo         TEXT UNIQUE NOT NULL,
  nombre         TEXT NOT NULL,
  descripcion    TEXT NOT NULL DEFAULT '',
  color          TEXT NOT NULL DEFAULT '#2E5638',
  orden          INT NOT NULL DEFAULT 0,
  activa         BOOLEAN NOT NULL DEFAULT true,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epja_materias_orden ON epja_materias (orden, id);
