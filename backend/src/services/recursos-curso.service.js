import xss from 'xss';
import { ErrorApp } from '../errores.js';
import { recursosCursoRepo } from '../repositories/recursos-curso.repo.js';

const lista = { h2:[],h3:[],h4:[],p:[],ul:[],ol:[],li:[],strong:[],em:[],b:[],i:[],br:[],hr:[],blockquote:[],a:['href','title'] };
const CAMPOS_PRIVADOS_CONFIG = new Set(['fuenteHtml', 'archivo', 'rutaArchivo', 'htmlFuente', 'sourceHtml', 'legacyHtml']);

function limpiarConfiguracionPrivada(valor) {
  if (Array.isArray(valor)) return valor.map(limpiarConfiguracionPrivada);
  if (!valor || typeof valor !== 'object') return valor;
  return Object.fromEntries(
    Object.entries(valor)
      .filter(([clave]) => !CAMPOS_PRIVADOS_CONFIG.has(clave))
      .map(([clave, item]) => [clave, limpiarConfiguracionPrivada(item)])
  );
}

function normalizarConfiguracion(configuracion, tipo) {
  const base = configuracion && typeof configuracion === 'object'
    ? limpiarConfiguracionPrivada(configuracion)
    : {};
  if (tipo !== 'evaluacion') return base;
  base.preguntas = Array.isArray(base.preguntas) ? base.preguntas.slice(0, 40).map((pregunta, indice) => {
    const opcionesOriginales = Array.isArray(pregunta?.opciones) ? pregunta.opciones : [];
    const opciones = opcionesOriginales.slice(0, 8).map((opcion, i) => ({ texto: String(opcion?.texto || '').trim().slice(0, 500), correcta: Boolean(opcion?.correcta) && i === opcionesOriginales.findIndex(x => x?.correcta) }));
    return { id: String(pregunta?.id || `pregunta-${indice + 1}`).slice(0, 80), enunciado: String(pregunta?.enunciado || '').trim().slice(0, 2000), tipo: pregunta?.tipo === 'verdadero_falso' ? 'verdadero_falso' : 'opcion_multiple', opciones };
  }) : [];
  return base;
}
const normalizar = d => { const tipo=['evaluacion','herramienta'].includes(d.tipo) ? d.tipo : 'herramienta'; return { tipo, titulo:String(d.titulo||'').trim().slice(0,160), contenidoHtml:xss(String(d.contenidoHtml||''),{whiteList:lista,stripIgnoreTag:true,stripIgnoreTagBody:['script','style']}).slice(0,40000), configuracion:normalizarConfiguracion(d.configuracion,tipo), activo:Boolean(d.activo) }; };
function ocultarSolucionario(configuracion) {
  const base = limpiarConfiguracionPrivada(configuracion);
  if (!Array.isArray(base?.preguntas)) return base;
  return {
    ...base,
    preguntas: base.preguntas.map(pregunta => ({
      ...pregunta,
      opciones: Array.isArray(pregunta?.opciones)
        ? pregunta.opciones.map(({ correcta, ...opcion }) => opcion)
        : []
    }))
  };
}

const recursoPublico = recurso => ({
  ...recurso,
  configuracion: recurso.tipo === 'evaluacion'
    ? ocultarSolucionario(recurso.configuracion)
    : limpiarConfiguracionPrivada(recurso.configuracion)
});
export const recursosCursoService = {
  async listarPublicos(cursoId) {
    return (await recursosCursoRepo.listarActivos(cursoId)).map(recursoPublico);
  },
  listarTodos: cursoId => recursosCursoRepo.listarTodos(cursoId),
  async crear(cursoId,d){const r=normalizar(d);if(!r.titulo)throw new ErrorApp(400,'El recurso necesita título');return recursosCursoRepo.crear({...r,cursoId});},
  async actualizar(id,d){const r=normalizar(d);if(!r.titulo)throw new ErrorApp(400,'El recurso necesita título');const x=await recursosCursoRepo.actualizar(id,r);if(!x)throw new ErrorApp(404,'No existe el recurso');return x;},
  async eliminar(id){if(!(await recursosCursoRepo.eliminar(id)))throw new ErrorApp(404,'No existe el recurso');}
};
