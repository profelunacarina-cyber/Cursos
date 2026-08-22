import { epjaAlumnoService } from '../services/epja-alumno.service.js';

export const epjaAlumnoController = {
  async misMaterias(req, res, next) {
    try { res.json(await epjaAlumnoService.misMaterias(Number(req.estudiante.sub))); } catch (e) { next(e); }
  },

  async materia(req, res, next) {
    try { res.json(await epjaAlumnoService.materia(Number(req.estudiante.sub), req.params.codigo)); } catch (e) { next(e); }
  },

  async modulo(req, res, next) {
    try { res.json(await epjaAlumnoService.modulo(Number(req.estudiante.sub), Number(req.params.id))); } catch (e) { next(e); }
  },

  async completar(req, res, next) {
    try { res.json(await epjaAlumnoService.completar(Number(req.estudiante.sub), Number(req.params.id))); } catch (e) { next(e); }
  }
};
