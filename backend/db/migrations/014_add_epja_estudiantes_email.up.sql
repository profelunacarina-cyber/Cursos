ALTER TABLE epja_estudiantes
  ADD COLUMN IF NOT EXISTS email TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_epja_estudiantes_email_unico
  ON epja_estudiantes (LOWER(email))
  WHERE email IS NOT NULL AND email <> '';
