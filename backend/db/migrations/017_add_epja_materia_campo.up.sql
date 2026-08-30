ALTER TABLE epja_materias
  ADD COLUMN IF NOT EXISTS campo TEXT;

UPDATE epja_materias
   SET campo = codigo
 WHERE campo IS NULL OR btrim(campo) = '';

ALTER TABLE epja_materias
  ALTER COLUMN campo SET NOT NULL;

-- Algunas bases existentes limitaban el código a FOI o FOII. Los códigos siguen
-- siendo normalizados, pero ahora deben admitir cualquier materia y campo.
ALTER TABLE epja_materias
  DROP CONSTRAINT IF EXISTS epja_materias_codigo_valido;

ALTER TABLE epja_materias
  ADD CONSTRAINT epja_materias_codigo_valido
  CHECK (codigo ~ '^[a-z0-9]{1,40}$');

CREATE INDEX IF NOT EXISTS idx_epja_materias_campo
  ON epja_materias (campo, orden, id);

INSERT INTO epja_materias (codigo, campo, nombre, descripcion, color, orden, activa)
SELECT 'foiiadministracionsueldos', 'foii',
       'Administración y liquidación de sueldos',
       'Administración laboral, registración y liquidación de haberes.',
       '#B05C33',
       COALESCE((SELECT MAX(orden) + 1 FROM epja_materias), 1),
       true
 WHERE EXISTS (SELECT 1 FROM epja_materias WHERE lower(codigo) = 'foii')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO epja_materias (codigo, campo, nombre, descripcion, color, orden, activa)
SELECT 'foiieconomiasocial', 'foii',
       'Economía social y desarrollo sustentable',
       'Economía social, formas de cooperación y desarrollo sustentable en el territorio.',
       '#B05C33',
       COALESCE((SELECT MAX(orden) + 1 FROM epja_materias), 1),
       true
 WHERE EXISTS (SELECT 1 FROM epja_materias WHERE lower(codigo) = 'foii')
ON CONFLICT (codigo) DO NOTHING;

-- Quien ya cursaba FO II debe conservar acceso a todas las materias del campo.
INSERT INTO epja_estudiantes_materias (estudiante_id, materia_id)
SELECT DISTINCT em.estudiante_id, nuevas.id
  FROM epja_estudiantes_materias em
  JOIN epja_materias original ON original.id = em.materia_id
 CROSS JOIN epja_materias nuevas
 WHERE lower(original.campo) = 'foii'
   AND lower(nuevas.campo) = 'foii'
ON CONFLICT (estudiante_id, materia_id) DO NOTHING;

-- Reubica las clases de ejemplo, si todavía existen con sus títulos originales.
UPDATE epja_modulos
   SET materia_id = (SELECT id FROM epja_materias WHERE codigo = 'foiiadministracionsueldos')
 WHERE lower(titulo) LIKE 'administraci%n y liquidaci%n de sueldos%'
   AND EXISTS (SELECT 1 FROM epja_materias WHERE codigo = 'foiiadministracionsueldos');

UPDATE epja_modulos
   SET materia_id = (SELECT id FROM epja_materias WHERE codigo = 'foiieconomiasocial')
 WHERE lower(titulo) LIKE 'econom%a social%'
   AND EXISTS (SELECT 1 FROM epja_materias WHERE codigo = 'foiieconomiasocial');
