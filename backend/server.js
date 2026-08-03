import { crearApp } from './src/app.js';
import config from './src/config/index.js';

crearApp().listen(config.puerto, () => {
  console.log(`API escuchando en http://localhost:${config.puerto}/api`);
});
