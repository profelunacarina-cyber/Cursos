# profeluna.ar

Sitio de capacitaciones de la Prof. Carina Luna (EPJA N° 753, Rawson · Chubut) y su API,
en **un solo proyecto de Vercel**: el sitio estático y la API comparten dominio.

## Estructura del repositorio

```
/
├── frontend/        → aplicación Vue: src/, public/ y dist/.
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
├── backend/         → API Express, base de datos y scripts operativos
│   ├── src/         → MVC, servicios, repositorios y middlewares
│   ├── db/          → migraciones SQL y datos iniciales
│   └── scripts/     → migraciones, CI y utilidades
├── package.json     → dependencias y scripts de la API
├── vercel.json      → publica frontend/dist y enruta /api/* a la función
└── .github/workflows/   → CI/CD
```

La API (patrones MVC, Service Layer, Repository, Singleton, Factory, Chain of
Responsibility) está documentada en **[backend/README.md](backend/README.md)**.

## Desarrollo local

```bash
npm install
# Sitio: se sirve estático
npm run dev:web                                # http://localhost:5173
# API (otra terminal), lee .env.local:
npm run dev                                    # http://localhost:3000/api
```

La aplicación Vue usa la ruta relativa `/api` tanto en local como en producción.

## Verificar antes de pushear

```bash
npm run ci:sintaxis && npm run ci:boot         # valida la API
npm run check:frontend                          # valida el build de Vue
```

Es lo mismo que corre Checks en cada push/PR (`.github/workflows/checks.yml`).

## Ambientes: dev y producción

- `main` es producción. Si Checks pasa, `.github/workflows/deploy.yml` despliega con `vercel --prod`.
- `dev` es el ambiente de prueba. Si Checks pasa, `.github/workflows/preview.yml` despliega un preview de Vercel.
- Las ramas de trabajo no despliegan preview automático. Se prueban al mergear o pushear a `dev`.
- En Vercel configurá variables separadas por ambiente:
  - `Production`: `DATABASE_URL` real, `JWT_SECRET` real, `RESEND_API_KEY` y `EMAIL_FROM` reales.
  - `Preview`: `DATABASE_URL` de prueba/dev, `JWT_SECRET` de prueba/dev, `RESEND_API_KEY` y `EMAIL_FROM` de prueba/dev.
- En GitHub Actions hacen falta estos secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Flujo de prueba: rama de trabajo → PR o merge a `dev` → preview dev. Cuando se valida, PR de `dev` a `main` → producción.

### Base de datos de prueba

Para el preview de `dev`, usá una base separada. Como el aula guarda datos de estudiantes
(DNI, nombres, progreso y certificados), no conviene probar contra producción ni clonar
datos reales.

Recomendado en Neon:

1. Crear un proyecto nuevo llamado `profeluna-dev` o una base vacía equivalente.
2. Copiar su connection string, por ejemplo `postgresql://.../neondb?sslmode=require`.
3. En Vercel → proyecto → **Settings → Environment Variables**:
   - `DATABASE_URL`: pegar la connection string de `profeluna-dev`.
   - Ambiente: `Preview`.
   - Branch: `dev` si Vercel ofrece limitarla por rama.
   - `JWT_SECRET`: cargar un secreto distinto al de producción, también en `Preview` / `dev`.
   - `RESEND_API_KEY` y `EMAIL_FROM`: necesarios para enviar el código de recuperación de contraseña.
4. Inicializar esa base una sola vez desde una terminal con la URL de prueba:

```bash
cp .env.example .env.local
# pegar en .env.local la DATABASE_URL de profeluna-dev y un JWT_SECRET dev
npm run db:init
npm run admin:crear -- carina@ejemplo.com UnaClaveDev "Carina Luna"
```

Después de eso, cada push a `dev` usa la base de prueba y `main` sigue usando la base real.

## Despliegue (un solo proyecto en Vercel)

1. Vercel → **Add New → Project** → importás el repo (Root Directory: la **raíz**).
2. Variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM` (y opcional `NOTA_APROBACION`).
3. Deploy. Vercel construye `frontend/dist` y usa `api/` como función:
   - `profeluna.ar/` → el sitio.
   - `profeluna.ar/api/…` → la API (por el `rewrite` de `vercel.json`).
4. Verificá `https://<tu-dominio>/api/salud` → debe devolver `{"ok":true}`.

Como sitio y API viven en el mismo dominio, se usa `/api` y **no hay CORS ni URLs cruzadas**.

**Base de datos local/dev** (una sola vez, contra Neon dev): `npm run db:init` y
`npm run admin:crear -- <email> <clave> "Carina Luna"`. Detalle en [backend/README.md](backend/README.md).

**CD**: la integración Git de Vercel despliega sola en cada push a `main`. Alternativa:
`.github/workflows/deploy.yml` desde Actions si cargás los secrets `VERCEL_*`.
