-- Esquema de la base de datos de profeluna.ar (PostgreSQL / Neon)
-- Se ejecuta con: npm run db:init

CREATE TABLE IF NOT EXISTS secciones (
  id     SERIAL PRIMARY KEY,
  clave  TEXT UNIQUE NOT NULL,   -- identificador interno: ruta, transversales, matriz, proximas
  titulo TEXT NOT NULL,
  orden  INT  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cursos (
  id             SERIAL PRIMARY KEY,
  seccion_id     INT  NOT NULL REFERENCES secciones(id) ON DELETE CASCADE,
  etiqueta       TEXT NOT NULL DEFAULT '',      -- texto chico de la tarjeta ("Estudio de costos")
  titulo         TEXT NOT NULL,
  descripcion    TEXT NOT NULL DEFAULT '',
  estado         TEXT NOT NULL DEFAULT 'proximamente'
                 CHECK (estado IN ('disponible', 'proximamente', 'preparacion', 'externo')),
  enlace         TEXT NOT NULL DEFAULT '',
  texto_enlace   TEXT NOT NULL DEFAULT '',      -- texto del botón ("Empezar el curso →")
  metas          JSONB NOT NULL DEFAULT '[]',   -- datos rápidos: ["10 módulos", "~120 min"]
  destacado      BOOLEAN NOT NULL DEFAULT false,-- tarjeta resaltada (fondo verde)
  insignia       TEXT NOT NULL DEFAULT '',      -- texto opcional que reemplaza al badge de estado
  orden          INT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Módulos de los cursos creados desde el panel (contenido propio, sin enlace externo).
-- contenido es una lista de bloques: [{ "t": "sub|par|lista", "v": "..." }].
-- palabras se guarda ya calculado para poder estimar el tiempo de lectura del curso sin releer el JSON.
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

-- Resultados de las autoevaluaciones.
-- curso_slug identifica la evaluación por su carpeta (costos, marketing-mix, ...) y no por FK,
-- porque hay cursos sin evaluación y evaluaciones que viven fuera de este listado.
CREATE TABLE IF NOT EXISTS resultados (
  id         SERIAL PRIMARY KEY,
  curso_slug TEXT NOT NULL,
  nombre     TEXT NOT NULL,
  apellido   TEXT NOT NULL,
  aciertos   INT  NOT NULL CHECK (aciertos >= 0),
  total      INT  NOT NULL CHECK (total > 0),
  porcentaje INT  NOT NULL,
  aprobado   BOOLEAN NOT NULL,
  modo       TEXT NOT NULL DEFAULT '',          -- estudiante | emprendedor
  detalle    JSONB NOT NULL DEFAULT '[]',       -- correcto/incorrecto por pregunta
  creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resultados_curso ON resultados (curso_slug, creado_en DESC);
CREATE INDEX IF NOT EXISTS idx_cursos_seccion   ON cursos (seccion_id, orden);

-- Organizaciones del territorio (alimentan el mapa y la vitrina).
-- aprobado controla si se muestran en el sitio público; el panel las ve todas.
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
  rooms          JSONB NOT NULL DEFAULT '[]',       -- recorrido guiado (pasos: portal/narrativa/quiz/cierre)
  orden          INT  NOT NULL DEFAULT 0,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_aprobado ON organizaciones (aprobado, orden);
-- Para la tabla que ya existía antes de agregar el recorrido guiado:
ALTER TABLE organizaciones ADD COLUMN IF NOT EXISTS rooms JSONB NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS admins (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  nombre        TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO secciones (clave, titulo, orden) VALUES
  ('ruta',          'Ruta del emprendedor',    1),
  ('transversales', 'Cursos transversales',    2),
  ('matriz',        'Matriz Semilla',          3),
  ('proximas',      'Próximas capacitaciones', 4)
ON CONFLICT (clave) DO NOTHING;
