import { ErrorApp } from '../errores.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';
import { epjaModulosRepo } from '../repositories/epja-modulos.repo.js';
import { epjaProgresoRepo } from '../repositories/epja-progreso.repo.js';

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
    return { ...materia, modulos };
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
    return {
      ...modulo,
      anterior: indice > 0 ? { id: modulos[indice - 1].id, titulo: modulos[indice - 1].titulo } : null,
      siguiente: indice >= 0 && indice < modulos.length - 1
        ? { id: modulos[indice + 1].id, titulo: modulos[indice + 1].titulo }
        : null
    };
  },

  async completar(estudianteId, moduloId) {
    const modulo = await epjaModulosRepo.obtenerParaEstudiante(moduloId, estudianteId);
    if (!modulo) throw new ErrorApp(404, 'No existe el módulo o no tenés acceso');
    await epjaProgresoRepo.marcarCompleto(estudianteId, moduloId);
    return { ok: true };
  }
};
