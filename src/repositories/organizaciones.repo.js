// Patrón Repository: todo el SQL de organizaciones vive acá.
import { getPool } from '../db/pool.js';

// Mapper (DTO): fila de la base → objeto de la API (camelCase, tal como lo espera el mapa).
function aOrg(fila) {
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo: fila.tipo,
    zona: fila.zona,
    localidad: fila.localidad,
    descripcion: fila.descripcion,
    tags: fila.tags,
    lat: fila.lat,
    lng: fila.lng,
    contacto: fila.contacto,
    aprobado: fila.aprobado,
    destacado: fila.destacado,
    orden: fila.orden
  };
}

const CAMPOS = `id, nombre, tipo, zona, localidad, descripcion, tags,
                lat, lng, contacto, aprobado, destacado, orden`;

export const organizacionesRepo = {
  // soloAprobadas = true para el sitio público (mapa y vitrina).
  async listar({ soloAprobadas = false } = {}) {
    const filtro = soloAprobadas ? 'WHERE aprobado = true' : '';
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS} FROM organizaciones ${filtro} ORDER BY orden, id`
    );
    return rows.map(aOrg);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT ${CAMPOS} FROM organizaciones WHERE id = $1`, [id]
    );
    return rows[0] ? aOrg(rows[0]) : null;
  },

  async crear(o) {
    const { rows } = await getPool().query(
      `INSERT INTO organizaciones (nombre, tipo, zona, localidad, descripcion, tags,
                                   lat, lng, contacto, aprobado, destacado, orden)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11,
               COALESCE((SELECT MAX(orden) + 1 FROM organizaciones), 1))
       RETURNING ${CAMPOS}`,
      [o.nombre, o.tipo, o.zona, o.localidad, o.descripcion, JSON.stringify(o.tags),
       o.lat, o.lng, o.contacto, o.aprobado, o.destacado]
    );
    return aOrg(rows[0]);
  },

  async actualizar(id, o) {
    const { rows } = await getPool().query(
      `UPDATE organizaciones SET
          nombre = $2, tipo = $3, zona = $4, localidad = $5, descripcion = $6,
          tags = $7::jsonb, lat = $8, lng = $9, contacto = $10,
          aprobado = $11, destacado = $12, actualizado_en = now()
        WHERE id = $1
       RETURNING ${CAMPOS}`,
      [id, o.nombre, o.tipo, o.zona, o.localidad, o.descripcion, JSON.stringify(o.tags),
       o.lat, o.lng, o.contacto, o.aprobado, o.destacado]
    );
    return rows[0] ? aOrg(rows[0]) : null;
  },

  async eliminar(id) {
    const { rowCount } = await getPool().query('DELETE FROM organizaciones WHERE id = $1', [id]);
    return rowCount > 0;
  }
};
