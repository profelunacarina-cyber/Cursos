import { epjaMateriasService } from '../services/epja-materias.service.js';

export const epjaMateriasController = {
  async listar(_req, res, next) {
    try { res.json(await epjaMateriasService.listar()); } catch (e) { next(e); }
  },

  async crear(req, res, next) {
    try { res.status(201).json(await epjaMateriasService.crear(req.body)); } catch (e) { next(e); }
  },

  async actualizar(req, res, next) {
    try { res.json(await epjaMateriasService.actualizar(Number(req.params.id), req.body)); } catch (e) { next(e); }
  }
};
