// Migra el contenido editorial de los cursos HTML al modelo cursos → módulos.
// Uso seguro: npm run cursos:migrar -- --replace
// Sin --replace se detiene si el curso ya tiene módulos, para no pisar ediciones de Carina.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import xss from 'xss';
import { getPool } from '../src/db/pool.js';

const raiz = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const publicLegado = join(raiz, 'legacy', 'cursos-html', 'public');
const reemplazar = process.argv.includes('--replace');

const cursos = [
  { enlace: 'costos/index.html', archivos: [
    ['Costos y gastos', 'costos/costos-gastos.html'], ['Costos fijos y variables', 'costos/fijos-variables.html'],
    ['Margen de contribución', 'costos/margen-contribucion.html'], ['Punto de equilibrio', 'costos/punto-equilibrio.html'],
    ['Estrategias de precio', 'costos/estrategias.html'], ['Monotributo', 'costos/monotributo.html'], ['Caso integrador', 'costos/caso-integrador.html']
  ] },
  { enlace: 'marketing-mix/index.html', archivos: Array.from({ length: 6 }, (_, i) => [`Módulo ${String(i + 1).padStart(2, '0')}`, `marketing-mix/modulo-${String(i + 1).padStart(2, '0')}.html`]) },
  { enlace: 'finanzas-emprendedores/index.html', archivos: Array.from({ length: 6 }, (_, i) => [`Módulo ${String(i + 1).padStart(2, '0')}`, `finanzas-emprendedores/modulo-${String(i + 1).padStart(2, '0')}.html`]) },
  { enlace: 'armando-cv/index.html', archivos: Array.from({ length: 7 }, (_, i) => [`Módulo ${String(i + 1).padStart(2, '0')}`, `armando-cv/modulo-${String(i + 1).padStart(2, '0')}.html`]) },
  { enlace: 'tercer-sector/matriz-semilla/modulo-01.html', archivos: [['La economía que existe', 'tercer-sector/matriz-semilla/modulo-01.html']] }
];

const permitidas = { h2: [], h3: [], h4: [], p: [], ul: [], ol: [], li: [], strong: [], em: [], b: [], i: [], br: [], hr: [], blockquote: [], a: ['href', 'title'] };

function extraerContenido(ruta) {
  const html = readFileSync(join(publicLegado, ruta), 'utf8');
  const cuerpo = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i) || [, html])[1]
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(header|footer|nav|form|button|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, '');
  return xss(cuerpo, { whiteList: permitidas, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] }).trim().slice(0, 40000);
}

function palabras(html) { return html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length; }

async function main() {
  const pool = getPool();
  try {
    await pool.query('BEGIN');
    for (const curso of cursos) {
      const { rows } = await pool.query('SELECT id, titulo FROM cursos WHERE enlace = $1', [curso.enlace]);
      if (!rows[0]) throw new Error(`No existe el curso semilla para ${curso.enlace}`);
      const cursoDb = rows[0];
      const existente = await pool.query('SELECT COUNT(*)::int AS n FROM modulos WHERE curso_id = $1', [cursoDb.id]);
      if (existente.rows[0].n && !reemplazar) throw new Error(`${cursoDb.titulo} ya tiene módulos. Reejecutá con --replace si querés sustituirlos.`);
      if (reemplazar) await pool.query('DELETE FROM modulos WHERE curso_id = $1', [cursoDb.id]);
      for (let i = 0; i < curso.archivos.length; i++) {
        const [titulo, ruta] = curso.archivos[i];
        const contenido = extraerContenido(ruta);
        await pool.query('INSERT INTO modulos (curso_id, titulo, contenido, palabras, orden) VALUES ($1, $2, $3::jsonb, $4, $5)', [cursoDb.id, titulo, JSON.stringify(contenido), palabras(contenido), i + 1]);
      }
      await pool.query("UPDATE cursos SET origen_html = enlace, enlace = '', texto_enlace = 'Abrir curso →', actualizado_en = now() WHERE id = $1", [cursoDb.id]);
      console.log(`✓ ${cursoDb.titulo}: ${curso.archivos.length} módulos migrados`);
    }
    await pool.query('COMMIT');
  } catch (error) { await pool.query('ROLLBACK'); throw error; } finally { await pool.end(); }
}

main().catch(error => { console.error('Migración cancelada:', error.message); process.exit(1); });
