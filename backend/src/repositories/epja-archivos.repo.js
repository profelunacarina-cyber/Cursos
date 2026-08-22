import { getPool } from '../db/pool.js';

function aArchivo(fila) {
  return fila && {
    id: fila.id,
    nombre: fila.nombre,
    tipoMime: fila.tipo_mime,
    contenido: fila.contenido,
    tamanio: fila.tamanio,
    creadoEn: fila.creado_en
  };
}

export const epjaArchivosRepo = {
  async crear(archivo) {
    const { rows } = await getPool().query(
      `INSERT INTO epja_archivos (id, nombre, tipo_mime, contenido, tamanio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, tipo_mime, tamanio, creado_en`,
      [archivo.id, archivo.nombre, archivo.tipoMime, archivo.contenido, archivo.tamanio]
    );
    return aArchivo(rows[0]);
  },

  async obtener(id) {
    const { rows } = await getPool().query(
      `SELECT id, nombre, tipo_mime, contenido, tamanio, creado_en
         FROM epja_archivos
        WHERE id = $1`,
      [id]
    );
    return aArchivo(rows[0]);
  }
};
