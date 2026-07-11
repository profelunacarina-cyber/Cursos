// Crea las tablas (db/schema.sql) y carga los cursos actuales si la tabla está vacía.
// Uso: npm run db:init
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getPool } from '../src/db/pool.js';
import { semillas, organizaciones } from '../db/semillas.js';

const raiz = dirname(dirname(fileURLToPath(import.meta.url)));

async function main() {
  const pool = getPool();

  await pool.query(readFileSync(join(raiz, 'db', 'schema.sql'), 'utf8'));
  console.log('✓ Tablas creadas (o ya existían)');

  const { rows: [{ n }] } = await pool.query('SELECT COUNT(*)::int AS n FROM cursos');
  if (n > 0) {
    console.log(`· La tabla cursos ya tiene ${n} filas; no se cargan semillas`);
  } else {
    for (const c of semillas) {
      await pool.query(
        `INSERT INTO cursos (seccion_id, etiqueta, titulo, descripcion, estado,
                             enlace, texto_enlace, metas, destacado, insignia, orden)
         SELECT id, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11
           FROM secciones WHERE clave = $1`,
        [c.seccion, c.etiqueta, c.titulo, c.descripcion, c.estado,
         c.enlace, c.textoEnlace, JSON.stringify(c.metas), c.destacado, c.insignia, c.orden]
      );
    }
    console.log(`✓ ${semillas.length} cursos cargados`);
  }

  const { rows: [{ n: nOrg }] } = await pool.query('SELECT COUNT(*)::int AS n FROM organizaciones');
  if (nOrg > 0) {
    console.log(`· La tabla organizaciones ya tiene ${nOrg} filas; no se cargan semillas`);
  } else {
    for (let i = 0; i < organizaciones.length; i++) {
      const o = organizaciones[i];
      await pool.query(
        `INSERT INTO organizaciones (nombre, tipo, zona, localidad, descripcion, tags,
                                     lat, lng, contacto, aprobado, destacado, orden)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12)`,
        [o.nombre, o.tipo, o.zona, o.localidad, o.descripcion, JSON.stringify(o.tags || []),
         o.lat, o.lng, o.contacto, o.aprobado, o.destacado, i + 1]
      );
    }
    console.log(`✓ ${organizaciones.length} organizaciones cargadas`);
  }

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
