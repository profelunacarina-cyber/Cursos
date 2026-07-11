// Patrón Repository: acceso a la tabla admins.
import { getPool } from '../db/pool.js';

export const adminsRepo = {
  async buscarPorEmail(email) {
    const { rows } = await getPool().query(
      'SELECT id, email, nombre, password_hash FROM admins WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }
};
