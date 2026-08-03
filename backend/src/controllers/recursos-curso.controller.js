import { recursosCursoService } from '../services/recursos-curso.service.js';

export const recursosCursoController = {
  listar: async (req, res, next) => {
    try {
      res.json(await recursosCursoService.listarPublicos(Number(req.params.cursoId)));
    } catch (e) {
      next(e);
    }
  },
  listarTodos: async (req, res, next) => {
    try {
      res.json(await recursosCursoService.listarTodos(Number(req.params.cursoId)));
    } catch (e) {
      next(e);
    }
  },
  crear: async (req, res, next) => {
    try {
      res.status(201).json(await recursosCursoService.crear(Number(req.params.cursoId), req.body));
    } catch (e) {
      next(e);
    }
  },
  actualizar: async (req, res, next) => {
    try {
      res.json(await recursosCursoService.actualizar(Number(req.params.id), req.body));
    } catch (e) {
      next(e);
    }
  },
  eliminar: async (req, res, next) => {
    try {
      await recursosCursoService.eliminar(Number(req.params.id));
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
};
