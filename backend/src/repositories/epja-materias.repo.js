import { getPool } from '../db/pool.js';

function aMateria(fila) {
  return {
    id: fila.id,
    codigo: fila.codigo,
    campo: fila.campo,
    nombre: fila.nombre,
    descripcion: fila.descripcion,
    color: fila.color,
    orden: fila.orden,
    activa: fila.activa,
    totalModulos: fila.total_modulos == null ? undefined : Number(fila.total_modulos),
    modulosCompletados: fila.modulos_completados == null ? undefined : Number(fila.modulos_completados)
  };
}

const CAMPOS = 'id, codigo, campo, nombre, descripcion, color, orden, activa';

export const epjaMateriasRepo = {
  async listar({ soloActivas = false } = {}) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM epja_materias
        ${soloActivas ? 'WHERE activa = true' : ''}
        ORDER BY orden, id`
    );
    return rows.map(aMateria);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS} FROM epja_materias WHERE id = $1`,
      [id]
    );
    return rows[0] ? aMateria(rows[0]) : null;
  },

  async obtenerPorCodigo(codigo) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS} FROM epja_materias WHERE lower(codigo) = lower($1)`,
      [codigo]
    );
    return rows[0] ? aMateria(rows[0]) : null;
  },

  async crear(materia) {
    const { rows } = await getPool().query(
      `INSERT INTO epja_materias (codigo, campo, nombre, descripcion, color, orden, activa)
       VALUES ($1, $2, $3, $4, $5,
               COALESCE($6, (SELECT COALESCE(MAX(orden), 0) + 1 FROM epja_materias)),
               $7)
       RETURNING ${CAMPOS}`,
      [materia.codigo, materia.campo, materia.nombre, materia.descripcion, materia.color, materia.orden, materia.activa]
    );
    return rows[0] ? aMateria(rows[0]) : null;
  },

  async listarDeEstudiante(estudianteId) {
    const { rows } = await getPool().query(
      `SELECT m.id, m.codigo, m.campo, m.nombre, m.descripcion, m.color, m.orden, m.activa,
              COUNT(mod.id)::int                                            AS total_modulos,
              COUNT(pm.modulo_id) FILTER (WHERE pm.completado = true)::int  AS modulos_completados
         FROM epja_materias m
         JOIN epja_estudiantes_materias em
           ON em.materia_id = m.id
          AND em.estudiante_id = $1
    LEFT JOIN epja_modulos mod
           ON mod.materia_id = m.id
          AND mod.publicado = true
    LEFT JOIN epja_progreso_modulos pm
           ON pm.modulo_id = mod.id
          AND pm.estudiante_id = $1
        WHERE m.activa = true
        GROUP BY m.id, m.codigo, m.campo, m.nombre, m.descripcion, m.color, m.orden, m.activa
        ORDER BY m.orden, m.id`,
      [estudianteId]
    );
    return rows.map(aMateria);
  },

  async estaAsignada(estudianteId, materiaId) {
    const { rows } = await getPool().query(
      `SELECT 1
         FROM epja_estudiantes_materias
        WHERE estudiante_id = $1
          AND materia_id = $2`,
      [estudianteId, materiaId]
    );
    return Boolean(rows[0]);
  },

  async actualizar(id, materia) {
    const { rows } = await getPool().query(
      `UPDATE epja_materias
          SET nombre = $2,
              campo = $3,
              descripcion = $4,
              color = $5,
              orden = $6,
              activa = $7,
              actualizado_en = now()
        WHERE id = $1
    RETURNING ${CAMPOS}`,
      [id, materia.nombre, materia.campo, materia.descripcion, materia.color, materia.orden, materia.activa]
    );
    return rows[0] ? aMateria(rows[0]) : null;
  }
};
