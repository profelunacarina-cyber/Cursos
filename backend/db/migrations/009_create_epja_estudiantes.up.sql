CREATE TABLE IF NOT EXISTS epja_estudiantes (
  id             SERIAL PRIMARY KEY,
  dni            TEXT UNIQUE NOT NULL,
  nombre         TEXT NOT NULL,
  apellido       TEXT NOT NULL,
  password_hash  TEXT NOT NULL,
  activo         BOOLEAN NOT NULL DEFAULT true,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epja_estudiantes_apellido ON epja_estudiantes (apellido, nombre, id);
