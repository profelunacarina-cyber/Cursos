// Capa de servicios: reglas de negocio de los módulos de un curso.
import xss from 'xss';
import { modulosRepo } from '../repositories/modulos.repo.js';
import { cursosRepo } from '../repositories/cursos.repo.js';
import { ErrorApp } from '../errores.js';

/**
 * El contenido llega como HTML del editor del panel. Se limpia contra una whitelist
 * @param {string} html - El contenido HTML a normalizar.
 * @returns {{contenido: string, palabras: number}} El contenido sanitizado y el conteo de palabras.
 */
// (títulos, párrafos, listas, negrita/itálica y enlaces) para que quede prolijo y, sobre
// todo, para prevenir XSS almacenado: se quitan <script>/<style> y todo lo que no esté acá.
// Usamos `xss` (CommonJS puro) en vez de sanitize-html porque este último arrastra
// htmlparser2 (ESM) y el empaquetador de funciones de Vercel no puede requerir ESM.
const OPCIONES_SANITIZADO = {
  whiteList: {
    h2: [], h3: [], h4: [], p: [], ul: [], ol: [], li: [],
    strong: [], em: [], b: [], i: [], u: [], br: [], hr: [], blockquote: [],
    a: ['href', 'title']
  },
  stripIgnoreTag: true,             // etiquetas fuera de la whitelist: se quitan (se conserva su texto)
  stripIgnoreTagBody: ['script', 'style']
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
  /**
   * Lista los módulos de un curso.
   * @param {number} cursoId - El ID del curso.
   * @returns {Promise<Modulo[]>} Una promesa que resuelve a una lista de módulos.
   */
  async listar(cursoId) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    return modulosRepo.listarDeCurso(cursoId);
  },

  /**
   * Crea un nuevo módulo para un curso.
   * @param {number} cursoId - El ID del curso.
   * @param {Partial<Modulo>} datos - Los datos del módulo a crear.
   * @returns {Promise<Modulo>} El módulo creado.
   */ 
  async crear(cursoId, datos) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    const curso = await cursosRepo.obtener(cursoId);
    if (!curso) throw new ErrorApp(404, 'No existe el curso');
    const titulo = String(datos.titulo ?? '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    return modulosRepo.crear({ cursoId, titulo, contenido, palabras });
  },

  /**
   * Actualiza un módulo existente.
   * @param {number} id - El ID del módulo a actualizar.
   * @param {Partial<Modulo>} datos - Los datos para actualizar.
   * @returns {Promise<Modulo>} El módulo actualizado.
   */ 
  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const titulo = String(datos.titulo ?? '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    const modulo = await modulosRepo.actualizar(id, { titulo, contenido, palabras });
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo');
    return modulo;
  },

  /**
   * Elimina un módulo.
   * @param {number} id - El ID del módulo a eliminar.
   * @returns {Promise<void>}
   */
  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    if (!(await modulosRepo.eliminar(id))) throw new ErrorApp(404, 'No existe el módulo');
  },

  /**
   * Reordena los módulos de un curso.
   * @param {number} cursoId - El ID del curso.
   * @param {number[]} ids - Un array con los IDs de los módulos en el nuevo orden.
   * @returns {Promise<void>}
   */ 
  async reordenar(cursoId, ids) {
    if (!Number.isInteger(cursoId)) throw new ErrorApp(400, 'Id de curso inválido');
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
      throw new ErrorApp(400, 'Se espera una lista de ids numéricos');
    }
    await modulosRepo.reordenar(cursoId, ids);
  }
};
