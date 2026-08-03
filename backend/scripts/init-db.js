// Aplica las migraciones SQL y carga los datos iniciales si las tablas están vacías.
// Uso: npm run db:init
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { getPool } from '../src/db/pool.js';
import { semillas, organizaciones, epjaMaterias, epjaModulos } from '../db/semillas.js';

const raizBackend = dirname(dirname(fileURLToPath(import.meta.url)));
const raizRepo = dirname(raizBackend);

function directorioMigraciones() {
  const rutaConfig = join(raizRepo, 'database.json');
  const config = JSON.parse(readFileSync(rutaConfig, 'utf8'));
  return resolve(raizRepo, config['migrations-dir'] || 'backend/db/migrations');
}

async function aplicarMigraciones(pool) {
  const dir = directorioMigraciones();
  if (!existsSync(dir)) throw new Error(`No existe el directorio de migraciones: ${dir}`);

  const archivos = readdirSync(dir).filter(nombre => nombre.endsWith('.up.sql')).sort();
  if (!archivos.length) throw new Error(`No hay migraciones .up.sql en ${dir}`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS migraciones_sql (
      nombre TEXT PRIMARY KEY,
      aplicado_en TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await pool.query('SELECT nombre FROM migraciones_sql');
  const aplicadas = new Set(rows.map(r => r.nombre));

  for (const archivo of archivos) {
    if (aplicadas.has(archivo)) continue;
    const sql = readFileSync(join(dir, archivo), 'utf8').trim();
    if (!sql) continue;

    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migraciones_sql (nombre) VALUES ($1)', [archivo]);
      await pool.query('COMMIT');
      console.log(`✓ Migración aplicada: ${archivo}`);
    } catch (e) {
      await pool.query('ROLLBACK');
      throw new Error(`Falló la migración ${archivo}: ${e.message}`);
    }
  }
}

async function main() {
  const pool = getPool();

  try {
    await aplicarMigraciones(pool);
    console.log('✓ Migraciones al día');

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

    const { rows: [{ n: nEpjaMaterias }] } = await pool.query('SELECT COUNT(*)::int AS n FROM epja_materias');
    if (nEpjaMaterias > 0) {
      console.log(`· La tabla epja_materias ya tiene ${nEpjaMaterias} filas; no se cargan semillas`);
    } else {
      for (const m of epjaMaterias) {
        await pool.query(
          `INSERT INTO epja_materias (codigo, nombre, descripcion, color, orden)
           VALUES ($1, $2, $3, $4, $5)`,
          [m.codigo, m.nombre, m.descripcion, m.color, m.orden]
        );
      }
      console.log(`✓ ${epjaMaterias.length} materias EPJA cargadas`);
    }

    const { rows: [{ n: nEpjaModulos }] } = await pool.query('SELECT COUNT(*)::int AS n FROM epja_modulos');
    if (nEpjaModulos > 0) {
      console.log(`· La tabla epja_modulos ya tiene ${nEpjaModulos} filas; no se cargan semillas`);
    } else {
      for (const modulo of epjaModulos) {
        await pool.query(
          `INSERT INTO epja_modulos (materia_id, titulo, resumen, contenido, palabras, orden, publicado)
           SELECT id, $2, $3, $4::jsonb, $5, $6, $7
             FROM epja_materias
            WHERE codigo = $1`,
          [
            modulo.materiaCodigo,
            modulo.titulo,
            modulo.resumen,
            JSON.stringify(modulo.contenido),
            String(modulo.contenido).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
            modulo.orden,
            modulo.publicado
          ]
        );
      }
      console.log(`✓ ${epjaModulos.length} módulos EPJA cargados`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
