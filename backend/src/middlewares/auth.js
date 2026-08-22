// Eslabón de la cadena de middlewares (Chain of Responsibility):
// si el token JWT es válido deja pasar y cuelga los datos del admin en req;
// si no, corta la cadena con 401 y la petición nunca llega al controlador.
import jwt from 'jsonwebtoken';
import { ErrorApp } from '../errores.js';
import config from '../config/index.js';
import { epjaEstudiantesRepo } from '../repositories/epja-estudiantes.repo.js';

function tokenDesdeReq(req) {
  const cabecera = req.headers.authorization || '';
  return cabecera.startsWith('Bearer ') ? cabecera.slice(7) : '';
}

function verificar(req) {
  const token = tokenDesdeReq(req);
  if (!token) throw new ErrorApp(401, 'Hace falta iniciar sesión');
  return jwt.verify(token, config.jwtSecret);
}

function esErrorJwt(error) {
  return ['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error?.name);
}

export function requiereAdmin(req, _res, next) {
  try {
    const datos = verificar(req);
    if (datos?.tipo && datos.tipo !== 'admin') {
      return next(new ErrorApp(403, 'Esta acción requiere permisos de administración'));
    }
    req.admin = datos;
    next();
  } catch (e) {
    next(e instanceof ErrorApp ? e : new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión'));
  }
}

// Los adjuntos del aula pueden descargarlos tanto administradores como estudiantes
// autenticados. Para estudiantes también se comprueba que la cuenta siga activa.
export async function requiereSesion(req, _res, next) {
  try {
    const datos = verificar(req);
    if (datos?.tipo === 'estudiante') {
      const id = Number(datos.sub);
      if (!Number.isInteger(id)) throw new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión');
      const estudiante = await epjaEstudiantesRepo.obtener(id);
      if (!estudiante) throw new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión');
      if (!estudiante.activo) throw new ErrorApp(403, 'Este usuario está inactivo');
      req.estudiante = { ...datos, sub: estudiante.id };
    } else if (datos?.tipo && datos.tipo !== 'admin') {
      throw new ErrorApp(403, 'No tenés acceso a este archivo');
    } else {
      req.admin = datos;
    }
    next();
  } catch (e) {
    if (e instanceof ErrorApp) return next(e);
    if (esErrorJwt(e)) return next(new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión'));
    next(e);
  }
}

export async function requiereEstudiante(req, _res, next) {
  try {
    const datos = verificar(req);
    if (datos?.tipo !== 'estudiante') {
      return next(new ErrorApp(403, 'Esta acción requiere una sesión de estudiante'));
    }
    const id = Number(datos.sub);
    if (!Number.isInteger(id)) throw new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión');
    const estudiante = await epjaEstudiantesRepo.obtener(id);
    if (!estudiante) throw new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión');
    if (!estudiante.activo) throw new ErrorApp(403, 'Este usuario está inactivo');
    req.estudiante = {
      ...datos,
      sub: estudiante.id,
      dni: estudiante.dni,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      email: estudiante.email || ''
    };
    next();
  } catch (e) {
    if (e instanceof ErrorApp) return next(e);
    if (esErrorJwt(e)) return next(new ErrorApp(401, 'La sesión venció, volvé a iniciar sesión'));
    next(e);
  }
}
