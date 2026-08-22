import { getPool } from '../db/pool.js';

export const epjaProgresoRepo = {
  async marcarCompleto(estudianteId, moduloId) {
    await getPool().query(
      `INSERT INTO epja_progreso_modulos (estudiante_id, modulo_id, completado, ultimo_acceso, completado_en)
       VALUES ($1, $2, true, now(), now())
       ON CONFLICT (estudiante_id, modulo_id)
       DO UPDATE SET completado = true,
                     ultimo_acceso = now(),
                     completado_en = COALESCE(epja_progreso_modulos.completado_en, now())`,
      [estudianteId, moduloId]
    );
  }
};
