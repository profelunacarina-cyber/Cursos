// Patrón Factory: crearApp() arma la aplicación Express completa y la devuelve.
// server.js la usa para escuchar en un puerto local; api/index.js la exporta a Vercel.
// La cadena de middlewares (Chain of Responsibility) se arma acá, en orden:
// CORS → parseo JSON → rutas → 404 → manejador de errores.
import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import { rutas } from './routes/index.js';
import { noEncontrado, manejadorErrores } from './middlewares/errores.js';

export function crearApp() {
  // Fallo temprano: sin estas variables la API no puede funcionar de forma segura.
  const faltantes = [];
  if (!config.jwtSecret) faltantes.push('JWT_SECRET');
  if (!config.databaseUrl) faltantes.push('DATABASE_URL');
  if (faltantes.length) {
    throw new Error('Faltan variables de entorno: ' + faltantes.join(', ') + ' (ver .env.example)');
  }

  const app = express();
  app.disable('x-powered-by');

  app.use(cors({
    // Sin cabecera Origin (curl, misma máquina) pasa; con Origin, solo los de la lista.
    origin: (origen, cb) => cb(null, !origen || config.origenesPermitidos.includes(origen))
  }));
  app.use(express.json({ limit: '100kb' }));

  app.use('/api', rutas);

  app.use(noEncontrado);
  app.use(manejadorErrores);
  return app;
}
