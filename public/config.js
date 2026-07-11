// ── Configuración del frontend ──
// El sitio y la API viven en el mismo proyecto de Vercel (mismo dominio), así que
// en producción se usa la ruta relativa /api: funciona en www.profeluna.ar, en los
// previews y en cualquier dominio, sin redirects ni CORS.
// En desarrollo local el sitio (:8080) y la API (:3000) están separados.
window.PROFELUNA_API =
  (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api'
    : '/api';
