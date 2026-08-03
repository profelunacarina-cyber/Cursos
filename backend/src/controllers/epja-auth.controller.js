import { epjaAuthService } from '../services/epja-auth.service.js';

export const epjaAuthController = {
  async login(req, res, next) {
    try { res.json(await epjaAuthService.login(req.body.dni, req.body.password)); } catch (e) { next(e); }
  },

  async yo(req, res, next) {
    try { res.json(await epjaAuthService.yo(req.estudiante.sub)); } catch (e) { next(e); }
  },

  async actualizarPerfil(req, res, next) {
    try { res.json(await epjaAuthService.actualizarPerfil(req.estudiante.sub, req.body)); } catch (e) { next(e); }
  },

  async cambiarClave(req, res, next) {
    try { res.json(await epjaAuthService.cambiarClave(req.estudiante.sub, req.body)); } catch (e) { next(e); }
  },

  async recuperarClave(req, res, next) {
    try { res.json(await epjaAuthService.recuperarClave(req.body)); } catch (e) { next(e); }
  },

  async verificarCodigoRecuperacion(req, res, next) {
    try { res.json(await epjaAuthService.verificarCodigoRecuperacion(req.body)); } catch (e) { next(e); }
  },

  async restablecerClave(req, res, next) {
    try { res.json(await epjaAuthService.restablecerClave(req.body)); } catch (e) { next(e); }
  }
};
