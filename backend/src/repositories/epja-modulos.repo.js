import { getPool } from '../db/pool.js';

function aModulo(fila) {
  return {
    id: fila.id,
    materiaId: fila.materia_id,
    materiaCodigo: fila.materia_codigo,
    materiaNombre: fila.materia_nombre,
    titulo: fila.titulo,
    resumen: fila.resumen,
    contenido: fila.contenido,
    palabras: fila.palabras,
    orden: fila.orden,
    publicado: fila.publicado,
    completado: fila.completado == null ? undefined : fila.completado
  };
}

const CAMPOS = `mod.id, mod.materia_id, mat.codigo AS materia_codigo, mat.nombre AS materia_nombre,
                mod.titulo, mod.resumen, mod.contenido, mod.palabras, mod.orden, mod.publicado`;

export const epjaModulosRepo = {
  async listarDeMateria(materiaId, { soloPublicados = false, estudianteId = null } = {}) {
    const params = [materiaId];
    const joinProgreso = estudianteId
      ? `LEFT JOIN epja_progreso_modulos pm
           ON pm.modulo_id = mod.id
          AND pm.estudiante_id = $2`
      : '';
    if (estudianteId) params.push(estudianteId);
    const filtroPublicados = soloPublicados ? 'AND mod.publicado = true' : '';

    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}${estudianteId ? ', COALESCE(pm.completado, false) AS completado' : ''}
         FROM epja_modulos mod
         JOIN epja_materias mat ON mat.id = mod.materia_id
         ${joinProgreso}
        WHERE mod.materia_id = $1
          ${filtroPublicados}
        ORDER BY mod.orden, mod.id`,
      params
    );
    return rows.map(aModulo);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM epja_modulos mod
         JOIN epja_materias mat ON mat.id = mod.materia_id
        WHERE mod.id = $1`,
      [id]
    );
    return rows[0] ? aModulo(rows[0]) : null;
  },

  async obtenerParaEstudiante(id, estudianteId) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}, COALESCE(pm.completado, false) AS completado
         FROM epja_modulos mod
         JOIN epja_materias mat ON mat.id = mod.materia_id
         JOIN epja_estudiantes_materias em
           ON em.materia_id = mod.materia_id
          AND em.estudiante_id = $2
    LEFT JOIN epja_progreso_modulos pm
           ON pm.modulo_id = mod.id
          AND pm.estudiante_id = $2
        WHERE mod.id = $1
          AND mod.publicado = true`,
      [id, estudianteId]
    );
    return rows[0] ? aModulo(rows[0]) : null;
  },

  async crear(modulo) {
    const { rows } = await getPool().query(
      `INSERT INTO epja_modulos (materia_id, titulo, resumen, contenido, palabras, orden, publicado)
       VALUES ($1, $2, $3, $4::jsonb, $5,
               COALESCE((SELECT MAX(orden) + 1 FROM epja_modulos WHERE materia_id = $1), 1),
               $6)
       RETURNING id`,
      [modulo.materiaId, modulo.titulo, modulo.resumen, JSON.stringify(modulo.contenido), modulo.palabras, modulo.publicado]
    );
    return rows[0] ? this.obtener(rows[0].id) : null;
  },

  async actualizar(id, modulo) {
    const { rowCount } = await getPool().query(
      `UPDATE epja_modulos
          SET titulo = $2,
              resumen = $3,
              contenido = $4::jsonb,
              palabras = $5,
              publicado = $6,
              actualizado_en = now()
        WHERE id = $1`,
      [id, modulo.titulo, modulo.resumen, JSON.stringify(modulo.contenido), modulo.palabras, modulo.publicado]
    );
    return rowCount ? this.obtener(id) : null;
  },

  async eliminar(id) {
    const { rowCount } = await getPool().query(
      `DELETE FROM epja_modulos WHERE id = $1`,
      [id]
    );
    return rowCount > 0;
  },

  async reordenar(materiaId, ids) {
    await getPool().query(
      `UPDATE epja_modulos mod
          SET orden = x.pos
         FROM (SELECT * FROM unnest($2::int[]) WITH ORDINALITY AS t(id, pos)) x
        WHERE mod.id = x.id
          AND mod.materia_id = $1`,
      [materiaId, ids]
    );
  }
};
