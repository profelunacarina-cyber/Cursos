DROP INDEX IF EXISTS idx_epja_estudiantes_email_unico;

ALTER TABLE epja_estudiantes
  DROP COLUMN IF EXISTS email;
