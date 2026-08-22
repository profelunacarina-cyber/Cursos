<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { Bars, Times } from '@primeicons/vue';

const activoEpja = ref(Boolean(sessionStorage.getItem('profeluna_epja_token')));
const activoAdmin = ref(Boolean(sessionStorage.getItem('profeluna_token')));
const hashActual = ref(location.hash || '#inicio');
const menuAbierto = ref(false);
const activo = computed(() => activoEpja.value || activoAdmin.value);
const esLogin = computed(() => hashActual.value === '#login');
const mostrarSesionActiva = computed(() => activo.value && !esLogin.value);
const destino = computed(() => activoEpja.value && !esLogin.value ? '#aula' : '#login');

function sincronizarSesion() {
  activoEpja.value = Boolean(sessionStorage.getItem('profeluna_epja_token'));
  activoAdmin.value = Boolean(sessionStorage.getItem('profeluna_token'));
}

function sincronizarHash() {
  hashActual.value = location.hash || '#inicio';
  menuAbierto.value = false;
}

function cerrarMenu() {
  menuAbierto.value = false;
}

function alternarMenu() {
  menuAbierto.value = !menuAbierto.value;
}

function salir(event) {
  cerrarMenu();
  if (!mostrarSesionActiva.value) return;
  event.preventDefault();
  sessionStorage.removeItem('profeluna_epja_token');
  sessionStorage.removeItem('profeluna_token');
  sincronizarSesion();
  location.hash = '#inicio';
}

onMounted(() => {
  addEventListener('hashchange', sincronizarHash);
  addEventListener('epja-session', sincronizarSesion);
  addEventListener('admin-session', sincronizarSesion);
});
onUnmounted(() => {
  removeEventListener('hashchange', sincronizarHash);
  removeEventListener('epja-session', sincronizarSesion);
  removeEventListener('admin-session', sincronizarSesion);
});
</script>

<template>
  <header class="site-header">
    <a href="#inicio" class="brand" aria-label="Inicio de Prof. Carina Luna">
      <img class="brand-mark" :src="'/favicon.png?v=20260728'" alt="" />
      <span class="brand-text"><strong>Capacitaciones</strong><small>Prof. Carina Luna</small></span>
    </a>
    <button
      class="nav-toggle"
      type="button"
      aria-controls="site-nav"
      :aria-expanded="menuAbierto"
      :aria-label="menuAbierto ? 'Cerrar menu' : 'Abrir menu'"
      @click="alternarMenu"
    >
      <Times v-if="menuAbierto" :size="18" aria-hidden="true" />
      <Bars v-else :size="18" aria-hidden="true" />
    </button>
    <nav id="site-nav" class="site-nav" :class="{ abierta: menuAbierto }" aria-label="Navegación principal">
      <a href="#inicio" @click="cerrarMenu">Inicio</a>
      <a href="#vitrina" @click="cerrarMenu">Vitrina</a>
      <a href="#sobre-mi" @click="cerrarMenu">Sobre mí</a>
      <a v-if="activoEpja && !esLogin" href="#perfil" @click="cerrarMenu">Mi perfil</a>
      <a :href="destino" @click="salir">{{ mostrarSesionActiva ? 'Logout' : 'Login' }}</a>
    </nav>
  </header>
</template>
