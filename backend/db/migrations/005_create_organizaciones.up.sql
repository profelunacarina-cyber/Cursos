CREATE TABLE IF NOT EXISTS organizaciones (
  id             SERIAL PRIMARY KEY,
  nombre         TEXT NOT NULL,
  tipo           TEXT NOT NULL DEFAULT 'Emprendimiento',
  zona           TEXT NOT NULL DEFAULT 'Chubut',
  localidad      TEXT NOT NULL DEFAULT '',
  descripcion    TEXT NOT NULL DEFAULT '',
  tags           JSONB NOT NULL DEFAULT '[]',
  lat            DOUBLE PRECISION,
  lng            DOUBLE PRECISION,
  contacto       TEXT NOT NULL DEFAULT '',
  aprobado       BOOLEAN NOT NULL DEFAULT false,
  destacado      BOOLEAN NOT NULL DEFAULT false,
  rooms          JSONB NOT NULL DEFAULT '[]',
  orden          INT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS rooms JSONB NOT NULL DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_org_aprobado ON organizaciones (aprobado, orden);
