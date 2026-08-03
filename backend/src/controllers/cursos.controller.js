// Controladores (la C de MVC): traducen HTTP ↔ servicio.
// No hay reglas de negocio acá; eso vive en los servicios.
import { cursosService } from '../services/cursos.service.js';

export const cursosController = {
  async listar(_req, res, next) {
    try { res.json(await cursosService.listarAgrupados()); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await cursosService.crear(req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await cursosService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await cursosService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) { next(e); }
  },

  async reordenar(req, res, next) {
    try {
      await cursosService.reordenar(req.body?.ids);
      res.json({ ok: true });
    } catch (e) { next(e); }
  }
};
