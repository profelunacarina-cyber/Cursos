CREATE TABLE IF NOT EXISTS secciones (
  id     SERIAL PRIMARY KEY,
  clave  TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  orden  INT  NOT NULL DEFAULT 0
);

INSERT INTO secciones (clave, titulo, orden) VALUES
  ('ruta',          'Ruta del emprendedor',    1),
  ('transversales', 'Cursos transversales',    2),
  ('matriz',        'Matriz Semilla',          3),
  ('proximas',      'Próximas capacitaciones', 4)
ON CONFLICT (clave) DO UPDATE SET
  titulo = EXCLUDED.titulo,
  orden = EXCLUDED.orden;
