// Patrón Repository: todo el SQL de resultados de evaluaciones vive acá.
import { getPool } from '../db/pool.js';

// Mapper (DTO): fila de la base → objeto de la API.
function aResultado(fila) {
  return {
    id: fila.id,
    curso: fila.curso_slug,
    nombre: fila.nombre,
    apellido: fila.apellido,
    aciertos: fila.aciertos,
    total: fila.total,
    porcentaje: fila.porcentaje,
    aprobado: fila.aprobado,
    modo: fila.modo,
    detalle: fila.detalle,
    fecha: fila.creado_en
  };
}

export const resultadosRepo = {
  async crear(r) {
    const { rows } = await getPool().query(
      `INSERT INTO resultados (curso_slug, nombre, apellido, aciertos, total,
                               porcentaje, aprobado, modo, detalle)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       RETURNING *`,
      [r.curso, r.nombre, r.apellido, r.aciertos, r.total,
       r.porcentaje, r.aprobado, r.modo, JSON.stringify(r.detalle)]
    );
    return aResultado(rows[0]);
  },

  async listar({ curso = '', limite = 200, desplazamiento = 0 }) {
    const params = [];
    let filtro = '';
    if (curso) {
      params.push(curso);
      filtro = `WHERE curso_slug = $${params.length}`;
    }
    params.push(limite, desplazamiento);
    const { rows } = await getPool().query(
      `SELECT * FROM resultados ${filtro}
        ORDER BY creado_en DESC
        LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows.map(aResultado);
  },

  // Totales por curso para el tablero del admin.
  async resumen() {
    const { rows } = await getPool().query(
      `SELECT curso_slug                              AS curso,
              COUNT(*)::int                           AS intentos,
              ROUND(AVG(porcentaje))::int             AS promedio,
              COUNT(*) FILTER (WHERE aprobado)::int   AS aprobados
         FROM resultados
        GROUP BY curso_slug
        ORDER BY curso_slug`
    );
    return rows;
  }
};
