import { epjaEstudiantesService } from '../services/epja-estudiantes.service.js';

export const epjaEstudiantesController = {
  async listar(req, res, next) {
    try { res.json(await epjaEstudiantesService.listar(req.query)); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await epjaEstudiantesService.crear(req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await epjaEstudiantesService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  },

  async asignarMaterias(req, res, next) {
    try { res.json(await epjaEstudiantesService.asignarMaterias(Number(req.params.id), req.body?.materias)); } catch (e) { next(e); }
  },

  async importar(req, res, next) {
    try { res.json(await epjaEstudiantesService.importar(req.body?.filas)); } catch (e) { next(e); }
  },

  async resetClave(req, res, next) {
    try { res.json(await epjaEstudiantesService.resetClave(Number(req.params.id), req.body?.clave)); } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await epjaEstudiantesService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) { next(e); }
  }
};
