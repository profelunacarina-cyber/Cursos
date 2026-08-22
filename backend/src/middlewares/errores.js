// Último eslabón de la cadena: cualquier error termina acá y sale como JSON uniforme.
import { ErrorApp } from '../errores.js';

export function noEncontrado(_req, _res, next) {
  next(new ErrorApp(404, 'Ruta inexistente'));
}

export function manejadorErrores(err, _req, res, _next) {
  const estadoHttp = Number(err?.status || err?.statusCode);
  const estado = err instanceof ErrorApp
    ? err.estado
    : (estadoHttp >= 400 && estadoHttp < 600 ? estadoHttp : 500);
  if (estado === 500) console.error(err);
  const mensaje = err?.type === 'entity.too.large'
    ? 'El archivo o contenido supera el tamaño permitido'
    : err.message;
  res.status(estado).json({ error: estado === 500 ? 'Error interno del servidor' : mensaje });
}
