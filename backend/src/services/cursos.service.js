// Capa de servicios: acá viven las reglas de negocio de los cursos.
// Los controladores traducen HTTP, los repositorios traducen SQL; esto es lo del medio.
import { cursosRepo } from '../repositories/cursos.repo.js';
import { ErrorApp } from '../errores.js';

export const SECCIONES = ['ruta', 'transversales', 'matriz', 'proximas'];
export const ESTADOS = ['disponible', 'proximamente', 'preparacion', 'externo'];

// Los cursos del panel son "internos": se arman con módulos y no llevan enlace ni metas
// escritas a mano (se calculan del contenido). enlace/textoEnlace/metas solo se conservan
// para los cursos externos ya existentes (los 4 con página propia + ANMAT), que se siembran
// directo en la base; el panel no los toca. Por eso, si el formulario no manda esos campos,
// se preservan los del curso existente (`previo`) en vez de borrarlos.
function normalizar(datos, previo) {
  const traer = (campo, porDefecto) =>
    datos[campo] !== undefined ? datos[campo] : (previo ? previo[campo] : porDefecto);

  const curso = {
    seccion: datos.seccion,
    etiqueta: String(datos.etiqueta || '').trim(),
    titulo: String(datos.titulo || '').trim(),
    descripcion: String(datos.descripcion || '').trim(),
    estado: datos.estado,
    enlace: String(traer('enlace', '') || '').trim(),
    textoEnlace: String(traer('textoEnlace', '') || '').trim(),
    metas: Array.isArray(traer('metas', []))
      ? traer('metas', []).map(m => String(m).trim()).filter(Boolean).slice(0, 6)
      : [],
    destacado: Boolean(datos.destacado),
    insignia: String(datos.insignia || '').trim().slice(0, 40)
  };

  // Regla de negocio: solo los cursos externos necesitan enlace. Los internos se
  // renderizan desde sus módulos, así que pueden estar "disponibles" sin enlace.
  if (curso.estado === 'externo' && !curso.enlace) {
    throw new ErrorApp(400, 'Un curso externo necesita un enlace');
  }
  if (curso.enlace && !curso.textoEnlace) {
    curso.textoEnlace = curso.estado === 'externo' ? 'Ir al curso ↗' : 'Empezar el curso →';
  }
  return curso;
}

export const cursosService = {
  // Cursos agrupados por sección, listos para pintar la página pública y el admin.
  async listarAgrupados() {
    const cursos = await cursosRepo.listar();
    const grupos = Object.fromEntries(SECCIONES.map(s => [s, []]));
    for (const curso of cursos) (grupos[curso.seccion] ??= []).push(curso);
    return grupos;
  },

  async crear(datos) {
    const curso = await cursosRepo.crear(normalizar(datos));
    if (!curso) throw new ErrorApp(400, 'La sección indicada no existe');
    return curso;
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const previo = await cursosRepo.obtener(id);
    if (!previo) throw new ErrorApp(404, 'No existe un curso con ese id');
    const curso = await cursosRepo.actualizar(id, normalizar(datos, previo));
    return curso;
  },

  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const borrado = await cursosRepo.eliminar(id);
    if (!borrado) throw new ErrorApp(404, 'No existe un curso con ese id');
  },

  async reordenar(ids) {
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(Number.isInteger)) {
      throw new ErrorApp(400, 'Se espera una lista de ids numéricos');
    }
    await cursosRepo.reordenar(ids);
  }
};
