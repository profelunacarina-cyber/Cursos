// Capa de servicios: reglas de negocio de los resultados de evaluaciones.
import { resultadosRepo } from '../repositories/resultados.repo.js';
import { ErrorApp } from '../errores.js';
import config from '../config/index.js';

function textoLimpio(valor, max) {
  return String(valor || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

export const resultadosService = {
  // Regla central: el porcentaje y la aprobación se calculan en el servidor.
  // Al navegador no se le cree — manda los datos crudos y acá se decide.
  async registrar(datos) {
    const nombre = textoLimpio(datos.nombre, 60);
    const apellido = textoLimpio(datos.apellido, 60);
    if (nombre.length < 2 || apellido.length < 2) {
      throw new ErrorApp(400, 'Nombre y apellido son obligatorios');
    }

    const aciertos = Number(datos.aciertos);
    const total = Number(datos.total);
    if (!Number.isInteger(aciertos) || !Number.isInteger(total) ||
        total < 1 || total > 100 || aciertos < 0 || aciertos > total) {
      throw new ErrorApp(400, 'Puntaje inválido');
    }

    // El slug del curso se guarda y luego se muestra en el panel: lo acotamos a
    // minúsculas, números y guiones para que no pueda llevar HTML ni comillas.
    const curso = textoLimpio(datos.curso, 60).toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!curso) throw new ErrorApp(400, 'Curso inválido');

    const porcentaje = Math.round((aciertos / total) * 100);
    return resultadosRepo.crear({
      curso,
      nombre,
      apellido,
      aciertos,
      total,
      porcentaje,
      aprobado: porcentaje >= config.notaAprobacion,
      modo: textoLimpio(datos.modo, 20),
      detalle: Array.isArray(datos.detalle) ? datos.detalle.slice(0, 100).map(Boolean) : []
    });
  },

  async listar(filtros) {
    return resultadosRepo.listar(filtros);
  },

  async resumen() {
    return resultadosRepo.resumen();
  }
};
