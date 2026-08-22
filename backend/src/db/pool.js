// Patrón Singleton: una única instancia del pool de conexiones para todo el proceso.
// Crear conexiones a PostgreSQL es caro; en Vercel serverless, además, cada instancia
// reutiliza este pool entre invocaciones y evita agotar las conexiones de Neon.
import pg from 'pg';
import config from '../config/index.js';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 3,                     // pocas conexiones: amigable con serverless
      idleTimeoutMillis: 10_000,
      ssl: /localhost|127\.0\.0\.1/.test(config.databaseUrl) ? false : { rejectUnauthorized: false }
    });
  }
  return pool;
}
