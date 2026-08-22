// Prueba de humo end-to-end del modelo de cursos con módulos.
// Requiere una DATABASE_URL real (Neon) y las tablas ya creadas (npm run db:init).
// Uso: npm run smoke
// Crea un curso de prueba, le agrega módulos, verifica que las metas se calculan
// solas y que queda como "interno", y al final borra todo lo que creó.
import { cursosService } from '../src/services/cursos.service.js';
import { modulosService } from '../src/services/modulos.service.js';
import { getPool } from '../src/db/pool.js';

function asegurar(condicion, mensaje) {
  if (!condicion) throw new Error('✗ ' + mensaje);
  console.log('✓ ' + mensaje);
}

async function main() {
  console.log('— Creando curso interno de prueba…');
  const curso = await cursosService.crear({
    seccion: 'transversales',
    estado: 'disponible',
    titulo: 'CURSO DE PRUEBA (borrar)',
    etiqueta: 'Prueba',
    descripcion: 'Curso temporal para la prueba de humo.'
  });
  asegurar(curso.interno === true, 'el curso nuevo es interno (sin enlace)');
  asegurar(Array.isArray(curso.metas) && curso.metas.length === 0, 'sin módulos, no tiene metas');

  console.log('— Agregando 2 módulos…');
  const uno = await modulosService.crear(curso.id, {
    titulo: 'Módulo uno',
    contenido: '<h3>Un subtítulo</h3><p>Un párrafo de aproximadamente diez palabras para contar el tiempo.</p><ul><li>ítem uno</li><li>ítem dos</li></ul>'
  });
  asegurar(!/<script/i.test(uno.contenido), 'el contenido queda sanitizado (sin scripts)');
  await modulosService.crear(curso.id, {
    titulo: 'Módulo dos',
    contenido: '<p>Otro párrafo corto. <script>alert(1)</script><strong>Con negrita.</strong></p>'
  });

  console.log('— Releyendo el curso desde la API…');
  const grupos = await cursosService.listarAgrupados();
  const recargado = grupos.transversales.find(c => c.id === curso.id);
  asegurar(recargado, 'el curso aparece en la lista');
  asegurar(recargado.metas[0] === '2 módulos', 'la meta de módulos se calcula sola: ' + recargado.metas[0]);
  asegurar(/^~\d+ min$/.test(recargado.metas[1]), 'el tiempo estimado se calcula solo: ' + recargado.metas[1]);
  asegurar(recargado.nModulos === 2, 'nModulos = 2');

  const mods = await modulosService.listar(curso.id);
  asegurar(mods.length === 2, 'la API devuelve los 2 módulos');
  asegurar(typeof mods[0].contenido === 'string' && mods[0].contenido.includes('<h3>'), 'el contenido se guarda como HTML');
  asegurar(!/<script/i.test(mods[1].contenido), 'el <script> inyectado fue removido');

  console.log('— Limpiando (borra el curso y, en cascada, sus módulos)…');
  await cursosService.eliminar(curso.id);
  const grupos2 = await cursosService.listarAgrupados();
  asegurar(!grupos2.transversales.find(c => c.id === curso.id), 'el curso de prueba quedó eliminado');

  console.log('\n✅ Todo el flujo de cursos + módulos funciona.');
  await getPool().end();
}

main().catch((e) => { console.error('\n' + e.message); process.exit(1); });
