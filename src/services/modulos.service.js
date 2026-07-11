// Capa de servicios: reglas de negocio de los módulos de un curso.
import xss from 'xss';
import { modulosRepo } from '../repositories/modulos.repo.js';
import { cursosRepo } from '../repositories/cursos.repo.js';
import { ErrorApp } from '../errores.js';

// El contenido llega como HTML del editor del panel. Se limpia contra una whitelist
// (títulos, párrafos, listas, negrita/itálica y enlaces) para que quede prolijo y, sobre
// todo, para prevenir XSS almacenado: se quitan <script>/<style> y todo lo que no esté acá.
// Usamos `xss` (CommonJS puro) en vez de sanitize-html porque este último arrastra
// htmlparser2 (ESM) y el empaquetador de funciones de Vercel no puede requerir ESM.
const OPCIONES_SANITIZADO = {
  whiteList: {
    h2: [], h3: [], p: [], ul: [], ol: [], li: [],
    strong: [], em: [], b: [], i: [], br: [], blockquote: [],
    a: ['href', 'title']            // xss ya bloquea hrefs peligrosos (javascript:, etc.)
  },
  stripIgnoreTag: true,             // etiquetas fuera de la whitelist: se quitan (se conserva su texto)
  stripIgnoreTagBody: ['script', 'style']  // script/style: se elimina también su contenido
};

function normalizarContenido(html) {
  // Compatibilidad: si viniera el formato viejo (lista de bloques), se ignora y queda vacío.
  if (typeof html !== 'string') return { contenido: '', palabras: 0 };
  const limpio = xss(html, OPCIONES_SANITIZADO).trim().slice(0, 40000);
  const texto = limpio.replace(/<[^>]*>/g, ' ');
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  return { contenido: limpio, palabras };
}

export const modulosService = {
  async listar(cursoId) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    return modulosRepo.listarDeCurso(cursoId);
  },

  async crear(cursoId, datos) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    const curso = await cursosRepo.obtener(cursoId);
    if (!curso) throw new ErrorApp(404, 'No existe el curso');
    const titulo = String(datos.titulo || '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    return modulosRepo.crear({ cursoId, titulo, contenido, palabras });
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const titulo = String(datos.titulo || '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    const modulo = await modulosRepo.actualizar(id, { titulo, contenido, palabras });
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo');
    return modulo;
  },

  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    if (!(await modulosRepo.eliminar(id))) throw new ErrorApp(404, 'No existe el módulo');
  },

  async reordenar(cursoId, ids) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
      throw new ErrorApp(400, 'Se espera una lista de ids numéricos');
    }
    await modulosRepo.reordenar(cursoId, ids);
  }
};
