// Guarda las evaluaciones y herramientas heredadas como recursos editables en la BD.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPool } from '../src/db/pool.js';

const raiz = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const legado = join(raiz, 'legacy', 'cursos-html');

const recursos = [
  ['costos/index.html', 'evaluacion', 'Evaluación de Estructura de costos', 'public/costos/evaluacion.html'],
  ['costos/index.html', 'herramienta', 'Plan personal de precios', 'public/costos/plan-personal.html'],
  ['marketing-mix/index.html', 'evaluacion', 'Evaluación de Marketing mix', 'public/marketing-mix/evaluacion.html'],
  ['finanzas-emprendedores/index.html', 'evaluacion', 'Evaluación de Finanzas', 'public/finanzas-emprendedores/evaluacion.html'],
  ['armando-cv/index.html', 'evaluacion', 'Evaluación de Armando tu CV', 'public/armando-cv/evaluacion.html']
];
const extraer = archivo => readFileSync(join(legado, archivo), 'utf8');

const pool = getPool();
try {
  await pool.query('BEGIN');
  for (let i = 0; i < recursos.length; i++) {
    const [enlace, tipo, titulo, archivo] = recursos[i];
    const { rows } = await pool.query('SELECT id FROM cursos WHERE origen_html=$1 OR enlace=$1', [enlace]);
    if (!rows[0]) throw new Error(`Curso no encontrado: ${enlace}`);
    const fuente = extraer(archivo);
    await pool.query('DELETE FROM recursos_curso WHERE curso_id=$1 AND titulo=$2', [rows[0].id, titulo]);
    await pool.query('INSERT INTO recursos_curso (curso_id,tipo,titulo,contenido_html,configuracion,activo,orden) VALUES ($1,$2,$3,$4,$5::jsonb,false,$6)', [rows[0].id, tipo, titulo, '', JSON.stringify({ formato:'html-heredado', archivo, fuenteHtml:fuente }), i + 1]);
    console.log(`✓ ${titulo}`);
  }
  await pool.query('COMMIT');
} catch (e) { await pool.query('ROLLBACK'); throw e; } finally { await pool.end(); }
