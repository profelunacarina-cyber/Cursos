// Rutas (MVC): el mapa completo de la API en una sola pantalla.
// Cada ruta arma su cadena: [validación / autenticación] → controlador.
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { cursosController } from '../controllers/cursos.controller.js';
import { resultadosController } from '../controllers/resultados.controller.js';
import { organizacionesController } from '../controllers/organizaciones.controller.js';
import { modulosController } from '../controllers/modulos.controller.js';
import { TIPOS } from '../services/organizaciones.service.js';
import { requiereAdmin } from '../middlewares/auth.js';
import { validarCuerpo } from '../middlewares/validar.js';
import { limitar } from '../middlewares/limitar.js';
import { SECCIONES, ESTADOS } from '../services/cursos.service.js';

const esquemaCurso = {
  seccion:     { requerido: true, valores: SECCIONES },
  titulo:      { requerido: true, tipo: 'texto', max: 120 },
  estado:      { requerido: true, valores: ESTADOS },
  etiqueta:    { tipo: 'texto', max: 80 },
  descripcion: { tipo: 'texto', max: 600 },
  enlace:      { tipo: 'texto', max: 300 },
  textoEnlace: { tipo: 'texto', max: 60 },
  insignia:    { tipo: 'texto', max: 40 },
  metas:       { tipo: 'lista' }
};

const esquemaResultado = {
  curso:    { requerido: true, tipo: 'texto', max: 60 },
  nombre:   { requerido: true, tipo: 'texto', max: 60 },
  apellido: { requerido: true, tipo: 'texto', max: 60 },
  aciertos: { requerido: true, tipo: 'numero' },
  total:    { requerido: true, tipo: 'numero' },
  modo:     { tipo: 'texto', max: 20 },
  detalle:  { tipo: 'lista' }
};

const esquemaOrg = {
  nombre:      { requerido: true, tipo: 'texto', max: 120 },
  tipo:        { valores: TIPOS },
  zona:        { tipo: 'texto', max: 60 },
  localidad:   { tipo: 'texto', max: 80 },
  descripcion: { tipo: 'texto', max: 800 },
  contacto:    { tipo: 'texto', max: 300 },
  tags:        { tipo: 'lista' },
  rooms:       { tipo: 'lista' }
};

const esquemaLogin = {
  email:    { requerido: true, tipo: 'texto', max: 120 },
  password: { requerido: true, tipo: 'texto', max: 120 }
};

export const rutas = Router();

rutas.get('/salud', (_req, res) => res.json({ ok: true }));

// Sesión del panel de administración (máx. 10 intentos cada 15 minutos por IP)
rutas.post('/auth/login',
  limitar({ ventanaMs: 15 * 60_000, maximo: 10 }),
  validarCuerpo(esquemaLogin),
  authController.login);
rutas.get('/auth/yo', requiereAdmin, authController.yo);

// Cursos: la lectura es pública (la usa la página principal); escribir requiere sesión.
rutas.get('/cursos', cursosController.listar);
rutas.post('/cursos', requiereAdmin, validarCuerpo(esquemaCurso), cursosController.crear);
rutas.put('/cursos/reordenar', requiereAdmin, cursosController.reordenar);
rutas.put('/cursos/:id', requiereAdmin, validarCuerpo(esquemaCurso), cursosController.actualizar);
rutas.delete('/cursos/:id', requiereAdmin, cursosController.eliminar);

// Módulos de un curso: lectura pública (la usa curso.html); gestión con sesión.
const esquemaModulo = {
  titulo:    { requerido: true, tipo: 'texto', max: 160 },
  contenido: { tipo: 'texto', max: 40000 }
};
rutas.get('/cursos/:cursoId/modulos', modulosController.listar);
rutas.post('/cursos/:cursoId/modulos', requiereAdmin, validarCuerpo(esquemaModulo), modulosController.crear);
rutas.put('/cursos/:cursoId/modulos/reordenar', requiereAdmin, modulosController.reordenar);
rutas.put('/modulos/:id', requiereAdmin, validarCuerpo(esquemaModulo), modulosController.actualizar);
rutas.delete('/modulos/:id', requiereAdmin, modulosController.eliminar);

// Organizaciones: la lista pública (solo aprobadas) la usan el mapa y la vitrina;
// gestionarlas requiere sesión.
rutas.get('/organizaciones', organizacionesController.listarPublicas);
rutas.get('/organizaciones/todas', requiereAdmin, organizacionesController.listarTodas);
rutas.post('/organizaciones', requiereAdmin, validarCuerpo(esquemaOrg), organizacionesController.crear);
rutas.put('/organizaciones/:id', requiereAdmin, validarCuerpo(esquemaOrg), organizacionesController.actualizar);
rutas.delete('/organizaciones/:id', requiereAdmin, organizacionesController.eliminar);

// Resultados: crear es público (lo usan las evaluaciones); leer requiere sesión.
rutas.post('/resultados',
  limitar({ ventanaMs: 60_000, maximo: 20 }),
  validarCuerpo(esquemaResultado),
  resultadosController.crear);
rutas.get('/resultados', requiereAdmin, resultadosController.listar);
rutas.get('/resultados/resumen', requiereAdmin, resultadosController.resumen);
