// Configuración central: el único lugar del código que lee variables de entorno.
// El resto de la app importa este objeto y nunca toca process.env.

const config = {
  puerto: Number(process.env.PORT) || 3000,
  produccion: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpira: process.env.JWT_EXPIRA || '8h',
  notaAprobacion: Number(process.env.NOTA_APROBACION) || 60,
  origenesPermitidos: [
    'https://profeluna.ar',
    'https://www.profeluna.ar',
    'https://profelunacursoscortos.vercel.app',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://localhost:8080',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:8080',
    ...(process.env.ORIGENES_PERMITIDOS || '').split(',').map(o => o.trim()).filter(Boolean)
  ]
};

export default config;
