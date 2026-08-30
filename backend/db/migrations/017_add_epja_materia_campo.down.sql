UPDATE epja_modulos
   SET materia_id = (SELECT id FROM epja_materias WHERE codigo = 'foii')
 WHERE materia_id IN (
   SELECT id FROM epja_materias
    WHERE codigo IN ('foiiadministracionsueldos', 'foiieconomiasocial')
 )
   AND EXISTS (SELECT 1 FROM epja_materias WHERE codigo = 'foii');

DELETE FROM epja_materias
 WHERE codigo IN ('foiiadministracionsueldos', 'foiieconomiasocial');

ALTER TABLE epja_materias
  DROP CONSTRAINT IF EXISTS epja_materias_codigo_valido;

ALTER TABLE epja_materias
  ADD CONSTRAINT epja_materias_codigo_valido
  CHECK (codigo = ANY (ARRAY['foi'::text, 'foii'::text]));

DROP INDEX IF EXISTS idx_epja_materias_campo;

ALTER TABLE epja_materias
  DROP COLUMN IF EXISTS campo;
