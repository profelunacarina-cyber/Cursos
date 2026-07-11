// Controladores (la C de MVC): traducen HTTP ↔ servicio.
import { authService } from '../services/auth.service.js';

export const authController = {
  async login(req, res, next) {
    try { res.json(await authService.login(req.body.email, req.body.password)); } catch (e) { next(e); }
  },

  // Devuelve los datos del token vigente; el middleware requiereAdmin ya lo validó.
  yo(req, res) {
    res.json({ id: req.admin.sub, email: req.admin.email, nombre: req.admin.nombre });
  }
};
