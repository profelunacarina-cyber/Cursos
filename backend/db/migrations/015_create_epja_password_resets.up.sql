CREATE TABLE IF NOT EXISTS epja_password_resets (
  id            BIGSERIAL PRIMARY KEY,
  estudiante_id INT NOT NULL REFERENCES epja_estudiantes(id) ON DELETE CASCADE,
  codigo_hash   TEXT NOT NULL,
  reset_token_hash TEXT UNIQUE,
  expira_en     TIMESTAMPTZ NOT NULL,
  reset_expira_en TIMESTAMPTZ,
  intentos      INT NOT NULL DEFAULT 0,
  verificado_en TIMESTAMPTZ,
  usado_en      TIMESTAMPTZ,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_epja_password_resets_estudiante
  ON epja_password_resets (estudiante_id, creado_en DESC)
  WHERE usado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_epja_password_resets_expira
  ON epja_password_resets (expira_en)
  WHERE usado_en IS NULL;

CREATE INDEX IF NOT EXISTS idx_epja_password_resets_token
  ON epja_password_resets (reset_token_hash)
  WHERE usado_en IS NULL AND reset_token_hash IS NOT NULL;
