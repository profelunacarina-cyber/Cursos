// Crea un usuario admin (o le cambia la contraseña si el email ya existe).
// Uso: npm run admin:crear -- carina@ejemplo.com MiClaveSegura "Carina Luna"
import bcrypt from 'bcryptjs';
import { getPool } from '../src/db/pool.js';

const [email, password, nombre = ''] = process.argv.slice(2);

if (!email || !password) {
  console.log('Uso: npm run admin:crear -- <email> <contraseña> "<nombre>"');
  process.exit(1);
}
if (password.length < 8) {
  console.error('La contraseña debe tener al menos 8 caracteres');
  process.exit(1);
}

const hash = await bcrypt.hash(password, 10);
const pool = getPool();
await pool.query(
  `INSERT INTO admins (email, nombre, password_hash)
   VALUES ($1, $2, $3)
   ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash,
                                     nombre = EXCLUDED.nombre`,
  [email.toLowerCase().trim(), nombre, hash]
);
console.log(`✓ Admin ${email.toLowerCase().trim()} listo`);
await pool.end();
