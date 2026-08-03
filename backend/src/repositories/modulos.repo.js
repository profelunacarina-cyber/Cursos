// Patrón Repository: todo el SQL de módulos vive acá.
import { getPool } from '../db/pool.js';

function aModulo(fila) {
  return {
    id: fila.id,
    cursoId: fila.curso_id,
    titulo: fila.titulo,
    contenido: fila.contenido,
    palabras: fila.palabras,
    orden: fila.orden
  };
}

const CAMPOS = 'id, curso_id, titulo, contenido, palabras, orden';

export const modulosRepo = {
  async listarDeCurso(cursoId) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS} FROM modulos WHERE curso_id = $1 ORDER BY orden, id`,
      [cursoId]
    );
    return rows.map(aModulo);
  },

  async obtener(id) {
    const { rows } = await getPool().query(`SELECT ${CAMPOS} FROM modulos WHERE id = $1`, [id]);
    return rows[0] ? aModulo(rows[0]) : null;
  },

  async crear(m) {
    const { rows } = await getPool().query(
      `INSERT INTO modulos (curso_id, titulo, contenido, palabras, orden)
       VALUES ($1, $2, $3::jsonb, $4,
               COALESCE((SELECT MAX(orden) + 1 FROM modulos WHERE curso_id = $1), 1))
       RETURNING ${CAMPOS}`,
      [m.cursoId, m.titulo, JSON.stringify(m.contenido), m.palabras]
    );
    return aModulo(rows[0]);
  },

  async actualizar(id, m) {
    const { rows } = await getPool().query(
      `UPDATE modulos SET titulo = $2, contenido = $3::jsonb, palabras = $4, actualizado_en = now()
        WHERE id = $1
       RETURNING ${CAMPOS}`,
      [id, m.titulo, JSON.stringify(m.contenido), m.palabras]
    );
    return rows[0] ? aModulo(rows[0]) : null;
  },

  async eliminar(id) {
    const { rowCount } = await getPool().query('DELETE FROM modulos WHERE id = $1', [id]);
    return rowCount > 0;
  },

  async reordenar(cursoId, ids) {
    await getPool().query(
      `UPDATE modulos m SET orden = x.pos
         FROM (SELECT * FROM unnest($2::int[]) WITH ORDINALITY AS t(id, pos)) x
        WHERE m.id = x.id AND m.curso_id = $1`,
      [cursoId, ids]
    );
  }
};
