# API de profeluna.ar

Backend de cursos y resultados de evaluaciones. Node.js + Express + PostgreSQL (Neon),
desplegado como función serverless en Vercel.

## Arquitectura y patrones de diseño

```
petición HTTP
  → CORS → express.json → validarCuerpo / requiereAdmin   (Chain of Responsibility)
  → routes/ → controllers/                                 (MVC)
  → services/          ← reglas de negocio                 (Service Layer)
  → repositories/      ← todo el SQL vive acá              (Repository + DTO/Mapper)
  → db/pool.js         ← única instancia del pool          (Singleton)
  → PostgreSQL (Neon)
```

- **MVC** — `routes/` declara los endpoints, `controllers/` traduce HTTP ↔ servicios, la "vista" es JSON.
- **Service Layer** (`services/`) — reglas de negocio: la aprobación (≥ 60%) se calcula en el servidor, un curso `disponible` exige enlace, etc.
- **Repository** (`repositories/`) — el único lugar con SQL. Cambiar de base = reescribir solo esta capa.
- **DTO / Mapper** — las filas snake_case de la base se traducen a objetos camelCase de la API.
- **Singleton** (`src/db/pool.js`) — un solo pool de conexiones por proceso (clave en serverless).
- **Factory** (`src/app.js`) — `crearApp()` arma la app; `server.js` (local) y `api/index.js` (Vercel) la reutilizan.
- **Chain of Responsibility** — middlewares de Express: auth JWT y validación cortan antes del controlador; el manejador de errores cierra la cadena.

En el frontend: `api.js` (Module Pattern: todo fetch pasa por `Api.*`) y `admin.html`
(estado central que re-renderiza la vista, Observer simplificado).

## Modelo de cursos

Hay dos clases de curso, y conviven:

- **Externos** — los 4 cursos con página propia elaborada (Costos, Marketing, Finanzas, CV) y recursos como ANMAT. Tienen `enlace` y la tarjeta lleva ahí. Se siembran en la base; el panel no los edita por módulos.
- **Internos** — los que Carina crea desde el panel. No tienen `enlace`: se arman con **módulos** (título + bloques de contenido) y el sitio los renderiza en `curso.html?c=<id>`. Sus metas (**N módulos** y **~X min**) se calculan solas a partir del contenido (tiempo ≈ palabras / 200), no se escriben a mano.

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/salud` | — | Health check |
| POST | `/api/auth/login` | — | Devuelve token JWT |
| GET | `/api/auth/yo` | admin | Datos de la sesión |
| GET | `/api/cursos` | — | Cursos agrupados por sección (con metas calculadas) |
| POST · PUT · DELETE | `/api/cursos[/:id]` | admin | Crear / editar / eliminar curso |
| PUT | `/api/cursos/reordenar` | admin | Reordenar (`{ids: [..]}`) |
| GET | `/api/cursos/:id/modulos` | — | Módulos de un curso (los usa `curso.html`) |
| POST · PUT · DELETE | `/api/cursos/:id/modulos`, `/api/modulos/:id` | admin | Gestionar módulos |
| PUT | `/api/cursos/:id/modulos/reordenar` | admin | Reordenar módulos |
| GET | `/api/organizaciones` | — | Organizaciones aprobadas (mapa y vitrina) |
| GET | `/api/organizaciones/todas` | admin | Todas (para el panel) |
| POST · PUT · DELETE | `/api/organizaciones[/:id]` | admin | Gestionar organizaciones |
| POST | `/api/resultados` | — | Registrar resultado de evaluación (lo usan los cursos) |
| GET | `/api/resultados?curso=` | admin | Listar resultados |
| GET | `/api/resultados/resumen` | admin | Totales por curso |

## Puesta en marcha (una sola vez)

### 1. Base de datos en Neon (gratis)

1. Crear cuenta en [neon.tech](https://neon.tech) (con la cuenta de GitHub).
2. Crear un proyecto → copiar la **Connection string** (`postgresql://...sslmode=require`).

### 2. Configuración local

```bash
cp .env.example .env        # pegar DATABASE_URL y un JWT_SECRET
npm install
npm run db:init             # crea tablas y carga los cursos actuales
npm run admin:crear -- carina@ejemplo.com UnaClaveSegura "Carina Luna"
npm run smoke               # opcional: prueba end-to-end (crea/borra un curso de prueba)
npm run dev                 # API en http://localhost:3000/api
```

Generar el secreto: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 3. Desplegar en Vercel (un solo proyecto)

1. En [vercel.com](https://vercel.com): **Add New → Project**, importar el repo con
   **Root Directory: la raíz** (no una subcarpeta). Vercel sirve `public/` como estático
   y `api/` como función; el `vercel.json` enruta `/api/*` a la API.
2. En *Settings → Environment Variables* cargar `DATABASE_URL` y `JWT_SECRET`.
3. Deploy. El sitio queda en `https://<dominio>/` y la API en `https://<dominio>/api/salud`.

Como sitio y API comparten dominio, `public/config.js` ya usa `https://profeluna.ar/api`
y no hace falta tocar nada más. Listo: `profeluna.ar/admin.html` es el panel de Carina.

## Notas

- El panel funciona desde cualquier navegador; Carina no instala nada.
- Si la API no responde, la página pública muestra el respaldo embebido y las
  evaluaciones registran en el Google Sheet viejo (nada se rompe).
- La nota de aprobación se cambia con la variable `NOTA_APROBACION` (default 60).
