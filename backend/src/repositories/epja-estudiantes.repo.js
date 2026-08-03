import { getPool } from '../db/pool.js';

function aEstudiante(fila) {
  return {
    id: fila.id,
    dni: fila.dni,
    nombre: fila.nombre,
    apellido: fila.apellido,
    email: fila.email || '',
    activo: fila.activo,
    materias: Array.isArray(fila.materias)
      ? fila.materias.filter(Boolean)
      : []
  };
}

const CAMPOS = `e.id, e.dni, e.nombre, e.apellido, e.email, e.activo,
                COALESCE(
                  array_agg(m.codigo ORDER BY m.orden) FILTER (WHERE m.codigo IS NOT NULL),
                  '{}'
                ) AS materias`;

export const epjaEstudiantesRepo = {
  async listar({ busqueda = '', activo = null } = {}) {
    const params = [];
    const filtros = [];

    if (busqueda) {
      params.push(`%${busqueda}%`);
      filtros.push(`(e.dni ILIKE $${params.length} OR e.nombre ILIKE $${params.length} OR e.apellido ILIKE $${params.length} OR e.email ILIKE $${params.length})`);
    }
    if (typeof activo === 'boolean') {
      params.push(activo);
      filtros.push(`e.activo = $${params.length}`);
    }

    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM epja_estudiantes e
    LEFT JOIN epja_estudiantes_materias em ON em.estudiante_id = e.id
    LEFT JOIN epja_materias m ON m.id = em.materia_id
        ${where}
        GROUP BY e.id, e.dni, e.nombre, e.apellido, e.email, e.activo
        ORDER BY e.apellido, e.nombre, e.id`,
      params
    );
    return rows.map(aEstudiante);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM epja_estudiantes e
    LEFT JOIN epja_estudiantes_materias em ON em.estudiante_id = e.id
    LEFT JOIN epja_materias m ON m.id = em.materia_id
        WHERE e.id = $1
        GROUP BY e.id, e.dni, e.nombre, e.apellido, e.email, e.activo`,
      [id]
    );
    return rows[0] ? aEstudiante(rows[0]) : null;
  },

  async obtenerPorDni(dni) {
    const { rows } = await getPool().query(
      `SELECT e.id, e.dni, e.nombre, e.apellido, e.email, e.activo, e.password_hash,
              COALESCE(
                array_agg(m.codigo ORDER BY m.orden) FILTER (WHERE m.codigo IS NOT NULL),
                '{}'
              ) AS materias
         FROM epja_estudiantes e
    LEFT JOIN epja_estudiantes_materias em ON em.estudiante_id = e.id
    LEFT JOIN epja_materias m ON m.id = em.materia_id
        WHERE e.dni = $1
        GROUP BY e.id, e.dni, e.nombre, e.apellido, e.email, e.activo, e.password_hash`,
      [dni]
    );
    return rows[0]
      ? {
          ...aEstudiante(rows[0]),
          passwordHash: rows[0].password_hash
        }
      : null;
  },

  async obtenerPorEmail(email) {
    if (!email) return null;
    const { rows } = await getPool().query(
      `SELECT e.id, e.dni, e.nombre, e.apellido, e.email, e.activo, e.password_hash,
              COALESCE(
                array_agg(m.codigo ORDER BY m.orden) FILTER (WHERE m.codigo IS NOT NULL),
                '{}'
              ) AS materias
         FROM epja_estudiantes e
    LEFT JOIN epja_estudiantes_materias em ON em.estudiante_id = e.id
    LEFT JOIN epja_materias m ON m.id = em.materia_id
        WHERE lower(e.email) = lower($1)
        GROUP BY e.id, e.dni, e.nombre, e.apellido, e.email, e.activo, e.password_hash`,
      [email]
    );
    return rows[0]
      ? {
          ...aEstudiante(rows[0]),
          passwordHash: rows[0].password_hash
        }
      : null;
  },

  async crear(estudiante) {
    const { rows } = await getPool().query(
      `INSERT INTO epja_estudiantes (dni, nombre, apellido, email, password_hash, activo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [estudiante.dni, estudiante.nombre, estudiante.apellido, estudiante.email || null, estudiante.passwordHash, estudiante.activo]
    );
    return rows[0] ? this.obtener(rows[0].id) : null;
  },

  async actualizar(id, estudiante) {
    const { rowCount } = await getPool().query(
      `UPDATE epja_estudiantes
          SET dni = $2,
              nombre = $3,
              apellido = $4,
              email = $5,
              activo = $6,
              actualizado_en = now()
        WHERE id = $1`,
      [id, estudiante.dni, estudiante.nombre, estudiante.apellido, estudiante.email || null, estudiante.activo]
    );
    return rowCount ? this.obtener(id) : null;
  },

  async actualizarPassword(id, passwordHash) {
    await getPool().query(
      `UPDATE epja_estudiantes
          SET password_hash = $2,
              actualizado_en = now()
        WHERE id = $1`,
      [id, passwordHash]
    );
  },

  async eliminar(id) {
    const { rowCount } = await getPool().query(
      `DELETE FROM epja_estudiantes WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  },

  async asignarMaterias(estudianteId, materiaIds) {
    const pool = getPool();
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await cliente.query(
        `DELETE FROM epja_estudiantes_materias WHERE estudiante_id = $1`,
        [estudianteId]
      );
      if (materiaIds.length) {
        await cliente.query(
          `INSERT INTO epja_estudiantes_materias (estudiante_id, materia_id)
           SELECT $1, x.materia_id
             FROM unnest($2::int[]) AS x(materia_id)`,
          [estudianteId, materiaIds]
        );
      }
      await cliente.query('COMMIT');
    } catch (e) {
      await cliente.query('ROLLBACK');
      throw e;
    } finally {
      cliente.release();
    }
    return this.obtener(estudianteId);
  }
};
