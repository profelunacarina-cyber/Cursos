// Capa de servicios: autenticación del panel de administración.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { adminsRepo } from '../repositories/admins.repo.js';
import { ErrorApp } from '../errores.js';
import config from '../config/index.js';

// Hash de relleno: si el email no existe igual se compara contra algo,
// para que el tiempo de respuesta no delate qué emails están registrados.
const HASH_RELLENO = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export const authService = {
  async login(email, password) {
    const admin = await adminsRepo.buscarPorEmail(String(email || '').toLowerCase().trim());
    const valida = await bcrypt.compare(String(password || ''), admin ? admin.password_hash : HASH_RELLENO);
    // Mismo mensaje si el email no existe o la clave está mal:
    // no le regalamos pistas a quien prueba credenciales.
    if (!admin || !valida) throw new ErrorApp(401, 'Email o contraseña incorrectos');

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, nombre: admin.nombre },
      config.jwtSecret,
      { expiresIn: config.jwtExpira }
    );
    return { token, admin: { id: admin.id, email: admin.email, nombre: admin.nombre } };
  }
};
