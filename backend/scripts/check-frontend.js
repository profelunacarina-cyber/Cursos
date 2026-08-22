// Validador del frontend estático (lo usa el CI, y se puede correr a mano).
// Uso: node backend/scripts/check-frontend.js [carpeta-del-sitio].
// Por defecto valida el build de Vue en frontend/dist.
// 1) Chequea la sintaxis de cada <script> embebido en las páginas HTML.
// 2) Verifica que cada archivo local referenciado (src/href) exista en el repo.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import vm from 'node:vm';

// Raíz del sitio: lo que se sirve como "/" en el navegador.
const RAIZ = resolve(process.argv[2] || 'frontend/dist');
const IGNORAR = new Set(['node_modules', '.git']);

function listarHtml(dir) {
  let out = [];
  for (const nombre of readdirSync(dir)) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    const st = statSync(ruta);
    if (st.isDirectory()) out = out.concat(listarHtml(ruta));
    else if (nombre.endsWith('.html')) out.push(ruta);
  }
  return out;
}

// ¿La referencia apunta a un archivo local del repo (y no a algo externo, embebido o dinámico)?
function esRefLocal(url) {
  if (!url) return false;
  if (/[${}]/.test(url)) return false;                    // placeholder de template (${...}, {{...}})
  return !/^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(url);
}

const errores = [];

for (const archivo of listarHtml(RAIZ)) {
  const rel = archivo.slice(RAIZ.length + 1);
  const html = readFileSync(archivo, 'utf8');

  // 1) Sintaxis de los <script> embebidos (sin src).
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1] || '', codigo = m[2] || '';
    if (/\bsrc\s*=/.test(attrs)) continue;                // <script src>: no tiene código embebido
    if (/type\s*=\s*["'](?!text\/javascript)/i.test(attrs)) continue; // ej. type="application/json"
    if (!codigo.trim()) continue;
    try { new vm.Script(codigo, { filename: rel }); }
    catch (e) { errores.push(`${rel}: error de sintaxis en <script> → ${e.message}`); }
  }

  // 2) Existencia de archivos locales referenciados por src= y href=.
  for (const m of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    const url = m[1].trim();
    if (!esRefLocal(url)) continue;
    const limpio = url.split(/[?#]/)[0];
    if (!limpio) continue;
    // Raíz-relativa (/x) → contra la raíz del sitio; si no, relativa al archivo.
    const destino = limpio.startsWith('/')
      ? join(RAIZ, limpio.slice(1))
      : resolve(dirname(archivo), limpio);
    if (!existsSync(destino)) errores.push(`${rel}: referencia inexistente → ${url}`);
  }
}

if (errores.length) {
  console.error('✗ Problemas en el frontend:\n' + [...new Set(errores)].map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ Frontend OK (${RAIZ}): sintaxis de scripts y referencias locales verificadas.`);
