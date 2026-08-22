<script setup>
import { onMounted, ref } from 'vue';
import { Key, Save } from '@primeicons/vue';

const token = ref(sessionStorage.getItem('profeluna_epja_token') || '');
const cargando = ref(true);
const guardandoPerfil = ref(false);
const guardandoClave = ref(false);
const error = ref('');
const aviso = ref('');
const perfil = ref({ nombre: '', apellido: '', email: '' });
const claves = ref({ actual: '', nueva: '', repetir: '' });

function headers() {
  return {
    Authorization: `Bearer ${token.value}`,
    'Content-Type': 'application/json'
  };
}

function salirSesion() {
  sessionStorage.removeItem('profeluna_epja_token');
  dispatchEvent(new Event('epja-session'));
  location.hash = '#login';
}

async function cargarPerfil() {
  if (!token.value) {
    salirSesion();
    return;
  }
  const respuesta = await fetch('/api/epja/auth/yo', { headers: headers() });
  const datos = await respuesta.json().catch(() => ({}));
  if (respuesta.status === 401) {
    salirSesion();
    return;
  }
  if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cargar tu perfil.');
  perfil.value = {
    nombre: datos.nombre || '',
    apellido: datos.apellido || '',
    email: datos.email || ''
  };
}

async function guardarPerfil() {
  guardandoPerfil.value = true;
  error.value = '';
  aviso.value = '';
  try {
    const respuesta = await fetch('/api/epja/auth/perfil', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(perfil.value)
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401) {
      salirSesion();
      return;
    }
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo guardar tu perfil.');
    token.value = datos.token;
    sessionStorage.setItem('profeluna_epja_token', datos.token);
    dispatchEvent(new Event('epja-session'));
    aviso.value = 'Perfil actualizado.';
  } catch (e) {
    error.value = e.message;
  } finally {
    guardandoPerfil.value = false;
  }
}

async function cambiarClave() {
  guardandoClave.value = true;
  error.value = '';
  aviso.value = '';
  try {
    if (claves.value.nueva !== claves.value.repetir) throw new Error('La contraseña nueva y la repetición no coinciden.');
    const respuesta = await fetch('/api/epja/auth/password', {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        passwordActual: claves.value.actual,
        passwordNueva: claves.value.nueva
      })
    });
    const datos = await respuesta.json().catch(() => ({}));
    if (respuesta.status === 401) {
      throw new Error(datos.error || 'La contraseña actual no coincide.');
    }
    if (!respuesta.ok) throw new Error(datos.error || 'No se pudo cambiar la contraseña.');
    claves.value = { actual: '', nueva: '', repetir: '' };
    aviso.value = 'Contraseña actualizada.';
  } catch (e) {
    error.value = e.message;
  } finally {
    guardandoClave.value = false;
  }
}

onMounted(() => cargarPerfil().catch(e => { error.value = e.message; }).finally(() => { cargando.value = false; }));
</script>

<template>
  <section class="perfil-wrap">
    <div class="admin-head">
      <div>
        <span class="section-label">Aula EPJA</span>
        <h1>Mi perfil</h1>
        <p>Actualizá tus datos de acceso al aula.</p>
      </div>
      <a class="button secondary" href="#aula">Volver al aula</a>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="aviso" class="notice">{{ aviso }}</p>
    <p v-if="cargando" class="admin-card">Cargando perfil…</p>

    <div v-else class="perfil-grid">
      <form class="admin-card perfil-card" @submit.prevent="guardarPerfil">
        <span class="section-label">Datos personales</span>
        <label>Nombre<input v-model="perfil.nombre" autocomplete="given-name" required></label>
        <label>Apellido<input v-model="perfil.apellido" autocomplete="family-name" required></label>
        <label>Correo<input v-model="perfil.email" type="email" autocomplete="email" placeholder="tu-correo@example.com"></label>
        <button class="button button-icon" :disabled="guardandoPerfil"><Save :size="16" />{{ guardandoPerfil ? 'Guardando…' : 'Guardar perfil' }}</button>
      </form>

      <form class="admin-card perfil-card" @submit.prevent="cambiarClave">
        <span class="section-label">Seguridad</span>
        <label>Contraseña actual<input v-model="claves.actual" type="password" autocomplete="current-password" required></label>
        <label>Nueva contraseña<input v-model="claves.nueva" type="password" autocomplete="new-password" minlength="6" required></label>
        <label>Repetir nueva contraseña<input v-model="claves.repetir" type="password" autocomplete="new-password" minlength="6" required></label>
        <button class="button button-icon" :disabled="guardandoClave"><Key :size="16" />{{ guardandoClave ? 'Guardando…' : 'Cambiar contraseña' }}</button>
      </form>
    </div>
  </section>
</template>

<style scoped>
.perfil-wrap { max-width:980px; margin:auto; padding:60px 24px; }
.perfil-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px; align-items:start; }
.perfil-card { display:grid; gap:15px; }
.perfil-card label { display:grid; gap:6px; font-weight:700; font-size:14px; color:#4f4a42; }
.perfil-card input { width:100%; margin:0; padding:11px; border:1px solid var(--borde); border-radius:8px; background:#fffdf7; font:inherit; }
.notice { padding:10px 14px; border-radius:8px; background:var(--salvia); color:var(--verde); font-weight:600; }
.button-icon { display:inline-flex; align-items:center; justify-content:center; gap:7px; }
@media(max-width:760px) {
  .perfil-grid { grid-template-columns:1fr; }
}
</style>
