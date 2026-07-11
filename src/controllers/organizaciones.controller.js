// Controladores (la C de MVC): traducen HTTP ↔ servicio.
import { organizacionesService } from '../services/organizaciones.service.js';

export const organizacionesController = {
  async listarPublicas(_req, res, next) {
    try { res.json(await organizacionesService.listarPublicas()); } catch (e) { next(e); }
  },

  async listarTodas(_req, res, next) {
    try { res.json(await organizacionesService.listarTodas()); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await organizacionesService.crear(req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await organizacionesService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  },

  async eliminar(req, res, next) {
    try {
      await organizacionesService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) { next(e); }
  }
};
