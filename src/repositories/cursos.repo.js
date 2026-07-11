// Patrón Repository: todo el SQL de cursos vive acá.
// Los servicios piden datos en términos del dominio y no saben qué base hay detrás:
// si mañana se migra de PostgreSQL a otra cosa, solo se reescribe este archivo.
import { getPool } from '../db/pool.js';

// Mapper (DTO): traduce la fila de la base (snake_case) al objeto que expone la API.
// Un curso es "interno" (creado y renderizado desde el panel) cuando no tiene enlace externo.
// Para esos, las metas (N módulos · ~X min) se calculan; no se escriben a mano.
function aCurso(fila) {
  const interno = !fila.enlace;
  let metas = fila.metas;
  // Si el curso tiene módulos, sus metas se calculan solas (N módulos · ~min).
  // Si no tiene (curso externo, o placeholder "próximamente"), se conservan las guardadas.
  if (interno && fila.n_modulos > 0) {
    const minutos = Math.max(1, Math.ceil((fila.palabras || 0) / 200));
    metas = [
      fila.n_modulos + (fila.n_modulos === 1 ? ' módulo' : ' módulos'),
      '~' + minutos + ' min'
    ];
  }
  return {
    id: fila.id,
    seccion: fila.seccion,
    etiqueta: fila.etiqueta,
    titulo: fila.titulo,
    descripcion: fila.descripcion,
    estado: fila.estado,
    enlace: fila.enlace,
    textoEnlace: fila.texto_enlace,
    metas: metas,
    destacado: fila.destacado,
    insignia: fila.insignia,
    orden: fila.orden,
    interno: interno,
    nModulos: fila.n_modulos || 0
  };
}

// n_modulos y palabras salen de la tabla modulos para calcular las metas de los cursos internos.
const CAMPOS = `c.id, s.clave AS seccion, c.etiqueta, c.titulo, c.descripcion,
                c.estado, c.enlace, c.texto_enlace, c.metas, c.destacado, c.insignia, c.orden,
                (SELECT COUNT(*) FROM modulos m WHERE m.curso_id = c.id)::int AS n_modulos,
                (SELECT COALESCE(SUM(palabras),0) FROM modulos m WHERE m.curso_id = c.id)::int AS palabras`;

export const cursosRepo = {
  async listar() {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM cursos c
         JOIN secciones s ON s.id = c.seccion_id
        ORDER BY s.orden, c.orden, c.id`
    );
    return rows.map(aCurso);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS}
         FROM cursos c
         JOIN secciones s ON s.id = c.seccion_id
        WHERE c.id = $1`,
      [id]
    );
    return rows[0] ? aCurso(rows[0]) : null;
  },

  async crear(c) {
    const { rows } = await getPool().query(
      `INSERT INTO cursos (seccion_id, etiqueta, titulo, descripcion, estado,
                           enlace, texto_enlace, metas, destacado, insignia, orden)
       SELECT s.id, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10,
              COALESCE((SELECT MAX(orden) + 1 FROM cursos WHERE seccion_id = s.id), 1)
         FROM secciones s
        WHERE s.clave = $1
       RETURNING id`,
      [c.seccion, c.etiqueta, c.titulo, c.descripcion, c.estado,
       c.enlace, c.textoEnlace, JSON.stringify(c.metas), c.destacado, c.insignia]
    );
    return rows[0] ? this.obtener(rows[0].id) : null;
  },

  async actualizar(id, c) {
    const { rowCount } = await getPool().query(
      `UPDATE cursos SET
          seccion_id     = (SELECT id FROM secciones WHERE clave = $2),
          etiqueta       = $3,
          titulo         = $4,
          descripcion    = $5,
          estado         = $6,
          enlace         = $7,
          texto_enlace   = $8,
          metas          = $9::jsonb,
          destacado      = $10,
          insignia       = $11,
          actualizado_en = now()
        WHERE id = $1`,
      [id, c.seccion, c.etiqueta, c.titulo, c.descripcion, c.estado,
       c.enlace, c.textoEnlace, JSON.stringify(c.metas), c.destacado, c.insignia]
    );
    return rowCount ? this.obtener(id) : null;
  },

  async eliminar(id) {
    const { rowCount } = await getPool().query('DELETE FROM cursos WHERE id = $1', [id]);
    return rowCount > 0;
  },

  // Recibe los ids en el orden deseado y los renumera 1..n.
  async reordenar(ids) {
    await getPool().query(
      `UPDATE cursos c
          SET orden = x.pos
         FROM (SELECT * FROM unnest($1::int[]) WITH ORDINALITY AS t(id, pos)) x
        WHERE c.id = x.id`,
      [ids]
    );
  }
};
