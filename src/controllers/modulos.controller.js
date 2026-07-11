// Controladores (la C de MVC): traducen HTTP ↔ servicio.
import { modulosService } from '../services/modulos.service.js';

export const modulosController = {
  async listar(req, res, next) {
    try { res.json(await modulosService.listar(Number(req.params.cursoId))); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await modulosService.crear(Number(req.params.cursoId), req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await modulosService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await modulosService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) { next(e); }
  },

  async reordenar(req, res, next) {
    try {
      await modulosService.reordenar(Number(req.params.cursoId), req.body?.ids);
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
};
