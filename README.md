# profeluna.ar

Sitio de capacitaciones de la Prof. Carina Luna (EPJA N° 753, Rawson · Chubut) y su API,
en **un solo proyecto de Vercel**: el sitio estático y la API comparten dominio.

## Estructura del repositorio

```
/
├── public/          → EL SITIO (estático). Es lo que se publica en profeluna.ar.
│   ├── index.html         portal (cursos + tercer sector)
│   ├── admin.html         panel de administración de Carina
│   ├── curso.html         renderiza los cursos creados desde el panel (?c=<id>)
│   ├── 404.html · mapa.html · desarrollo-local.html
│   ├── tema.css · estilos.css       estilos
│   ├── api.js · config.js · comun.js   scripts del frontend
│   ├── assets/            imágenes
│   ├── costos/ marketing-mix/ finanzas-emprendedores/ armando-cv/   cursos con página propia
│   ├── tercer-sector/     Matriz Semilla
│   └── CNAME              dominio (profeluna.ar)
│
├── api/             → punto de entrada serverless de Vercel (sirve /api/*)
│   └── index.js           exporta la app de Express
├── src/             → código de la API (MVC + servicios + repositorios + middlewares)
├── db/              → schema.sql y datos iniciales
├── scripts/         → utilidades y CI (init-db, admin:crear, smoke, check-frontend…)
├── package.json     → dependencias y scripts de la API
├── vercel.json      → sirve public/ como estático y enruta /api/* a la función
└── .github/workflows/   → CI/CD
```

La API (patrones MVC, Service Layer, Repository, Singleton, Factory, Chain of
Responsibility) está documentada en **[API.md](API.md)**.

## Desarrollo local

```bash
npm install
# Sitio: se sirve estático
cd public && python3 -m http.server 8080      # http://localhost:8080
# API (otra terminal), lee backend .env:
npm run dev                                    # http://localhost:3000/api
```

`public/config.js` decide a qué API apunta el sitio (local o producción).

## Verificar antes de pushear

```bash
npm run ci:sintaxis && npm run ci:boot         # valida la API
node scripts/check-frontend.js public          # valida el sitio
```

Es lo mismo que corre el CI en cada push/PR (`.github/workflows/ci.yml`).

## Despliegue (un solo proyecto en Vercel)

1. Vercel → **Add New → Project** → importás el repo (Root Directory: la **raíz**).
2. Variables de entorno: `DATABASE_URL` y `JWT_SECRET` (y opcional `NOTA_APROBACION`).
3. Deploy. Vercel sirve `public/` como estático y `api/` como función:
   - `profeluna.ar/` → el sitio.
   - `profeluna.ar/api/…` → la API (por el `rewrite` de `vercel.json`).
4. Verificá `https://<tu-dominio>/api/salud` → debe devolver `{"ok":true}`.

Como el sitio y la API viven en el mismo dominio, `public/config.js` usa
`https://profeluna.ar/api` y **no hay CORS ni URLs cruzadas**.

**Base de datos** (una sola vez, contra Neon): `npm run db:init` y
`npm run admin:crear -- <email> <clave> "Carina Luna"`. Detalle en [API.md](API.md).

**CD**: la integración Git de Vercel despliega sola en cada push a `main`. Alternativa:
`.github/workflows/deploy.yml` desde Actions si cargás los secrets `VERCEL_*`.
