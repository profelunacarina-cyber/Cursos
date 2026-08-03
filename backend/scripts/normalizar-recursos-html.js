// Convierte recursos heredados (HTML completo guardado en configuracion.fuenteHtml)
// en contenido editable y sanitizado para el panel Vue.
import xss from 'xss';
import { getPool } from '../src/db/pool.js';

const permitidas = {
  h2: [], h3: [], h4: [], p: [], ul: [], ol: [], li: [], strong: [], em: [],
  b: [], i: [], u: [], br: [], hr: [], blockquote: [], a: ['href', 'title']
};

function extraerContenido(fuente) {
  const cuerpo = String(fuente || '')
    .match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] || String(fuente || '');
  const sinInterfaz = cuerpo
    .replace(/<(script|style|header|footer|nav|form|button|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(main|article|section|div)[^>]*>/gi, '');
  return xss(sinInterfaz, { whiteList: permitidas, stripIgnoreTag: true, stripIgnoreTagBody: ['script', 'style'] })
    .trim()
    .slice(0, 40000);
}

const pool = getPool();
try {
  await pool.query('BEGIN');
  const { rows } = await pool.query("SELECT id, titulo, configuracion FROM recursos_curso WHERE contenido_html = ''");
  for (const recurso of rows) {
    const contenido = extraerContenido(recurso.configuracion?.fuenteHtml);
    if (!contenido) continue;
    await pool.query('UPDATE recursos_curso SET contenido_html = $2, actualizado_en = now() WHERE id = $1', [recurso.id, contenido]);
    console.log(`✓ ${recurso.titulo}`);
  }
  await pool.query('COMMIT');
} catch (error) {
  await pool.query('ROLLBACK');
  throw error;
} finally {
  await pool.end();
}
