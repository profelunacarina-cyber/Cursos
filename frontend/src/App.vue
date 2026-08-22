<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import SiteNavbar from './components/SiteNavbar.vue';
import TerritorialMap from './components/TerritorialMap.vue';
import AdminCourses from './components/AdminCourses.vue';
import AdminEpja from './components/AdminEpja.vue';
import LoginEpja from './components/LoginEpja.vue';
import AulaEpja from './components/AulaEpja.vue';
import PerfilEpja from './components/PerfilEpja.vue';
import { ArrowRight, Instagram, Linkedin, MapMarker, Whatsapp } from '@primeicons/vue';

function sesionAdminLocalActiva() {
  const token = sessionStorage.getItem('profeluna_token');
  if (!token) return false;
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const base64Completa = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(base64Completa), caracter => caracter.charCodeAt(0));
    const datos = JSON.parse(new TextDecoder().decode(bytes));
    const activa = datos.tipo === 'admin' && Number(datos.exp) * 1000 > Date.now();
    if (!activa) sessionStorage.removeItem('profeluna_token');
    return activa;
  } catch {
    sessionStorage.removeItem('profeluna_token');
    return false;
  }
}

function vistaPermitida(hash) {
  return hash === '#admin-epja' && !sesionAdminLocalActiva() ? '#admin' : hash;
}

function reemplazarHash(hash) {
  history.replaceState(history.state, '', `${location.pathname}${location.search}${hash}`);
}

const hashInicial = location.hash || '#inicio';
const vista = ref(vistaPermitida(hashInicial));
if (vista.value !== hashInicial) reemplazarHash(vista.value);
const organizaciones = ref([]);
const cargando = ref(false);
const sesionEpjaActiva = ref(Boolean(sessionStorage.getItem('profeluna_epja_token')));
const sesionAdminActiva = ref(sesionAdminLocalActiva());
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
const esSobreMi = computed(() => vista.value === '#sobre-mi' || vista.value === '#resena-academica');

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
  sesionEpjaActiva.value = Boolean(sessionStorage.getItem('profeluna_epja_token'));
  sesionAdminActiva.value = sesionAdminLocalActiva();
  const solicitada = location.hash || '#inicio';
  vista.value = vistaPermitida(solicitada);
  if (vista.value !== solicitada) reemplazarHash(vista.value);
  if (vista.value === '#vitrina' || vista.value === '#mapa') cargarVitrina();
}

onMounted(() => {
  addEventListener('hashchange', cambiarVista);
  addEventListener('epja-session', cambiarVista);
  addEventListener('admin-session', cambiarVista);
  cambiarVista();
});
onUnmounted(() => {
  removeEventListener('hashchange', cambiarVista);
  removeEventListener('epja-session', cambiarVista);
  removeEventListener('admin-session', cambiarVista);
});
</script>

<template>
  <SiteNavbar />

  <main v-if="esLogin"><LoginEpja /></main>
  <main v-else-if="esAula"><AulaEpja /></main>
  <main v-else-if="esPerfil"><PerfilEpja /></main>
  <main v-else-if="esAdminEpja"><AdminEpja /></main>
  <main v-else-if="esAdmin"><AdminCourses /></main>
  <main v-else-if="esSobreMi" class="profile-page">
    <section id="sobre-mi" class="about about-detail">
      <img :src="'/assets/laurel-garland.svg'" alt="" class="laurel" aria-hidden="true">
      <div class="about-card">
        <div class="about-photo"><img :src="'/assets/carina.png'" alt="Carina Luna"></div>
        <div class="about-copy">
          <span class="section-label">Sobre mí</span>
          <h1>Carina Luna, docente</h1>
          <p>Soy Carina Luna, docente de <strong>Economía y Administración</strong>. Acompaño a jóvenes y adultos en la <strong>EPJA N° 753 de Rawson</strong> y a quienes se animan a emprender un proyecto propio. Me estoy formando en la <strong>Maestría en Economía Social, Comunitaria y Solidaria</strong>: un enfoque que entiende la economía como algo que pasa entre personas y comunidades, no solo entre empresas y consumidores.</p>
          <p>Mi manera de enseñar parte de la trayectoria de vida de cada estudiante: desde ahí, juntos, vamos armando el recorrido del saber específico. La experiencia que traés —de tu trabajo, de tu casa o de tu barrio— no es el punto de llegada: es el punto de partida.</p>
          <p>Los cursos y capacitaciones son gratuitos. Solo la constancia que certifica que cursaste y aprobaste tiene una contribución, y esa contribución alimenta un <strong>fondo rotativo solidario</strong>: cada aporte financia un emprendimiento de mujeres o el fortalecimiento de una organización del tercer sector y, al devolverse, vuelve a estar disponible para el próximo proyecto del territorio.</p>
        </div>
      </div>
    </section>

    <section id="resena-academica" class="academic-profile">
      <div class="academic-profile-inner">
        <header class="academic-profile-head">
          <span class="section-label">Perfil académico y profesional</span>
          <h2>Carina Luna — Reseña académica</h2>
        </header>

        <div class="academic-profile-copy">
          <p>Carina Luna es profesora de Economía y Administración. Se desempeña en la Escuela N° 753 de Rawson, con amplio recorrido y experiencia en escuelas de la modalidad de Educación Permanente de Jóvenes y Adultos (EPJA) del Valle Inferior del Río Chubut (VIRCH). Es maestranda en la Maestría en Economía Social, Comunitaria y Solidaria (ESCyS) de la Universidad Nacional de Tres de Febrero (UNTREF), donde desarrolla su Trabajo Final Integrador sobre la enseñanza de la Economía Social, Comunitaria y Solidaria en la educación secundaria y, particularmente, en la educación de jóvenes y adultos.</p>

          <p>Su trabajo articula la práctica en el aula con la producción teórica. Desde la lente de la ESCyS —en diálogo con Karl Polanyi (incrustación y doble movimiento), José Luis Coraggio (reproducción ampliada de la vida) y Luis Razeto (factor C), y con los aportes de la economía doméstica sobre el trabajo de cuidados—, sostiene que una enseñanza económica centrada de manera exclusiva en el marco neoclásico deja estructuralmente incumplidas varias de las capacidades generales que prescribe el propio diseño curricular (Res. 497/17, Chubut). La perspectiva de la ESCyS no opera allí como agregado ideológico, sino como el contrapunto epistemológico que cierra esa brecha.</p>

          <p>Sobre esa base construye dos dispositivos andragógicos propios, anclados en Malcolm Knowles y en el aprendizaje situado. El primero, la <strong>andragogía peripatética</strong>, trae el territorio vivo al aula —mediante referentes de organizaciones de la ESCyS— cuando las condiciones no permiten llevar el aula al territorio. El segundo, la <strong>Andragogía de Laboratorio Situado y Ecosistémico</strong>, constituye el aula en un laboratorio donde lo económico-laboral real se reconstruye como un sistema manipulable: a través de simuladores dinámicos que co-diseña con asistencia de inteligencia artificial generativa, el estudiante adulto altera variables y observa consecuencias sobre un mismo sujeto situado en la región, recorriendo distintos registros técnicos —relaciones laborales, liquidación de sueldos y formas organizacionales— sin fundir los contenidos disciplinares. En ambos dispositivos, el contrapunto entre la lógica mercantil y la solidaria funciona como invariante de diseño, y el rigor técnico se sostiene junto al acompañamiento empático y la reflexión biográfica del sujeto que aprende.</p>

          <p>Su producción se organiza en torno al desarrollo local endógeno de Rawson y de la región, sistematizando dicha praxis para que pueda ser replicada o ampliada hacia el resto de la provincia. Un caso situado recurrente, <strong>la elaboración de torta negra galesa en Gaiman</strong>, enhebra la historia de la colonización galesa (1865), el territorio y la lente de la ESCyS.</p>

          <div class="academic-framework">
            <p>En esa misma línea desarrolla actualmente <strong>Matriz Semilla</strong>, una tecnología social de comunicación para organizaciones de la ESCyS. Allí donde el plan de marketing orienta sus estrategias a crear y captar valor para relaciones rentables con los clientes, la Matriz Semilla reconfigura esas variables desde la economía social:</p>
            <ul>
              <li><strong>No hay clientes:</strong> hay comunidad.</li>
              <li><strong>No hay rentabilidad:</strong> hay sustentabilidad del lazo social.</li>
            </ul>
            <p>Surge de reinterpretar qué significa comunicar en una organización social. Gestiona además profeluna.ar, un espacio formativo para estudiantes de la EPJA —en especial como acompañamiento a la semipresencialidad— y de capacitación mediante cursos cortos para emprendedores, organizaciones pertenecientes al tercer sector y personas interesadas en la temática.</p>
          </div>

          <div class="academic-lines">
            <h3>Líneas de trabajo</h3>
            <ul>
              <li>Enseñanza de la Economía Social, Comunitaria y Solidaria</li>
              <li>Andragogía y educación de personas adultas</li>
              <li>Diseño curricular situado y desarrollo local endógeno</li>
              <li>Economía doméstica y trabajo de cuidados</li>
              <li>Comunicación y tecnología social en organizaciones de la ESCyS</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </main>

  <main v-else-if="!esVitrina">
    <section id="inicio" class="hero">
      <div class="hero-content">
        <span class="eyebrow">Cursos y capacitaciones en línea · Ciclo 2026</span>
        <h1>Que el saber sea <em>bien común</em></h1>
        <p>Herramientas concretas para el aula, a tu ritmo y con constancia.</p>
      </div>
    </section>

    <section class="intro">
      <span class="section-label">Educación de jóvenes y adultos</span>
      <h2>Para estudiantes de la EPJA N° 753 de Rawson</h2>
      <p>Fichas didácticas con actividades y trabajos prácticos complementarios a las clases presenciales o semipresenciales, con criterios de accesibilidad para acompañar la trayectoria de cada estudiante.</p>
      <div class="chips"><span>A tu ritmo</span><span>Desde el celular</span><span>Autoevaluación</span><span>Con constancia de aprobación descargable</span></div>
      <div class="home-session-actions">
        <a class="button button-icon" :href="sesionEpjaActiva ? '#aula' : '#login'">
          {{ sesionEpjaActiva ? 'Volver al aula EPJA' : 'Ingresar al aula EPJA' }}
          <ArrowRight :size="16" aria-hidden="true" />
        </a>
        <a v-if="sesionAdminActiva" class="button secondary button-icon" href="#admin">
          Volver al panel admin <ArrowRight :size="16" aria-hidden="true" />
        </a>
      </div>
    </section>

    <section class="about about-summary">
      <img :src="'/assets/laurel-garland.svg'" alt="" class="laurel" aria-hidden="true">
      <div class="about-card">
        <div class="about-photo"><img :src="'/assets/carina.png'" alt="Carina Luna"></div>
        <div class="about-copy">
          <span class="section-label">Sobre mí</span>
          <h2>Carina Luna, docente</h2>
          <p>Soy docente de <strong>Economía y Administración</strong> en la <strong>EPJA N° 753 de Rawson</strong>. Acompaño a jóvenes y adultos desde una enseñanza que parte de sus trayectorias de vida y vincula el saber específico con el aula, el trabajo y el territorio.</p>
          <p>Me estoy formando en la <strong>Maestría en Economía Social, Comunitaria y Solidaria</strong> y desarrollo propuestas para estudiantes, emprendimientos y organizaciones de la región.</p>
          <a class="academic-link" href="#sobre-mi">Conocer mi trayectoria <ArrowRight :size="16" aria-hidden="true" /></a>
        </div>
      </div>
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

  <footer><img class="footer-mark" :src="'/favicon.png?v=20260728'" alt="Marca Profe Luna"><div class="footer-copy"><p>Que el saber sea bien común.</p><small class="footer-meta">Rawson · Chubut · Ciclo 2026 — Prof. Carina Luna · profeluna.ar</small><small>© 2026 Carina Luna · profeluna.ar · Todos los derechos reservados y los izquierdos bien puestos.</small></div><div class="sociales"><a href="https://instagram.com/profelunacarina" target="_blank" rel="noopener" aria-label="Instagram de Profe Luna"><Instagram :size="25" aria-hidden="true" /></a><a href="https://www.linkedin.com/in/carina-mar%C3%ADa-sol-luna" target="_blank" rel="noopener" aria-label="LinkedIn de Carina Luna"><Linkedin :size="25" aria-hidden="true" /></a><a href="https://wa.me/" target="_blank" rel="noopener" aria-label="WhatsApp de Profe Luna"><Whatsapp :size="25" aria-hidden="true" /></a></div></footer>
</template>

<style scoped>
.sociales { flex-direction:row; gap:14px; }
.sociales a { display:grid; place-items:center; width:40px; height:40px; color:var(--crema); }
.sociales svg { width:25px; height:25px; stroke:none; }
.sociales a:hover { color:var(--ocre); }
.home-session-actions { display:flex; flex-wrap:wrap; gap:10px; }
</style>
