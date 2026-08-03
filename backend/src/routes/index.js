// Rutas (MVC): el mapa completo de la API en una sola pantalla.
// Cada ruta arma su cadena: [validación / autenticación] → controlador.
import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { cursosController } from '../controllers/cursos.controller.js';
import { resultadosController } from '../controllers/resultados.controller.js';
import { organizacionesController } from '../controllers/organizaciones.controller.js';
import { modulosController } from '../controllers/modulos.controller.js';
import { recursosCursoController } from '../controllers/recursos-curso.controller.js';
import { epjaAuthController } from '../controllers/epja-auth.controller.js';
import { epjaAlumnoController } from '../controllers/epja-alumno.controller.js';
import { epjaEstudiantesController } from '../controllers/epja-estudiantes.controller.js';
import { epjaMateriasController } from '../controllers/epja-materias.controller.js';
import { epjaModulosController } from '../controllers/epja-modulos.controller.js';
import { epjaCertificadosController } from '../controllers/epja-certificados.controller.js';
import { TIPOS } from '../services/organizaciones.service.js';
import { requiereAdmin, requiereEstudiante } from '../middlewares/auth.js';
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

const esquemaLoginEpja = {
  dni:      { requerido: true, tipo: 'texto', max: 20 },
  password: { requerido: true, tipo: 'texto', max: 120 }
};

const esquemaRecuperarClaveEpja = {
  email: { requerido: true, tipo: 'texto', max: 160 }
};

const esquemaVerificarCodigoEpja = {
  email:  { requerido: true, tipo: 'texto', max: 160 },
  codigo: { requerido: true, tipo: 'texto', max: 12 }
};

const esquemaRestablecerClaveEpja = {
  resetToken:    { requerido: true, tipo: 'texto', max: 200 },
  passwordNueva: { requerido: true, tipo: 'texto', max: 120 }
};

const esquemaPerfilEpja = {
  nombre:   { requerido: true, tipo: 'texto', max: 80 },
  apellido: { requerido: true, tipo: 'texto', max: 80 },
  email:    { tipo: 'texto', max: 160 }
};

const esquemaCambiarClaveEpja = {
  passwordActual: { requerido: true, tipo: 'texto', max: 120 },
  passwordNueva:  { requerido: true, tipo: 'texto', max: 120 }
};

const esquemaEpjaMateria = {
  codigo:      { tipo: 'texto', max: 40 },
  nombre:      { requerido: true, tipo: 'texto', max: 120 },
  descripcion: { tipo: 'texto', max: 600 },
  color:       { tipo: 'texto', max: 20 },
  orden:       { tipo: 'numero' },
  activa:      { tipo: 'booleano' }
};

const esquemaEpjaModulo = {
  titulo:    { requerido: true, tipo: 'texto', max: 160 },
  resumen:   { tipo: 'texto', max: 240 },
  contenido: { tipo: 'texto', max: 40000 },
  publicado: { tipo: 'booleano' }
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

const esquemaRecurso = { tipo:{requerido:true,valores:['evaluacion','herramienta']}, titulo:{requerido:true,tipo:'texto',max:160}, contenidoHtml:{tipo:'texto',max:40000}, activo:{tipo:'booleano'} };
rutas.get('/cursos/:cursoId/recursos/todos', requiereAdmin, recursosCursoController.listarTodos);
rutas.get('/cursos/:cursoId/recursos', recursosCursoController.listar);
rutas.post('/cursos/:cursoId/recursos', requiereAdmin, validarCuerpo(esquemaRecurso), recursosCursoController.crear);
rutas.put('/recursos/:id', requiereAdmin, validarCuerpo(esquemaRecurso), recursosCursoController.actualizar);
rutas.delete('/recursos/:id', requiereAdmin, recursosCursoController.eliminar);

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

// EPJA · autenticación de estudiantes
rutas.post('/epja/auth/login',
  limitar({ ventanaMs: 15 * 60_000, maximo: 20 }),
  validarCuerpo(esquemaLoginEpja),
  epjaAuthController.login);
rutas.post('/epja/auth/recuperar-clave',
  limitar({ ventanaMs: 15 * 60_000, maximo: 6 }),
  validarCuerpo(esquemaRecuperarClaveEpja),
  epjaAuthController.recuperarClave);
rutas.post('/epja/auth/verificar-codigo',
  limitar({ ventanaMs: 15 * 60_000, maximo: 8 }),
  validarCuerpo(esquemaVerificarCodigoEpja),
  epjaAuthController.verificarCodigoRecuperacion);
rutas.post('/epja/auth/restablecer-clave',
  limitar({ ventanaMs: 15 * 60_000, maximo: 8 }),
  validarCuerpo(esquemaRestablecerClaveEpja),
  epjaAuthController.restablecerClave);
rutas.get('/epja/auth/yo', requiereEstudiante, epjaAuthController.yo);
rutas.put('/epja/auth/perfil', requiereEstudiante, validarCuerpo(esquemaPerfilEpja), epjaAuthController.actualizarPerfil);
rutas.put('/epja/auth/password', requiereEstudiante, validarCuerpo(esquemaCambiarClaveEpja), epjaAuthController.cambiarClave);

// EPJA · aula del alumno
rutas.get('/epja/alumno/materias', requiereEstudiante, epjaAlumnoController.misMaterias);
rutas.get('/epja/alumno/materias/:codigo', requiereEstudiante, epjaAlumnoController.materia);
rutas.get('/epja/alumno/modulos/:id', requiereEstudiante, epjaAlumnoController.modulo);
rutas.post('/epja/alumno/modulos/:id/completar', requiereEstudiante, epjaAlumnoController.completar);

// EPJA · administración
rutas.get('/epja/estudiantes', requiereAdmin, epjaEstudiantesController.listar);
rutas.post('/epja/estudiantes', requiereAdmin, epjaEstudiantesController.crear);
rutas.put('/epja/estudiantes/:id', requiereAdmin, epjaEstudiantesController.actualizar);
rutas.delete('/epja/estudiantes/:id', requiereAdmin, epjaEstudiantesController.eliminar);
rutas.put('/epja/estudiantes/:id/materias', requiereAdmin, epjaEstudiantesController.asignarMaterias);
rutas.post('/epja/estudiantes/importar', requiereAdmin, epjaEstudiantesController.importar);
rutas.post('/epja/estudiantes/:id/reset-clave', requiereAdmin, epjaEstudiantesController.resetClave);
rutas.get('/epja/estudiantes/:id/recorrido', requiereAdmin, epjaCertificadosController.recorrido);
rutas.post('/epja/estudiantes/:id/modulos/:moduloId/aprobar', requiereAdmin, epjaCertificadosController.aprobarYEmitir);
rutas.get('/epja/certificados', requiereAdmin, epjaCertificadosController.listar);
rutas.delete('/epja/certificados/:id', requiereAdmin, epjaCertificadosController.revocar);

rutas.get('/epja/materias', requiereAdmin, epjaMateriasController.listar);
rutas.post('/epja/materias', requiereAdmin, validarCuerpo(esquemaEpjaMateria), epjaMateriasController.crear);
rutas.put('/epja/materias/:id', requiereAdmin, validarCuerpo(esquemaEpjaMateria), epjaMateriasController.actualizar);
rutas.get('/epja/materias/:materiaId/modulos', requiereAdmin, epjaModulosController.listarDeMateria);
rutas.post('/epja/materias/:materiaId/modulos', requiereAdmin, validarCuerpo(esquemaEpjaModulo), epjaModulosController.crear);
rutas.put('/epja/materias/:materiaId/modulos/reordenar', requiereAdmin, epjaModulosController.reordenar);
rutas.put('/epja/modulos/:id', requiereAdmin, validarCuerpo(esquemaEpjaModulo), epjaModulosController.actualizar);
rutas.delete('/epja/modulos/:id', requiereAdmin, epjaModulosController.eliminar);
