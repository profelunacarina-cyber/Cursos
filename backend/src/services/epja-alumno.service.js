import { ErrorApp } from '../errores.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';
import { epjaModulosRepo } from '../repositories/epja-modulos.repo.js';
import { epjaProgresoRepo } from '../repositories/epja-progreso.repo.js';
import { epjaAutoevaluacionesRepo } from '../repositories/epja-autoevaluaciones.repo.js';
import { epjaCertificadosRepo } from '../repositories/epja-certificados.repo.js';

function autoevaluacionPublica(autoevaluacion, estado) {
  if (!autoevaluacion?.activa) return { activa: false };
  return {
    activa: true,
    notaAprobacion: 60,
    totalPreguntas: autoevaluacion.preguntas.length,
    preguntas: autoevaluacion.preguntas.map(pregunta => ({
      id: pregunta.id,
      enunciado: pregunta.enunciado,
      tipo: pregunta.tipo,
      opciones: pregunta.opciones.map(opcion => ({ texto: opcion.texto }))
    })),
    intentos: estado.intentos,
    mejorPorcentaje: estado.mejorPorcentaje,
    ultimoIntentoEn: estado.ultimoIntentoEn
  };
}

export const epjaAlumnoService = {
  misMaterias(estudianteId) {
    if (!Number.isInteger(estudianteId)) throw new ErrorApp(400, 'Id de estudiante inválido');
    return epjaMateriasRepo.listarDeEstudiante(estudianteId);
  },

  async materia(estudianteId, codigo) {
    if (!Number.isInteger(estudianteId)) throw new ErrorApp(400, 'Id de estudiante inválido');
    const materia = await epjaMateriasRepo.obtenerPorCodigo(String(codigo || '').trim().toLowerCase());
    if (!materia || !materia.activa) throw new ErrorApp(404, 'No existe la materia');
    if (!(await epjaMateriasRepo.estaAsignada(estudianteId, materia.id))) {
      throw new ErrorApp(403, 'No tenés acceso a esta materia');
    }
    const modulos = await epjaModulosRepo.listarDeMateria(materia.id, {
      soloPublicados: true,
      estudianteId
    });
    return {
      ...materia,
      modulos: modulos.map(modulo => ({
        ...modulo,
        completado: modulo.autoevaluacion?.activa ? Boolean(modulo.aprobado) : modulo.completado,
        autoevaluacion: { activa: Boolean(modulo.autoevaluacion?.activa) },
        certificadoModo: undefined
      }))
    };
  },

  async modulo(estudianteId, moduloId) {
    if (!Number.isInteger(estudianteId) || !Number.isInteger(moduloId)) {
      throw new ErrorApp(400, 'Datos inválidos');
    }
    const modulo = await epjaModulosRepo.obtenerParaEstudiante(moduloId, estudianteId);
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo o no tenés acceso');

    const modulos = await epjaModulosRepo.listarDeMateria(modulo.materiaId, {
      soloPublicados: true,
      estudianteId
    });
    const indice = modulos.findIndex(m => m.id === modulo.id);
    const estado = await epjaAutoevaluacionesRepo.estado(estudianteId, moduloId);
    const { certificadoModo: _certificadoModo, ...moduloPublico } = modulo;
    return {
      ...moduloPublico,
      completado: modulo.autoevaluacion?.activa ? Boolean(modulo.aprobado) : modulo.completado,
      autoevaluacion: autoevaluacionPublica(modulo.autoevaluacion, estado),
      certificado: estado.certificado,
      anterior: indice > 0 ? { id: modulos[indice - 1].id, titulo: modulos[indice - 1].titulo } : null,
      siguiente: indice >= 0 && indice < modulos.length - 1
        ? { id: modulos[indice + 1].id, titulo: modulos[indice + 1].titulo }
        : null
    };
  },

  async completar(estudianteId, moduloId) {
    const modulo = await epjaModulosRepo.obtenerParaEstudiante(moduloId, estudianteId);
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo o no tenés acceso');
    if (modulo.autoevaluacion?.activa) {
      throw new ErrorApp(409, 'Para completar este módulo tenés que aprobar la autoevaluación');
    }
    await epjaProgresoRepo.marcarCompleto(estudianteId, moduloId);
    return { ok: true };
  },

  async certificado(estudianteId, moduloId) {
    if (!Number.isInteger(estudianteId) || !Number.isInteger(moduloId)) throw new ErrorApp(400, 'Datos inválidos');
    const certificado = await epjaCertificadosRepo.obtenerDeEstudiante(estudianteId, moduloId);
    if (!certificado || certificado.revocadoEn) throw new ErrorApp(404, 'No hay un certificado vigente para este módulo');
    return certificado;
  }
};
