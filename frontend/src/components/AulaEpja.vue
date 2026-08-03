<script setup>
import { onMounted, ref } from 'vue';

const materias = ref([]);
const error = ref('');
const token = sessionStorage.getItem('profeluna_epja_token') || '';

function rutaMateria(materia) {
  return `/epja/materia.html?codigo=${encodeURIComponent(materia.codigo)}`;
}

async function cargar() {
  if (!token) {
    location.hash = '#login';
    return;
  }
  const respuesta = await fetch('/api/epja/alumno/materias', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      sessionStorage.removeItem('profeluna_epja_token');
      dispatchEvent(new Event('epja-session'));
      location.hash = '#login';
      return;
    }
    const datos = await respuesta.json().catch(() => ({}));
    throw new Error(datos.error || 'No se pudo cargar el aula.');
  }
  materias.value = await respuesta.json();
}

onMounted(() => cargar().catch(e => { error.value = e.message || 'No se pudo cargar el aula.'; }));
</script>

<template>
  <section class="aula-wrap">
    <div class="admin-head">
      <div><span class="section-label">Aula EPJA</span><h1>Mis materias</h1><p>Elegí una materia para continuar tu recorrido.</p></div>
      <a class="button secondary" href="#perfil">Mi perfil</a>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div class="org-grid">
      <a v-for="materia in materias" :key="materia.id" class="org-card aula-card" :href="rutaMateria(materia)">
        <small>{{ materia.codigo }}</small><h2>{{ materia.nombre }}</h2><p>{{ materia.descripcion }}</p>
        <strong>{{ materia.modulosCompletados || 0 }} de {{ materia.totalModulos || 0 }} módulos completados</strong>
      </a>
    </div>
  </section>
</template>

<style scoped>
.aula-wrap { max-width:980px; margin:auto; padding:60px 24px; }
.aula-card { display:grid; color:inherit; text-decoration:none; transition:border-color .18s ease, transform .18s ease; }
.aula-card:hover { border-color:var(--verde); transform:translateY(-2px); }

@media (max-width:720px) {
  .aula-wrap { padding:48px 24px; }
  .admin-head { margin-bottom:22px; }
}
</style>
