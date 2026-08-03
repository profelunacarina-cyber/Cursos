import { getPool } from '../db/pool.js';

export const epjaPasswordResetsRepo = {
  async invalidarPendientes(estudianteId) {
    await getPool().query(
      `UPDATE epja_password_resets
          SET usado_en = now()
        WHERE estudiante_id = $1
          AND usado_en IS NULL`,
      [estudianteId]
    );
  },

  async crear({ estudianteId, codigoHash, expiraEn }) {
    const { rows } = await getPool().query(
      `INSERT INTO epja_password_resets (estudiante_id, codigo_hash, expira_en)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [estudianteId, codigoHash, expiraEn]
    );
    return rows[0] || null;
  },

  async obtenerActivoPorEmail(email) {
    const { rows } = await getPool().query(
      `SELECT r.id, r.codigo_hash, r.intentos,
              e.id AS estudiante_id, e.dni, e.nombre, e.apellido, e.email, e.activo
         FROM epja_password_resets r
         JOIN epja_estudiantes e ON e.id = r.estudiante_id
        WHERE lower(e.email) = lower($1)
          AND e.activo = TRUE
          AND r.usado_en IS NULL
          AND r.expira_en > now()
        ORDER BY r.creado_en DESC
        LIMIT 1`,
      [email]
    );
    const fila = rows[0];
    return fila
      ? {
          id: fila.id,
          codigoHash: fila.codigo_hash,
          intentos: fila.intentos,
          estudiante: {
            id: fila.estudiante_id,
            dni: fila.dni,
            nombre: fila.nombre,
            apellido: fila.apellido,
            email: fila.email || '',
            activo: fila.activo
          }
        }
      : null;
  },

  async registrarIntentoFallido(id, maxIntentos) {
    const { rows } = await getPool().query(
      `UPDATE epja_password_resets
          SET intentos = intentos + 1,
              usado_en = CASE WHEN intentos + 1 >= $2 THEN now() ELSE usado_en END
        WHERE id = $1
        RETURNING intentos`,
      [id, maxIntentos]
    );
    return rows[0]?.intentos || 0;
  },

  async marcarVerificado(id, resetTokenHash, resetExpiraEn) {
    const { rowCount } = await getPool().query(
      `UPDATE epja_password_resets
          SET reset_token_hash = $2,
              reset_expira_en = $3,
              verificado_en = now()
        WHERE id = $1
          AND usado_en IS NULL
          AND expira_en > now()`,
      [id, resetTokenHash, resetExpiraEn]
    );
    return rowCount > 0;
  },

  async consumir(resetTokenHash, passwordHash) {
    const pool = getPool();
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const { rows } = await cliente.query(
        `SELECT r.id, e.id AS estudiante_id
           FROM epja_password_resets r
           JOIN epja_estudiantes e ON e.id = r.estudiante_id
          WHERE r.reset_token_hash = $1
            AND r.usado_en IS NULL
            AND r.reset_expira_en > now()
            AND e.activo = TRUE
          FOR UPDATE OF r, e`,
        [resetTokenHash]
      );
      const reset = rows[0];
      if (!reset) {
        await cliente.query('ROLLBACK');
        return false;
      }

      await cliente.query(
        `UPDATE epja_estudiantes
            SET password_hash = $2,
                actualizado_en = now()
          WHERE id = $1`,
        [reset.estudiante_id, passwordHash]
      );
      await cliente.query(
        `UPDATE epja_password_resets
            SET usado_en = now()
          WHERE id = $1`,
        [reset.id]
      );
      await cliente.query('COMMIT');
      return true;
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;
    } finally {
      cliente.release();
    }
  }
};
