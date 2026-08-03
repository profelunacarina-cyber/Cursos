import { epjaModulosService } from '../services/epja-modulos.service.js';

export const epjaModulosController = {
  async listarDeMateria(req, res, next) {
    try { res.json(await epjaModulosService.listarDeMateria(Number(req.params.materiaId))); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await epjaModulosService.crear(Number(req.params.materiaId), req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await epjaModulosService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await epjaModulosService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) { next(e); }
  },

  async reordenar(req, res, next) {
    try {
      await epjaModulosService.reordenar(Number(req.params.materiaId), req.body?.ids);
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
};
