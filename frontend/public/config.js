// ── Configuración del frontend ──
// El sitio y la API viven bajo el mismo origen en Vercel y también en Vite,
// donde /api se reenvía al backend local. Solo al abrir HTML directo desde el
// filesystem se apunta explícitamente a la API local.
window.PROFELUNA_API = location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

// Contenido archivado: se conserva para volver a publicarlo cuando Carina lo decida.
// Cambiar estas opciones a true habilita nuevamente las secciones correspondientes.
window.PROFELUNA_VISIBILIDAD = {
  catalogoCursos: false,
  organizaciones: false
};
