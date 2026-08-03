(function() {
  'use strict';

  var KEY = 'epja753_modo';

  function getModo() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setModo(m) {
    try { localStorage.setItem(KEY, m); } catch (e) {}
    aplicarBanner(m);
  }

  function limpiarModo() {
    try { localStorage.removeItem(KEY); } catch (e) {}
    aplicarBanner(null);
  }

  function aplicarBanner(m) {
    var banner = document.getElementById('mode-banner');
    if (!banner) return;
    banner.classList.remove('estudiante', 'emprendedor');
    if (m === 'estudiante') {
      banner.classList.add('estudiante');
      banner.innerHTML = '<strong>Modo estudiante.</strong> Al final del recorrido vas a hacer la autoevaluación para acreditar la unidad. <a href="#" onclick="EPJA.cambiarModo(event)">Cambiar modo</a>';
    } else if (m === 'emprendedor') {
      banner.classList.add('emprendedor');
      banner.innerHTML = '<strong>Modo emprendedor.</strong> Al final vas a armar tu propio plan de precios. <a href="#" onclick="EPJA.cambiarModo(event)">Cambiar modo</a>';
    }
  }

  function ajustarBotonFinal() {
    var btn = document.getElementById('ruta-final-btn');
    if (!btn) return;
    var m = getModo();
    if (m === 'emprendedor') {
      btn.href = 'plan-personal.html';
      btn.textContent = 'Armar mi plan de precios →';
    } else {
      btn.href = 'evaluacion.html';
      btn.textContent = 'Hacer la autoevaluación →';
    }
  }

  function toggleNav() {
    var nav = document.querySelector('.nav');
    if (nav) nav.classList.toggle('open');
  }

  function cambiarModo(e) {
    if (e) e.preventDefault();
    if (confirm('¿Querés volver a elegir el modo? Vas a ir a la página principal.')) {
      limpiarModo();
      window.location.href = 'index.html';
    }
    return false;
  }

  window.EPJA = {
    setModo: setModo,
    getModo: getModo,
    limpiarModo: limpiarModo,
    cambiarModo: cambiarModo,
    toggleNav: toggleNav
  };

  document.addEventListener('DOMContentLoaded', function() {
    aplicarBanner(getModo());
    ajustarBotonFinal();
  });
})();
