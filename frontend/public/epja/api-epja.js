(function () {
  'use strict';

  var CLAVE = 'profeluna_epja_token';
  var token = '';
  try { token = sessionStorage.getItem(CLAVE) || ''; } catch (e) {}

  function base() {
    return window.PROFELUNA_API || '/api';
  }

  function pedir(ruta, opciones) {
    opciones = opciones || {};
    var headers = {};
    if (opciones.cuerpo) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(base() + ruta, {
      method: opciones.metodo || 'GET',
      headers: headers,
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

  function descargarArchivo(ruta) {
    var destino = /^https?:\/\//i.test(ruta) ? ruta : new URL(ruta, location.origin).href;
    return fetch(destino, { headers: token ? { Authorization: 'Bearer ' + token } : {} })
      .then(function (respuesta) {
        if (respuesta.ok) {
          return respuesta.blob().then(function (contenido) {
            return { contenido: contenido, disposicion: respuesta.headers.get('Content-Disposition') || '' };
          });
        }
        return respuesta.json().catch(function () { return {}; }).then(function (datos) {
          var error = new Error(datos.error || 'No se pudo descargar el archivo');
          error.estado = respuesta.status;
          throw error;
        });
      });
  }

  function salir() {
    token = '';
    try { sessionStorage.removeItem(CLAVE); } catch (e) {}
    location.href = '/#login';
  }

  function enlaceNav(texto, href, activa) {
    var link = document.createElement('a');
    link.href = href;
    link.textContent = texto;
    if (activa) link.className = 'activa';
    return link;
  }

  function pintarNavMaterias(nav, materias, opciones) {
    opciones = opciones || {};
    var contenedor = typeof nav === 'string' ? document.querySelector(nav) : nav;
    if (!contenedor) return;
    contenedor.textContent = '';
    contenedor.appendChild(enlaceNav('Inicio', 'index.html', opciones.activa === 'inicio'));
    (materias || []).forEach(function (materia) {
      var codigo = String(materia.codigo || '').toLowerCase();
      contenedor.appendChild(enlaceNav(
        String(materia.campo || materia.codigo || '').toUpperCase() + ' · ' + String(materia.nombre || ''),
        'materia.html?codigo=' + encodeURIComponent(materia.codigo),
        opciones.activaCodigo && String(opciones.activaCodigo).toLowerCase() === codigo
      ));
    });
    contenedor.appendChild(enlaceNav('Bibliografía', 'bibliografia.html', opciones.activa === 'bibliografia'));
    contenedor.appendChild(enlaceNav('Mi perfil', '/#perfil', false));

    var boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Cerrar sesión';
    boton.addEventListener('click', salir);
    contenedor.appendChild(boton);
    fijarMenuMobile(false);
  }

  function controlesMenuMobile() {
    return {
      boton: document.getElementById('epja-menu-toggle'),
      nav: document.getElementById('epja-nav')
    };
  }

  function fijarMenuMobile(abierto) {
    var controles = controlesMenuMobile();
    if (!controles.boton || !controles.nav) return;
    controles.nav.classList.toggle('abierta', abierto);
    controles.boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    controles.boton.setAttribute('aria-label', abierto ? 'Cerrar menu' : 'Abrir menu');
  }

  function inicializarMenuMobile() {
    var controles = controlesMenuMobile();
    if (!controles.boton || !controles.nav || controles.boton.dataset.menuListo === '1') return;
    controles.boton.dataset.menuListo = '1';
    controles.boton.addEventListener('click', function () {
      fijarMenuMobile(controles.boton.getAttribute('aria-expanded') !== 'true');
    });
    controles.nav.addEventListener('click', function (evento) {
      var objetivo = evento.target;
      if (objetivo && objetivo.closest && objetivo.closest('a, button')) fijarMenuMobile(false);
    });
    addEventListener('resize', function () {
      if (innerWidth > 720) fijarMenuMobile(false);
    });
  }

  window.EPJAApi = {
    sesion: {
      activa: function () { return Boolean(token); },
      entrar: function (dni, password) {
        return pedir('/epja/auth/login', { metodo: 'POST', cuerpo: { dni: dni, password: password } })
          .then(function (d) {
            token = d.token;
            try { sessionStorage.setItem(CLAVE, token); } catch (e) {}
            return d.estudiante;
          });
      },
      yo: function () { return pedir('/epja/auth/yo'); },
      salir: salir
    },
    alumno: {
      materias: function () { return pedir('/epja/alumno/materias'); },
      materia: function (codigo) { return pedir('/epja/alumno/materias/' + encodeURIComponent(codigo)); },
      modulo: function (id) { return pedir('/epja/alumno/modulos/' + id); },
      completar: function (id) { return pedir('/epja/alumno/modulos/' + id + '/completar', { metodo: 'POST' }); },
      responderAutoevaluacion: function (id, respuestas) { return pedir('/epja/alumno/modulos/' + id + '/autoevaluacion', { metodo: 'POST', cuerpo: { respuestas: respuestas } }); },
      certificado: function (id) { return pedir('/epja/alumno/modulos/' + id + '/certificado'); },
      descargarArchivo: descargarArchivo
    },
    ui: {
      pintarNavMaterias: pintarNavMaterias
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarMenuMobile);
  } else {
    inicializarMenuMobile();
  }
})();
