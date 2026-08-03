// Límite de peticiones en memoria (Chain of Responsibility).
// Frena fuerza bruta en el login y spam en el registro de resultados.
// Nota: en serverless cada instancia tiene su propia memoria, así que es un
// freno parcial; suficiente para este tamaño de sitio sin sumar dependencias.
import { ErrorApp } from '../errores.js';

export function limitar({ ventanaMs, maximo }) {
  const intentos = new Map(); // ip → [timestamps]

  return (req, _res, next) => {
    const ahora = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || 'desconocida';
    const recientes = (intentos.get(ip) || []).filter(t => ahora - t < ventanaMs);

    if (recientes.length >= maximo) {
      return next(new ErrorApp(429, 'Demasiados intentos, esperá unos minutos'));
    }
    recientes.push(ahora);
    intentos.set(ip, recientes);

    // Limpieza ocasional para que el Map no crezca sin límite.
    if (intentos.size > 1000) {
      for (const [clave, marcas] of intentos) {
        if (!marcas.some(t => ahora - t < ventanaMs)) intentos.delete(clave);
      }
    }
    next();
  };
}
