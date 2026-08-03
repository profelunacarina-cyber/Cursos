<script setup>
import { computed, onMounted, ref } from 'vue';
import SiteNavbar from './components/SiteNavbar.vue';
import TerritorialMap from './components/TerritorialMap.vue';
import AdminCourses from './components/AdminCourses.vue';
import AdminEpja from './components/AdminEpja.vue';
import LoginEpja from './components/LoginEpja.vue';
import AulaEpja from './components/AulaEpja.vue';
import PerfilEpja from './components/PerfilEpja.vue';
import { ArrowRight, Instagram, MapMarker, Whatsapp } from '@primeicons/vue';

const vista = ref(location.hash || '#inicio');
const organizaciones = ref([]);
const cargando = ref(false);
const respaldo = [{
  nombre: 'Accionar', tipo: 'Asociación civil', localidad: 'Rawson', zona: 'VIRCH',
  descripcion: 'Asociación civil sin fines de lucro con base en Rawson que trabaja en la intersección entre economía del cuidado, género y economía popular. Acompaña a mujeres y personas en situación de vulnerabilidad con talleres, capacitaciones y articulación con políticas públicas, desde una perspectiva de derechos y autonomía.',
  tags: ['Economía del cuidado', 'Género', 'Economía popular'],
  lat: -43.3002, lng: -65.1023, destacado: true
}];

const esVitrina = computed(() => vista.value === '#vitrina' || vista.value === '#mapa');
const esMapa = computed(() => vista.value === '#mapa');
const esAdmin = computed(() => vista.value === '#admin');
const esAdminEpja = computed(() => vista.value === '#admin-epja');
const esLogin = computed(() => vista.value === '#login');
const esAula = computed(() => vista.value === '#aula');
const esPerfil = computed(() => vista.value === '#perfil');

async function cargarVitrina() {
  if (organizaciones.value.length || cargando.value) return;
  cargando.value = true;
  try {
    const respuesta = await fetch('/api/organizaciones');
    if (!respuesta.ok) throw new Error('No disponible');
    organizaciones.value = await respuesta.json();
  } catch {
    organizaciones.value = respaldo;
  } finally {
    cargando.value = false;
  }
}

function cambiarVista() {
  vista.value = location.hash || '#inicio';
  if (vista.value === '#vitrina' || vista.value === '#mapa') cargarVitrina();
}

onMounted(() => {
  addEventListener('hashchange', cambiarVista);
  cambiarVista();
});
</script>

<template>
  <SiteNavbar />

  <main v-if="esLogin"><LoginEpja /></main>
  <main v-else-if="esAula"><AulaEpja /></main>
  <main v-else-if="esPerfil"><PerfilEpja /></main>
  <main v-else-if="esAdminEpja"><AdminEpja /></main>
  <main v-else-if="esAdmin"><AdminCourses /></main>
  <main v-else-if="!esVitrina">
    <section id="inicio" class="hero">
      <div class="hero-content">
        <span class="eyebrow">Capacitaciones gratuitas en línea · Ciclo 2026</span>
        <h1>Que el saber sea <em>bien común</em></h1>
        <p>Herramientas concretas para el aula, a tu ritmo y con constancia.</p>
      </div>
    </section>

    <section class="intro">
      <span class="section-label">Educación de jóvenes y adultos</span>
      <h2>Para estudiantes de la EPJA N° 753 de Rawson</h2>
      <p>Material complementario para reforzar lo que vemos en clase, con recursos claros y accesibles para acompañar la trayectoria de cada estudiante.</p>
      <div class="chips"><span>100% gratuito</span><span>A tu ritmo</span><span>Desde el celular</span><span>Autoevaluación</span><span>Con constancia</span></div>
      <a class="button button-icon" href="#login">Ingresar al aula EPJA <ArrowRight :size="16" aria-hidden="true" /></a>
    </section>

    <section id="sobre-mi" class="about">
      <img :src="'/assets/laurel-garland.svg'" alt="" class="laurel" aria-hidden="true">
      <div class="about-card"><div class="about-photo"><img :src="'/assets/carina.png'" alt="Carina Luna"></div><div><span class="section-label">Sobre mí</span><h2>Carina Luna, docente</h2><p>Soy Carina Luna, docente de <strong>Economía y Administración</strong>. Acompaño a jóvenes y adultos en la <strong>EPJA N° 753 de Rawson</strong> y a quienes deciden emprender un proyecto propio.</p><p>Me estoy formando en la <strong>Maestría en Economía Social, Comunitaria y Solidaria</strong>, un enfoque que entiende la economía como algo que sucede entre personas y comunidades, no solo entre empresas y consumidores. Desde ahí pienso estos dos espacios: uno para el aula y el emprendimiento, otro para las organizaciones que sostienen la vida en común en el territorio.</p><p>Los cursos son y van a seguir siendo <strong>gratuitos</strong>. Si te resultó útil y querés colaborar para que llegue a más personas, podés hacer un aporte solidario al finalizar. Los fondos se destinan a financiar emprendimientos de mujeres y fortalecer organizaciones del tercer sector que trabajan por una economía más justa en el territorio.</p></div></div>
    </section>
  </main>

  <main v-else id="vitrina" class="vitrina">
    <section class="vitrina-hero">
      <span class="section-label">Vitrina territorial · Rawson · VIRCH · Chubut</span>
      <h1 v-if="!esMapa">Un espacio para que <em>el territorio</em> se vea</h1>
      <h1 v-else>Mapa territorial de <em>organizaciones</em></h1>
      <p>Emprendimientos y organizaciones comunican lo que hacen, sin intermediarios.</p>
      <a v-if="!esMapa" class="button secondary" href="#mapa">Ver mapa territorial</a>
      <a v-else class="button secondary" href="#vitrina">Ver listado</a>
    </section>
    <section v-if="esMapa" class="orgs map-section"><TerritorialMap :organizaciones="organizaciones" /></section>
    <section v-else class="orgs"><h2>Organizaciones en la vitrina</h2><p v-if="cargando">Cargando organizaciones…</p>
      <div v-else class="org-grid"><article v-for="org in organizaciones" :key="org.id || org.nombre" class="org-card"><small>{{ org.tipo }} · {{ org.zona }}</small><h3>{{ org.nombre }}</h3><p class="location"><MapMarker :size="16" aria-hidden="true" /> {{ org.localidad }}</p><p>{{ org.descripcion }}</p><div class="chips"><span v-for="tag in org.tags" :key="tag">{{ tag }}</span></div></article></div>
    </section>
  </main>

  <footer><img class="footer-mark" :src="'/favicon.png?v=20260728'" alt="Marca Profe Luna"><div class="footer-copy"><p>Que el saber sea bien común.</p><small class="footer-meta">Rawson · Chubut · Ciclo 2026 — Prof. Carina Luna · profeluna.ar</small><small>© 2026 Carina Luna · profeluna.ar · Todos los derechos reservados y los izquierdos bien puestos.</small></div><div class="sociales"><a href="https://instagram.com/profelunacarina" target="_blank" rel="noopener" aria-label="Instagram de Profe Luna"><Instagram :size="25" aria-hidden="true" /></a><a href="https://wa.me/" target="_blank" rel="noopener" aria-label="WhatsApp de Profe Luna"><Whatsapp :size="25" aria-hidden="true" /></a></div></footer>
</template>

<style scoped>
.sociales { flex-direction:row; gap:14px; }
.sociales a { display:grid; place-items:center; width:40px; height:40px; color:var(--crema); }
.sociales svg { width:25px; height:25px; stroke:none; }
.sociales a:hover { color:var(--ocre); }
</style>
