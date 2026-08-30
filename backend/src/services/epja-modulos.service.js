import xss from 'xss';
import { ErrorApp } from '../errores.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';
import { epjaModulosRepo } from '../repositories/epja-modulos.repo.js';

const OPCIONES_SANITIZADO = {
  whiteList: {
    h2: [], h3: [], h4: [], p: [], ul: [], ol: [], li: [],
    strong: [], em: [], b: [], i: [], u: [], small: [], br: [], hr: [], blockquote: [],
    figure: ['class', 'data-url', 'data-name', 'data-type', 'data-size', 'data-src', 'data-media-align', 'data-media-layout'],
    span: ['class', 'style'],
    a: ['href', 'title', 'class'],
    iframe: ['class', 'src', 'frameborder', 'allowfullscreen', 'title']
  },
  onTagAttr(tag, nombre, valor) {
    if (tag === 'iframe' && nombre === 'src' && !/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]+(?:\?[^"'<>]*)?$/.test(valor)) {
      return '';
    }
    if (tag === 'figure' && nombre === 'class' && !/^ql-(?:attachment|youtube)$/.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-url' && !/^\/api\/epja\/archivos\/[0-9a-f-]{36}$/i.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-src' && !/^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[a-zA-Z0-9_-]+(?:\?[^"'<>]*)?$/.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-type' && !/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-size' && !/^\d{1,8}$/.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-media-align' && !/^(?:left|center|right)$/.test(valor)) return '';
    if (tag === 'figure' && nombre === 'data-media-layout' && !/^(?:compact|medium|wide)$/.test(valor)) return '';
    if (tag === 'a' && nombre === 'class' && valor !== 'attachment-card') return '';
    if (tag === 'span' && nombre === 'class' && !/^(?:attachment-(?:visual|info|action)|media-select-handle)$/.test(valor)) return '';
    return undefined;
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

function texto(valor, maximo) {
  return String(valor || '').replace(/\s+/g, ' ').trim().slice(0, maximo);
}

function normalizarAutoevaluacion(valor) {
  const fuente = valor && typeof valor === 'object' ? valor : {};
  const activa = Boolean(fuente.activa);
  const preguntas = Array.isArray(fuente.preguntas)
    ? fuente.preguntas.slice(0, 15).map((pregunta, indice) => {
        const opcionesFuente = Array.isArray(pregunta?.opciones) ? pregunta.opciones.slice(0, 8) : [];
        const primeraCorrecta = opcionesFuente.findIndex(opcion => Boolean(opcion?.correcta));
        return {
          id: texto(pregunta?.id, 80) || `pregunta-${indice + 1}`,
          enunciado: texto(pregunta?.enunciado, 2000),
          tipo: pregunta?.tipo === 'verdadero_falso' ? 'verdadero_falso' : 'opcion_multiple',
          opciones: opcionesFuente.map((opcion, opcionIndice) => ({
            texto: texto(opcion?.texto, 500),
            correcta: opcionIndice === primeraCorrecta
          }))
        };
      })
    : [];

  if (activa) {
    if (preguntas.length !== 15) {
      throw new ErrorApp(400, 'La autoevaluación activa debe tener exactamente 15 preguntas');
    }
    if (new Set(preguntas.map(pregunta => pregunta.id)).size !== preguntas.length) {
      throw new ErrorApp(400, 'Cada pregunta necesita un identificador diferente');
    }
    preguntas.forEach((pregunta, indice) => {
      if (!pregunta.enunciado) throw new ErrorApp(400, `Falta el enunciado de la pregunta ${indice + 1}`);
      if (pregunta.opciones.length < 2) throw new ErrorApp(400, `La pregunta ${indice + 1} necesita al menos 2 opciones`);
      if (pregunta.opciones.some(opcion => !opcion.texto)) throw new ErrorApp(400, `Hay una opción vacía en la pregunta ${indice + 1}`);
      if (pregunta.opciones.filter(opcion => opcion.correcta).length !== 1) {
        throw new ErrorApp(400, `Marcá una respuesta correcta en la pregunta ${indice + 1}`);
      }
    });
  }

  return { activa, notaAprobacion: 60, preguntas };
}

function modoCertificado(valor) {
  return valor === 'automatico' ? 'automatico' : 'manual';
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
    const autoevaluacion = normalizarAutoevaluacion(datos.autoevaluacion);
    return epjaModulosRepo.crear({
      materiaId,
      titulo,
      resumen,
      contenido,
      palabras,
      publicado: typeof datos.publicado === 'boolean' ? datos.publicado : true,
      autoevaluacion,
      certificadoModo: modoCertificado(datos.certificadoModo)
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
    const autoevaluacion = normalizarAutoevaluacion(datos.autoevaluacion ?? previo.autoevaluacion);
    return epjaModulosRepo.actualizar(id, {
      titulo,
      resumen,
      contenido,
      palabras,
      publicado: typeof datos.publicado === 'boolean' ? datos.publicado : previo.publicado,
      autoevaluacion,
      certificadoModo: modoCertificado(datos.certificadoModo ?? previo.certificadoModo)
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
