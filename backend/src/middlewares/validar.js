// Validación declarativa del cuerpo de la petición: cada ruta describe su esquema
// y este middleware corta con 400 antes de llegar al controlador.
import { ErrorApp } from '../errores.js';

export function validarCuerpo(esquema) {
  return (req, _res, next) => {
    const cuerpo = req.body || {};
    const errores = [];

    for (const [campo, reglas] of Object.entries(esquema)) {
      const valor = cuerpo[campo];
      const vacio = valor === undefined || valor === null ||
                    (typeof valor === 'string' && valor.trim() === '');
      if (vacio) {
        if (reglas.requerido) errores.push(`«${campo}» es obligatorio`);
        continue;
      }
      if (reglas.tipo === 'texto' && typeof valor !== 'string') {
        errores.push(`«${campo}» debe ser texto`);
      }
      if (reglas.tipo === 'numero' && typeof valor !== 'number') {
        errores.push(`«${campo}» debe ser un número`);
      }
      if (reglas.tipo === 'lista' && !Array.isArray(valor)) {
        errores.push(`«${campo}» debe ser una lista`);
      }
      if (reglas.tipo === 'booleano' && typeof valor !== 'boolean') {
        errores.push(`«${campo}» debe ser verdadero o falso`);
      }
      if (reglas.tipo === 'objeto' && (typeof valor !== 'object' || Array.isArray(valor))) {
        errores.push(`«${campo}» debe ser un objeto`);
      }
      if (reglas.max && typeof valor === 'string' && valor.length > reglas.max) {
        errores.push(`«${campo}» supera los ${reglas.max} caracteres`);
      }
      if (reglas.valores && !reglas.valores.includes(valor)) {
        errores.push(`«${campo}» debe ser uno de: ${reglas.valores.join(', ')}`);
      }
    }

    if (errores.length) return next(new ErrorApp(400, errores.join(' · ')));
    next();
  };
}
