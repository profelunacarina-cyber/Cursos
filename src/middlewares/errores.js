// Último eslabón de la cadena: cualquier error termina acá y sale como JSON uniforme.
import { ErrorApp } from '../errores.js';

export function noEncontrado(_req, _res, next) {
  next(new ErrorApp(404, 'Ruta inexistente'));
}

export function manejadorErrores(err, _req, res, _next) {
  const estado = err instanceof ErrorApp ? err.estado : 500;
  if (estado === 500) console.error(err);
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : err.message });
}
