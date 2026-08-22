import { getPool } from '../db/pool.js';

const mapear = fila => ({ id:fila.id, cursoId:fila.curso_id, tipo:fila.tipo, titulo:fila.titulo, contenidoHtml:fila.contenido_html, configuracion:fila.configuracion, activo:fila.activo, orden:fila.orden });
export const recursosCursoRepo = {
  async listarActivos(cursoId) { const { rows } = await getPool().query('SELECT * FROM recursos_curso WHERE curso_id=$1 AND activo = true ORDER BY orden,id', [cursoId]); return rows.map(mapear); },
  async listarTodos(cursoId) { const { rows } = await getPool().query('SELECT * FROM recursos_curso WHERE curso_id=$1 ORDER BY orden,id', [cursoId]); return rows.map(mapear); },
  async crear(r) { const { rows } = await getPool().query("INSERT INTO recursos_curso (curso_id,tipo,titulo,contenido_html,configuracion,activo,orden) VALUES ($1,$2,$3,$4,$5::jsonb,$6,COALESCE((SELECT MAX(orden)+1 FROM recursos_curso WHERE curso_id=$1),1)) RETURNING *", [r.cursoId,r.tipo,r.titulo,r.contenidoHtml,JSON.stringify(r.configuracion),r.activo]); return mapear(rows[0]); },
  async actualizar(id,r) { const { rows } = await getPool().query('UPDATE recursos_curso SET tipo=$2,titulo=$3,contenido_html=$4,configuracion=$5::jsonb,activo=$6,actualizado_en=now() WHERE id=$1 RETURNING *', [id,r.tipo,r.titulo,r.contenidoHtml,JSON.stringify(r.configuracion),r.activo]); return rows[0] && mapear(rows[0]); },
  async eliminar(id) { return (await getPool().query('DELETE FROM recursos_curso WHERE id=$1',[id])).rowCount > 0; }
};
