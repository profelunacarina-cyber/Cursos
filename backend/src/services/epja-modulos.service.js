import xss from 'xss';
import { ErrorApp } from '../errores.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';
import { epjaModulosRepo } from '../repositories/epja-modulos.repo.js';

const OPCIONES_SANITIZADO = {
  whiteList: {
    h2: [], h3: [], h4: [], p: [], ul: [], ol: [], li: [],
    strong: [], em: [], b: [], i: [], u: [], br: [], hr: [], blockquote: [],
    a: ['href', 'title']
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style']
};

function normalizarContenido(html) {
  if (typeof html !== 'string') return { contenido: '', palabras: 0 };
  const limpio = xss(html, OPCIONES_SANITIZADO).trim().slice(0, 40000);
  const texto = limpio.replace(/<[^>]*>/g, ' ');
  const palabras = texto.split(/\s+/).filter(Boolean).length;
  return { contenido: limpio, palabras };
}

export const epjaModulosService = {
  async listarDeMateria(materiaId) {
    if (!Number.isInteger(materiaId)) throw new ErrorApp(400, 'Id de materia inválido');
    const materia = await epjaMateriasRepo.obtener(materiaId);
    if (!materia) throw new ErrorApp(404, 'No existe la materia');
    return epjaModulosRepo.listarDeMateria(materiaId);
  },

  async crear(materiaId, datos) {
    if (!Number.isInteger(materiaId)) throw new ErrorApp(400, 'Id de materia inválido');
    const materia = await epjaMateriasRepo.obtener(materiaId);
    if (!materia) throw new ErrorApp(404, 'No existe la materia');

    const titulo = String(datos.titulo || '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const resumen = String(datos.resumen || '').trim().slice(0, 240);
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    return epjaModulosRepo.crear({
      materiaId,
      titulo,
      resumen,
      contenido,
      palabras,
      publicado: typeof datos.publicado === 'boolean' ? datos.publicado : true
    });
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id de módulo inválido');
    const previo = await epjaModulosRepo.obtener(id);
    if (!previo) throw new ErrorApp(404, 'No existe el módulo');

    const titulo = String(datos.titulo || '').trim().slice(0, 160);
    if (!titulo) throw new ErrorApp(400, 'El módulo necesita un título');
    const resumen = String(datos.resumen || '').trim().slice(0, 240);
    const { contenido, palabras } = normalizarContenido(datos.contenido);
    return epjaModulosRepo.actualizar(id, {
      titulo,
      resumen,
      contenido,
      palabras,
      publicado: typeof datos.publicado === 'boolean' ? datos.publicado : previo.publicado
    });
  },

  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id de módulo inválido');
    if (!(await epjaModulosRepo.eliminar(id))) throw new ErrorApp(404, 'No existe el módulo');
  },

  async reordenar(materiaId, ids) {
    if (!Number.isInteger(materiaId)) throw new ErrorApp(400, 'Id de materia inválido');
    if (!Array.isArray(ids) || !ids.every(Number.isInteger)) {
      throw new ErrorApp(400, 'Se espera una lista de ids numéricos');
    }
    await epjaModulosRepo.reordenar(materiaId, ids);
  }
};
