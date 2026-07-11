// Eslabón de la cadena de middlewares (Chain of Responsibility):
// si el token JWT es válido deja pasar y cuelga los datos del admin en req;
// si no, corta la cadena con 401 y la petición nunca llega al controlador.
import jwt from 'jsonwebtoken';
import { ErrorApp } from '../errores.js';
import config from '../config/index.js';

export function requiereAdmin(req, _res, next) {
  const cabecera = req.headers.authorization || '';
  const token = cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
  if (!token) return next(new ErrorApp(401, 'Hace falta iniciar sesión'));
  try {
    req.admin = jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    next(new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión'));
  }
}
