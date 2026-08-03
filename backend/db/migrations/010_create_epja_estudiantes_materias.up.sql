CREATE TABLE IF NOT EXISTS epja_estudiantes_materias (
  estudiante_id INT NOT NULL REFERENCES epja_estudiantes(id) ON DELETE CASCADE,
  materia_id    INT NOT NULL REFERENCES epja_materias(id) ON DELETE CASCADE,
  creado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (estudiante_id, materia_id)
);

CREATE INDEX IF NOT EXISTS idx_epja_estudiantes_materias_materia ON epja_estudiantes_materias (materia_id, estudiante_id);
