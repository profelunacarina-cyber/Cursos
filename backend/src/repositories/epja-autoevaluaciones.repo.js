import { getPool } from '../db/pool.js';

function aCertificado(fila) {
  return fila.certificado_id ? {
    id: fila.certificado_id,
    codigo: fila.certificado_codigo,
    emitidoEn: fila.certificado_emitido_en,
    revocadoEn: fila.certificado_revocado_en
  } : null;
}

export const epjaAutoevaluacionesRepo = {
  async estado(estudianteId, moduloId) {
    const { rows } = await getPool().query(
      `SELECT COUNT(i.id)::int AS intentos,
              COALESCE(MAX(i.porcentaje), 0)::int AS mejor_porcentaje,
              MAX(i.creado_en) AS ultimo_intento_en,
              c.id AS certificado_id,
              c.codigo AS certificado_codigo,
              c.emitido_en AS certificado_emitido_en,
              c.revocado_en AS certificado_revocado_en
         FROM epja_modulos mod
    LEFT JOIN epja_autoevaluacion_intentos i
           ON i.modulo_id = mod.id AND i.estudiante_id = $1
    LEFT JOIN epja_certificados c
           ON c.modulo_id = mod.id AND c.estudiante_id = $1
        WHERE mod.id = $2
        GROUP BY c.id, c.codigo, c.emitido_en, c.revocado_en`,
      [estudianteId, moduloId]
    );
    const fila = rows[0] || {};
    return {
      intentos: fila.intentos || 0,
      mejorPorcentaje: fila.mejor_porcentaje || 0,
      ultimoIntentoEn: fila.ultimo_intento_en || null,
      certificado: aCertificado(fila)
    };
  },

  async registrarIntento({ estudianteId, moduloId, aciertos, total, porcentaje, aprobado, respuestas, certificadoAutomatico }) {
    const cliente = await getPool().connect();
    try {
      await cliente.query('BEGIN');
      const acceso = await cliente.query(
        `SELECT 1
           FROM epja_modulos mod
           JOIN epja_estudiantes_materias em
             ON em.materia_id = mod.materia_id AND em.estudiante_id = $2
          WHERE mod.id = $1 AND mod.publicado = true`,
        [moduloId, estudianteId]
      );
      if (!acceso.rows[0]) throw new Error('El estudiante no tiene acceso a este módulo');

      const { rows } = await cliente.query(
        `INSERT INTO epja_autoevaluacion_intentos
          (estudiante_id, modulo_id, aciertos, total, porcentaje, aprobado, respuestas)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
         RETURNING id, creado_en`,
        [estudianteId, moduloId, aciertos, total, porcentaje, aprobado, JSON.stringify(respuestas)]
      );

      let certificado = null;
      if (aprobado) {
        await cliente.query(
          `INSERT INTO epja_progreso_modulos
            (estudiante_id, modulo_id, completado, aprobado, ultimo_acceso, completado_en, aprobado_en)
           VALUES ($1, $2, true, true, now(), now(), now())
           ON CONFLICT (estudiante_id, modulo_id)
           DO UPDATE SET completado = true,
                         aprobado = true,
                         ultimo_acceso = now(),
                         completado_en = COALESCE(epja_progreso_modulos.completado_en, now()),
                         aprobado_en = COALESCE(epja_progreso_modulos.aprobado_en, now())`,
          [estudianteId, moduloId]
        );

        if (certificadoAutomatico) {
          const codigo = `EPJA-${new Date().getFullYear()}-${estudianteId}-${moduloId}`;
          const resultado = await cliente.query(
            `INSERT INTO epja_certificados (codigo, estudiante_id, modulo_id)
             VALUES ($1, $2, $3)
             ON CONFLICT (estudiante_id, modulo_id)
             DO UPDATE SET revocado_en = NULL
             RETURNING id, codigo, emitido_en, revocado_en`,
            [codigo, estudianteId, moduloId]
          );
          const c = resultado.rows[0];
          certificado = { id: c.id, codigo: c.codigo, emitidoEn: c.emitido_en, revocadoEn: c.revocado_en };
        }
      }

      await cliente.query('COMMIT');
      return { id: rows[0].id, creadoEn: rows[0].creado_en, certificado };
    } catch (error) {
      await cliente.query('ROLLBACK');
      throw error;
    } finally {
      cliente.release();
    }
  }
};
