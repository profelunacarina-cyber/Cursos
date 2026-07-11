// Chequeo de arranque para el CI (no necesita base de datos).
// Verifica que la app levante y que /api/salud responda. Las variables de entorno
// las provee el workflow con valores de prueba (crearApp falla si faltan).
import { crearApp } from '../src/app.js';

const servidor = crearApp().listen(0, async () => {
  try {
    const puerto = servidor.address().port;
    const r = await fetch(`http://localhost:${puerto}/api/salud`);
    const datos = await r.json();
    if (!datos.ok) throw new Error('/api/salud no respondió ok');
    console.log('✓ La API arranca y /api/salud responde.');
    servidor.close();
  } catch (e) {
    console.error('✗ ' + e.message);
    process.exit(1);
  }
});
