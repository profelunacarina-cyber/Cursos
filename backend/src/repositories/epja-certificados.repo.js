import { getPool } from '../db/pool.js';

const CAMPOS = `c.id, c.codigo, c.emitido_en, c.revocado_en,
  e.id AS estudiante_id, e.nombre AS estudiante_nombre, e.apellido AS estudiante_apellido, e.dni,
  mod.id AS modulo_id, mod.titulo AS modulo_titulo,
  mat.id AS materia_id, mat.codigo AS materia_codigo, mat.campo AS materia_campo, mat.nombre AS materia_nombre`;

function certificado(fila) { return { id:fila.id, codigo:fila.codigo, emitidoEn:fila.emitido_en, revocadoEn:fila.revocado_en, estudiante:{ id:fila.estudiante_id, nombre:fila.estudiante_nombre, apellido:fila.estudiante_apellido, dni:fila.dni }, modulo:{ id:fila.modulo_id, titulo:fila.modulo_titulo }, materia:{ id:fila.materia_id, codigo:fila.materia_codigo, campo:fila.materia_campo, nombre:fila.materia_nombre } }; }

export const epjaCertificadosRepo = {
  async listar(estudianteId = null) {
    const { rows } = await getPool().query(`SELECT ${CAMPOS} FROM epja_certificados c JOIN epja_estudiantes e ON e.id=c.estudiante_id JOIN epja_modulos mod ON mod.id=c.modulo_id JOIN epja_materias mat ON mat.id=mod.materia_id ${estudianteId ? 'WHERE c.estudiante_id=$1' : ''} ORDER BY c.emitido_en DESC`, estudianteId ? [estudianteId] : []);
    return rows.map(certificado);
  },
  async recorrido(estudianteId) {
    const { rows } = await getPool().query(`SELECT mod.id, mod.titulo, mod.resumen, mod.publicado, mat.id AS materia_id, mat.codigo AS materia_codigo, mat.campo AS materia_campo, mat.nombre AS materia_nombre, COALESCE(p.completado,false) AS completado, COALESCE(p.aprobado,false) AS aprobado, c.id AS certificado_id, c.codigo AS certificado_codigo, c.emitido_en, c.revocado_en FROM epja_modulos mod JOIN epja_materias mat ON mat.id=mod.materia_id JOIN epja_estudiantes_materias em ON em.materia_id=mat.id AND em.estudiante_id=$1 LEFT JOIN epja_progreso_modulos p ON p.estudiante_id=$1 AND p.modulo_id=mod.id LEFT JOIN epja_certificados c ON c.estudiante_id=$1 AND c.modulo_id=mod.id ORDER BY mat.orden, mod.orden, mod.id`, [estudianteId]);
    return rows.map(r => ({ id:r.id, titulo:r.titulo, resumen:r.resumen, publicado:r.publicado, materia:{ id:r.materia_id, codigo:r.materia_codigo, campo:r.materia_campo, nombre:r.materia_nombre }, completado:r.completado, aprobado:r.aprobado, certificado:r.certificado_id ? { id:r.certificado_id, codigo:r.certificado_codigo, emitidoEn:r.emitido_en, revocadoEn:r.revocado_en } : null }));
  },
  async aprobarYEmitir(estudianteId, moduloId) {
    const db = getPool(); const client = await db.connect();
    try {
      await client.query('BEGIN');
      const acceso = await client.query(`SELECT 1 FROM epja_modulos mod JOIN epja_estudiantes_materias em ON em.materia_id=mod.materia_id WHERE mod.id=$1 AND em.estudiante_id=$2`, [moduloId, estudianteId]);
      if (!acceso.rows[0]) throw new Error('El estudiante no tiene asignado este módulo');
      await client.query(`INSERT INTO epja_progreso_modulos (estudiante_id, modulo_id, completado, aprobado, aprobado_en) VALUES ($1,$2,true,true,now()) ON CONFLICT (estudiante_id, modulo_id) DO UPDATE SET completado=true, aprobado=true, aprobado_en=now(), ultimo_acceso=now()`, [estudianteId, moduloId]);
      const codigo = `EPJA-${new Date().getFullYear()}-${estudianteId}-${moduloId}`;
      const { rows } = await client.query(`INSERT INTO epja_certificados (codigo, estudiante_id, modulo_id) VALUES ($1,$2,$3) ON CONFLICT (estudiante_id, modulo_id) DO UPDATE SET revocado_en=NULL RETURNING id`, [codigo, estudianteId, moduloId]);
      await client.query('COMMIT'); return rows[0].id;
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  },
  async revocar(id) { const { rowCount } = await getPool().query('UPDATE epja_certificados SET revocado_en=now() WHERE id=$1 AND revocado_en IS NULL', [id]); return rowCount > 0; }
};
