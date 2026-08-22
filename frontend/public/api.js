// ── Cliente de la API de profeluna.ar ──
// Patrón Module: un único objeto (Api) encapsula el fetch, la URL base y el token
// de sesión. Las páginas nunca arman peticiones a mano.
window.Api = (function () {
  'use strict';

  var CLAVE_TOKEN = 'profeluna_token';
  var token = '';
  try { token = sessionStorage.getItem(CLAVE_TOKEN) || ''; } catch (e) { /* sin storage */ }

  function base() {
    return window.PROFELUNA_API || '/api';
  }

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var cabeceras = {};
    if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';
    if (token) cabeceras['Authorization'] = 'Bearer ' + token;

    return fetch(base() + ruta, {
      method: opciones.metodo || 'GET',
      headers: cabeceras,
      body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
    }).catch(function () {
      var err = new Error('No se pudo conectar con el servidor.');
      err.estado = 0;
      throw err;
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.json().catch(function () { return {}; }).then(function (datos) {
        if (!r.ok) {
          var err = new Error(datos.error || 'No se pudo conectar con el servidor');
          err.estado = r.status;
          throw err;
        }
        return datos;
      });
    });
  }

  return {
    sesion: {
      activa: function () { return Boolean(token); },
      entrar: function (email, password) {
        return pedir('/auth/login', { metodo: 'POST', cuerpo: { email: email, password: password } })
          .then(function (d) {
            token = d.token;
            try { sessionStorage.setItem(CLAVE_TOKEN, token); } catch (e) { /* sin storage */ }
            return d.admin;
          });
      },
      quien: function () { return pedir('/auth/yo'); },
      salir: function () {
        token = '';
        try { sessionStorage.removeItem(CLAVE_TOKEN); } catch (e) { /* sin storage */ }
      }
    },
    cursos: {
      listar: function () { return pedir('/cursos'); },
      crear: function (curso) { return pedir('/cursos', { metodo: 'POST', cuerpo: curso }); },
      actualizar: function (id, curso) { return pedir('/cursos/' + id, { metodo: 'PUT', cuerpo: curso }); },
      eliminar: function (id) { return pedir('/cursos/' + id, { metodo: 'DELETE' }); },
      reordenar: function (ids) { return pedir('/cursos/reordenar', { metodo: 'PUT', cuerpo: { ids: ids } }); }
    },
    modulos: {
      listar: function (cursoId) { return pedir('/cursos/' + cursoId + '/modulos'); },
      crear: function (cursoId, modulo) { return pedir('/cursos/' + cursoId + '/modulos', { metodo: 'POST', cuerpo: modulo }); },
      actualizar: function (id, modulo) { return pedir('/modulos/' + id, { metodo: 'PUT', cuerpo: modulo }); },
      eliminar: function (id) { return pedir('/modulos/' + id, { metodo: 'DELETE' }); },
      reordenar: function (cursoId, ids) { return pedir('/cursos/' + cursoId + '/modulos/reordenar', { metodo: 'PUT', cuerpo: { ids: ids } }); }
    },
    organizaciones: {
      listar: function () { return pedir('/organizaciones'); },
      listarTodas: function () { return pedir('/organizaciones/todas'); },
      crear: function (org) { return pedir('/organizaciones', { metodo: 'POST', cuerpo: org }); },
      actualizar: function (id, org) { return pedir('/organizaciones/' + id, { metodo: 'PUT', cuerpo: org }); },
      eliminar: function (id) { return pedir('/organizaciones/' + id, { metodo: 'DELETE' }); }
    },
    resultados: {
      enviar: function (resultado) { return pedir('/resultados', { metodo: 'POST', cuerpo: resultado }); },
      listar: function (curso) {
        return pedir('/resultados' + (curso ? '?curso=' + encodeURIComponent(curso) : ''));
      },
      resumen: function () { return pedir('/resultados/resumen'); }
    },
    epja: {
      estudiantes: {
        listar: function (opts) {
          opts = opts || {};
          var qs = new URLSearchParams();
          if (opts.q) qs.set('q', opts.q);
          if (opts.activo !== undefined && opts.activo !== null && opts.activo !== '') qs.set('activo', String(opts.activo));
          var sufijo = qs.toString() ? ('?' + qs.toString()) : '';
          return pedir('/epja/estudiantes' + sufijo);
        },
        crear: function (estudiante) { return pedir('/epja/estudiantes', { metodo: 'POST', cuerpo: estudiante }); },
        actualizar: function (id, estudiante) { return pedir('/epja/estudiantes/' + id, { metodo: 'PUT', cuerpo: estudiante }); },
        eliminar: function (id) { return pedir('/epja/estudiantes/' + id, { metodo: 'DELETE' }); },
        asignarMaterias: function (id, materias) { return pedir('/epja/estudiantes/' + id + '/materias', { metodo: 'PUT', cuerpo: { materias: materias } }); },
        importar: function (filas) { return pedir('/epja/estudiantes/importar', { metodo: 'POST', cuerpo: { filas: filas } }); },
        resetClave: function (id, clave) { return pedir('/epja/estudiantes/' + id + '/reset-clave', { metodo: 'POST', cuerpo: { clave: clave } }); }
      },
      materias: {
        listar: function () { return pedir('/epja/materias'); },
        crear: function (materia) { return pedir('/epja/materias', { metodo: 'POST', cuerpo: materia }); },
        actualizar: function (id, materia) { return pedir('/epja/materias/' + id, { metodo: 'PUT', cuerpo: materia }); }
      },
      modulos: {
        listarMateria: function (materiaId) { return pedir('/epja/materias/' + materiaId + '/modulos'); },
        crear: function (materiaId, modulo) { return pedir('/epja/materias/' + materiaId + '/modulos', { metodo: 'POST', cuerpo: modulo }); },
        actualizar: function (id, modulo) { return pedir('/epja/modulos/' + id, { metodo: 'PUT', cuerpo: modulo }); },
        eliminar: function (id) { return pedir('/epja/modulos/' + id, { metodo: 'DELETE' }); },
        reordenar: function (materiaId, ids) { return pedir('/epja/materias/' + materiaId + '/modulos/reordenar', { metodo: 'PUT', cuerpo: { ids: ids } }); }
      }
    }
  };
})();
