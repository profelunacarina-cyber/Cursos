CREATE TABLE IF NOT EXISTS epja_progreso_modulos (
  estudiante_id  INT NOT NULL REFERENCES epja_estudiantes(id) ON DELETE CASCADE,
  modulo_id      INT NOT NULL REFERENCES epja_modulos(id) ON DELETE CASCADE,
  completado     BOOLEAN NOT NULL DEFAULT false,
  aprobado       BOOLEAN NOT NULL DEFAULT false,
  ultimo_acceso  TIMESTAMPTZ NOT NULL DEFAULT now(),
  completado_en  TIMESTAMPTZ,
  aprobado_en    TIMESTAMPTZ,
  PRIMARY KEY (estudiante_id, modulo_id)
);

CREATE INDEX IF NOT EXISTS idx_epja_progreso_modulos_modulo ON epja_progreso_modulos (modulo_id, estudiante_id);
