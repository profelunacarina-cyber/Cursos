import { ErrorApp } from '../errores.js';
import { epjaModulosRepo } from '../repositories/epja-modulos.repo.js';
import { epjaAutoevaluacionesRepo } from '../repositories/epja-autoevaluaciones.repo.js';

function entero(valor, nombre) {
  const numero = Number(valor);
  if (!Number.isInteger(numero)) throw new ErrorApp(400, `${nombre} inválido`);
  return numero;
}

export const epjaAutoevaluacionesService = {
  async responder(estudianteId, moduloId, datos) {
    const estudiante = entero(estudianteId, 'Estudiante');
    const idModulo = entero(moduloId, 'Módulo');
    const modulo = await epjaModulosRepo.obtenerParaEstudiante(idModulo, estudiante);
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo o no tenés acceso');

    const evaluacion = modulo.autoevaluacion;
    if (!evaluacion?.activa || !Array.isArray(evaluacion.preguntas) || evaluacion.preguntas.length !== 15) {
      throw new ErrorApp(409, 'Este módulo no tiene una autoevaluación disponible');
    }

    const respuestas = Array.isArray(datos?.respuestas) ? datos.respuestas : [];
    if (respuestas.length !== evaluacion.preguntas.length) {
      throw new ErrorApp(400, 'Respondé las 15 preguntas antes de entregar');
    }
    const porPregunta = new Map();
    respuestas.forEach(respuesta => {
      const preguntaId = String(respuesta?.preguntaId || '').slice(0, 80);
      const opcion = Number(respuesta?.opcion);
      if (!preguntaId || !Number.isInteger(opcion) || porPregunta.has(preguntaId)) {
        throw new ErrorApp(400, 'Las respuestas enviadas no son válidas');
      }
      porPregunta.set(preguntaId, opcion);
    });

    const detalle = evaluacion.preguntas.map(pregunta => {
      if (!porPregunta.has(pregunta.id)) throw new ErrorApp(400, 'Respondé las 15 preguntas antes de entregar');
      const opcion = porPregunta.get(pregunta.id);
      if (opcion < 0 || opcion >= pregunta.opciones.length) throw new ErrorApp(400, 'Una de las opciones elegidas no es válida');
      return { preguntaId: pregunta.id, opcion, correcta: Boolean(pregunta.opciones[opcion]?.correcta) };
    });
    const aciertos = detalle.filter(item => item.correcta).length;
    const total = evaluacion.preguntas.length;
    const porcentaje = Math.round((aciertos / total) * 100);
    const aprobado = porcentaje >= 60;
    const guardado = await epjaAutoevaluacionesRepo.registrarIntento({
      estudianteId: estudiante,
      moduloId: idModulo,
      aciertos,
      total,
      porcentaje,
      aprobado,
      respuestas: detalle,
      certificadoAutomatico: modulo.certificadoModo === 'automatico'
    });

    return {
      intentoId: guardado.id,
      creadoEn: guardado.creadoEn,
      aciertos,
      total,
      porcentaje,
      aprobado,
      certificado: guardado.certificado,
      mensaje: aprobado
        ? 'Aprobaste la autoevaluación y completaste el módulo.'
        : 'Todavía no alcanzaste el 60 %. Podés volver a intentarlo.'
    };
  }
};
