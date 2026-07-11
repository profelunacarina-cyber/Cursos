// Entrada para Vercel: exporta la app como función serverless.
// Es la misma app que server.js gracias al patrón Factory.
import { crearApp } from '../src/app.js';

export default crearApp();
