// Controladores (la C de MVC): traducen HTTP ↔ servicio.
import { resultadosService } from '../services/resultados.service.js';

export const resultadosController = {
  async crear(req, res, next) {
    try { res.status(201).json(await resultadosService.registrar(req.body)); } catch (e) { next(e); }
  },

  async listar(req, res, next) {
    try {
      res.json(await resultadosService.listar({
        curso: String(req.query.curso || ''),
        limite: Math.min(Number(req.query.limite) || 200, 1000),
        desplazamiento: Math.max(Number(req.query.desde) || 0, 0)
      }));
    } catch (e) { next(e); }
  },

  async resumen(_req, res, next) {
    try { res.json(await resultadosService.resumen()); } catch (e) { next(e); }
  }
};
