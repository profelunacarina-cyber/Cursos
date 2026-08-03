<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { ArrowRight, Book, FileEdit, PlusCircle, Trash } from '@primeicons/vue';
import RichTextEditor from './RichTextEditor.vue';
import EvaluationBuilder from './EvaluationBuilder.vue';

interface Curso {
  id?: number;
  seccion: string;
  etiqueta: string;
  titulo: string;
  descripcion: string;
  estado: 'disponible' | 'proximamente' | 'preparacion' | 'externo';
  enlace: string;
  textoEnlace: string;
  metas: string[];
  metasTexto?: string;
  destacado: boolean;
  insignia: string;
  nModulos?: number;
}

interface Modulo {
  id?: number;
  titulo: string;
  contenido: string | { t: string, v: string }[];
  palabras?: number;
}

interface OpcionPregunta {
  texto: string;
  correcta: boolean;
}

interface Pregunta {
  id: string;
  enunciado: string;
  tipo: 'verdadero_falso' | 'opcion_multiple';
  opciones: OpcionPregunta[];
}

interface ConfiguracionEvaluacion {
  preguntas: Pregunta[];
  fuenteHtml?: string;
}

interface RecursoBase {
  id?: number;
  titulo: string;
  contenidoHtml: string;
  activo: boolean;
}

interface RecursoEvaluacion extends RecursoBase {
  tipo: 'evaluacion';
  configuracion: ConfiguracionEvaluacion;
}

interface RecursoHerramienta extends RecursoBase {
  tipo: 'herramienta';
  configuracion: {
    fuenteHtml?: string;
    [key: string]: any;
  };
}

type Recurso = RecursoEvaluacion | RecursoHerramienta;

const token = ref<string>(sessionStorage.getItem('profeluna_token') || '');
const cursos = ref<Record<string, Curso[]>>({});
const error = ref<string>('');
const email = ref<string>('');
const password = ref<string>('');
const cursoSeleccionado = ref<Curso | null>(null);
const pestaña = ref<'datos' | 'modulos' | 'recursos'>('datos');
const modulos = ref<Modulo[]>([]);
const recursos = ref<Recurso[]>([]);
const cursoEditando = ref<Curso | null>(null);
const moduloEditando = ref<Modulo | null>(null);
const recursoEditando = ref<Recurso | null>(null);

// Constantes
const secciones = ['ruta', 'transversales', 'matriz', 'proximas'];

const headers = () => ({ Authorization: `Bearer ${token.value}`, 'Content-Type': 'application/json' });
const cursoVacio = seccion => ({ seccion, etiqueta: '', titulo: '', descripcion: '', estado: 'proximamente', enlace: '', textoEnlace: '', metasTexto: '', destacado: false, insignia: '' });

function leerError(datos, alternativa) { return datos?.error || alternativa; }

function contenidoTexto(contenido) {
  if (typeof contenido === 'string') return contenido; // Ya es HTML
  if (Array.isArray(contenido)) return contenido.map(b => b?.v || b?.texto || '').join('\n');
  return '';
}

function contenidoHeredado(fuente = '') {
  if (!fuente) return '';
  const doc = new DOMParser().parseFromString(fuente, 'text/html');
  doc.querySelectorAll('script, style, header, footer, nav, form, button, svg, noscript').forEach(n => n.remove());
  const principal = doc.querySelector('main, article, .contenido, .curso-contenido') || doc.body;
  return principal.innerHTML.trim();
}

function configuracionRecurso(configuracion, tipo) {
  const base = configuracion && typeof configuracion === 'object' ? { ...configuracion } : {};
  if (tipo !== 'evaluacion') return base;
  base.preguntas = Array.isArray(base.preguntas) ? base.preguntas.map((pregunta, indice) => ({
    id: pregunta.id || `pregunta-${indice + 1}`,
    enunciado: String(pregunta.enunciado || ''),
    tipo: pregunta.tipo === 'verdadero_falso' ? 'verdadero_falso' : 'opcion_multiple',
    opciones: Array.isArray(pregunta.opciones) && pregunta.opciones.length >= 2 ? pregunta.opciones.map(opcion => ({ texto: String(opcion.texto || ''), correcta: Boolean(opcion.correcta) })) : [{ texto: '', correcta: true }, { texto: '', correcta: false }]
  })) : [];
  return base;
}

async function cargarCursos() {
  const respuesta = await fetch('/api/cursos');
  const datos = await respuesta.json();
  if (!respuesta.ok) throw new Error(leerError(datos, 'No se pudieron cargar los cursos.'));
  cursos.value = datos;
}

async function cargarContenido(curso: Curso) {
  const [respuestaModulos, respuestaRecursos] = await Promise.all([ // Carga módulos y recursos en paralelo
    fetch(`/api/cursos/${curso.id}/modulos`),
    fetch(`/api/cursos/${curso.id}/recursos/todos`, { headers: headers() })
  ]);
  modulos.value = respuestaModulos.ok ? await respuestaModulos.json() : [];
  recursos.value = respuestaRecursos.ok ? await respuestaRecursos.json() : [];
}

async function seleccionarCurso(curso: Curso, tab = 'datos') {
  error.value = '';
  cursoSeleccionado.value = curso;
  pestaña.value = tab as 'datos' | 'modulos' | 'recursos';
  cursoEditando.value = { ...curso, metasTexto: (curso.metas || []).join(', ') };
  moduloEditando.value = null;
  recursoEditando.value = null;
  try { await cargarContenido(curso); } catch (e) { error.value = e.message; }
}


async function entrar() {
  error.value = '';
  const respuesta = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value, password: password.value }) });
  const datos = await respuesta.json();
  if (!respuesta.ok) { error.value = leerError(datos, 'No se pudo ingresar.'); return; } // Error de login
  token.value = datos.token;
  sessionStorage.setItem('profeluna_token', datos.token);
  dispatchEvent(new Event('admin-session'));
  try { await cargarCursos(); } catch (e) { error.value = e.message; }
}


async function guardarCurso() {
  const curso = cursoEditando.value;
  const cuerpo = { ...curso, metas: curso.metasTexto?.split(',').map(x => x.trim()).filter(Boolean) };
  delete cuerpo.metasTexto;
  const ruta = curso.id ? `/api/cursos/${curso.id}` : '/api/cursos';
  const respuesta = await fetch(ruta, { method: curso.id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify(cuerpo) });
  const datos = await respuesta.json();
  if (!respuesta.ok) { error.value = leerError(datos, 'No se pudo guardar el curso.'); return; }
  await cargarCursos(); // Recargar lista de cursos
  await seleccionarCurso(datos, 'datos');
}


async function eliminarCurso(curso: Curso) {
  if (!confirm(`¿Eliminar “${curso.titulo}”? Esta acción no se puede deshacer.`)) return;
  const respuesta = await fetch(`/api/cursos/${curso.id}`, { method: 'DELETE', headers: headers() });
  if (!respuesta.ok) { error.value = 'No se pudo eliminar el curso.'; return; }
  cursoSeleccionado.value = null;
  await cargarCursos();
}

function nuevoCurso(seccion: Seccion) {
  cursoSeleccionado.value = null;
  cursoEditando.value = cursoVacio(seccion);
  pestaña.value = 'datos';
  modulos.value = [];
  recursos.value = [];
}

function nuevoModulo() {
  moduloEditando.value = { titulo: '', contenido: '' };
}

function editarModulo(modulo: Modulo) {
  moduloEditando.value = { ...modulo, contenido: contenidoTexto(modulo.contenido) };
}

async function guardarModulo() {
  const modulo = moduloEditando.value;
  const ruta = modulo.id ? `/api/modulos/${modulo.id}` : `/api/cursos/${cursoSeleccionado.value.id}/modulos`;
  const respuesta = await fetch(ruta, { method: modulo.id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify({ titulo: modulo.titulo, contenido: modulo.contenido }) });
  const datos = await respuesta.json();
  if (!respuesta.ok) { error.value = leerError(datos, 'No se pudo guardar el módulo.'); return; }
  moduloEditando.value = null;
  await cargarContenido(cursoSeleccionado.value);
  await cargarCursos();
}

async function eliminarModulo(modulo: Modulo) {
  if (!confirm(`¿Eliminar el módulo “${modulo.titulo}”?`)) return;
  await fetch(`/api/modulos/${modulo.id}`, { method: 'DELETE', headers: headers() });
  await cargarContenido(cursoSeleccionado.value);
  await cargarCursos();
}

function nuevoRecurso() {
  recursoEditando.value = { tipo: 'evaluacion', titulo: '', contenidoHtml: '', activo: true, configuracion: { preguntas: [] } };
}

function editarRecurso(recurso: Recurso) {
  recursoEditando.value = { ...recurso, contenidoHtml: recurso.contenidoHtml || contenidoHeredado(recurso.configuracion?.fuenteHtml), configuracion: configuracionRecurso(recurso.configuracion, recurso.tipo) };
}

async function guardarRecurso() {
  const recurso = recursoEditando.value;
  if (!recurso) return;
  const ruta = recurso.id ? `/api/recursos/${recurso.id}` : `/api/cursos/${cursoSeleccionado.value.id}/recursos`;
  const respuesta = await fetch(ruta, { method: recurso.id ? 'PUT' : 'POST', headers: headers(), body: JSON.stringify({ tipo: recurso.tipo, titulo: recurso.titulo, contenidoHtml: recurso.contenidoHtml, configuracion: recurso.configuracion, activo: recurso.activo }) });
  const datos = await respuesta.json();
  if (!respuesta.ok) { error.value = leerError(datos, 'No se pudo guardar el recurso.'); return; }
  recursoEditando.value = null;
  await cargarContenido(cursoSeleccionado.value);
}

async function eliminarRecurso(recurso: Recurso) {
  if (!confirm(`¿Eliminar “${recurso.titulo}”?`)) return;
  await fetch(`/api/recursos/${recurso.id}`, { method: 'DELETE', headers: headers() });
  await cargarContenido(cursoSeleccionado.value);
}

function salir() { sessionStorage.removeItem('profeluna_token'); token.value = ''; cursos.value = {}; cursoSeleccionado.value = null; dispatchEvent(new Event('admin-session')); location.hash = '#inicio'; }


onMounted(async () => { if (token.value) { try { await cargarCursos(); } catch (e) { error.value = e.message; } } });
</script>

<template>
  <section class="admin-wrap">
    <form v-if="!token" class="admin-card login" @submit.prevent="entrar">
      <span class="section-label">Administración</span><h1>Hola, Carina</h1><p>Ingresá para administrar los cursos archivados.</p>
      <input v-model="email" type="email" autocomplete="username" placeholder="Email" required><input v-model="password" type="password" autocomplete="current-password" placeholder="Contraseña" required>
      <p v-if="error" class="error">{{ error }}</p><button class="button button-icon">Entrar <ArrowRight :size="16" aria-hidden="true" /></button>
    </form>

    <template v-else>
      <div class="admin-head panel-head"><div><span class="section-label">Administración</span><h1>Cursos archivados</h1><p>Todo queda guardado en la base de datos. Elegí un curso para editar sus datos, módulos y recursos.</p></div><div class="admin-actions"><a class="button secondary" href="#admin-epja">Admin EPJA</a></div></div>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="admin-layout">
        <aside class="course-browser">
          <div class="browser-title"><strong>Catálogo</strong></div>
          <section v-for="seccion in secciones" :key="seccion" class="course-section">
            <div><h2>{{ seccion }}</h2><button class="icon-button" :aria-label="`Agregar curso en ${seccion}`" @click="nuevoCurso(seccion)"><PlusCircle :size="19" /></button></div>
            <button v-for="curso in cursos[seccion] || []" :key="curso.id" class="course-choice" :class="{ selected: cursoSeleccionado?.id === curso.id }" @click="seleccionarCurso(curso)"><strong>{{ curso.titulo }}</strong><small>{{ curso.estado }} · {{ curso.nModulos || 0 }} módulos</small></button>
          </section>
        </aside>

        <section class="course-workspace">
          <div v-if="!cursoEditando" class="empty-state"><Book :size="30" aria-hidden="true" /><h2>Elegí un curso</h2><p>Desde el catálogo podés abrirlo o crear uno nuevo.</p></div>
          <template v-else>
            <div class="workspace-title"><div><span class="section-label">{{ cursoEditando.seccion }}</span><h2>{{ cursoEditando.id ? cursoEditando.titulo : 'Nuevo curso' }}</h2></div><button v-if="cursoEditando.id" class="delete-link" @click="eliminarCurso(cursoEditando)"><Trash :size="15" /> Eliminar curso</button></div>
            <div class="tabs"><button :class="{ active: pestaña === 'datos' }" @click="pestaña = 'datos'">Datos del curso</button><button v-if="cursoEditando.id" :class="{ active: pestaña === 'modulos' }" @click="pestaña = 'modulos'">Módulos ({{ modulos.length }})</button><button v-if="cursoEditando.id" :class="{ active: pestaña === 'recursos' }" @click="pestaña = 'recursos'">Evaluaciones y herramientas ({{ recursos.length }})</button></div>

            <form v-if="pestaña === 'datos'" class="edit-form" @submit.prevent="guardarCurso">
              <label>Sección<select v-model="cursoEditando.seccion"><option v-for="seccion in secciones" :key="seccion">{{ seccion }}</option></select></label>
              <label>Etiqueta<input v-model="cursoEditando.etiqueta" placeholder="Ej.: Estudio de costos"></label>
              <label>Título del curso<input v-model="cursoEditando.titulo" required></label>
              <label>Descripción<textarea v-model="cursoEditando.descripcion" rows="5"></textarea></label>
              <div class="form-grid"><label>Estado<select v-model="cursoEditando.estado"><option>disponible</option><option>proximamente</option><option>preparacion</option><option>externo</option></select></label><label>Metas (separadas por coma)<input v-model="cursoEditando.metasTexto" placeholder="7 módulos, ~25 min"></label></div>
              <div class="form-grid"><label>Enlace externo (si aplica)<input v-model="cursoEditando.enlace" placeholder="https://..."></label><label>Texto del enlace<input v-model="cursoEditando.textoEnlace" placeholder="Abrir curso"></label></div>
              <label class="checkbox-line"><input v-model="cursoEditando.destacado" type="checkbox"> Destacar este curso</label>
              <div class="form-actions"><button class="button">Guardar cambios</button><button v-if="cursoEditando.id" type="button" class="button ghost" @click="seleccionarCurso(cursoSeleccionado)">Deshacer</button></div>
            </form>

            <section v-else-if="pestaña === 'modulos'" class="content-manager">
              <div class="manager-head"><div><h3>Módulos</h3><p>Escribí el contenido directamente y aplicá formato con las herramientas del editor.</p></div><button class="button button-icon" @click="nuevoModulo"><PlusCircle :size="20" /> Agregar módulo</button></div>
              <div v-if="moduloEditando" class="inline-editor"><h3>{{ moduloEditando.id ? 'Editar módulo' : 'Nuevo módulo' }}</h3><label>Título<input v-model="moduloEditando.titulo" required></label><label>Contenido<RichTextEditor v-model="moduloEditando.contenido" /></label><div class="content-preview" v-html="moduloEditando.contenido"></div><div class="form-actions"><button class="button" @click="guardarModulo">Guardar módulo</button><button class="button ghost" @click="moduloEditando = null">Cancelar</button></div></div>
              <article v-for="modulo in modulos" :key="modulo.id" class="managed-row"><div><strong>{{ modulo.titulo }}</strong><small>{{ modulo.palabras }} palabras</small></div><div><button class="row-action" @click="editarModulo(modulo)"><FileEdit :size="15" /> Editar</button><button class="row-action danger" @click="eliminarModulo(modulo)"><Trash :size="15" /></button></div></article><p v-if="!modulos.length && !moduloEditando" class="empty-copy">Este curso todavía no tiene módulos.</p>
            </section>

            <section v-else class="content-manager">
              <div class="manager-head"><div><h3>Evaluaciones y herramientas</h3><p>El contenido heredado se previsualiza como material, no como código HTML.</p></div><button class="button button-icon" @click="nuevoRecurso"><PlusCircle :size="20" /> Agregar recurso</button></div>
              <div v-if="recursoEditando" class="inline-editor"><h3>{{ recursoEditando.id ? 'Editar recurso' : 'Nuevo recurso' }}</h3><div class="form-grid"><label>Tipo<select v-model="recursoEditando.tipo"><option value="evaluacion">Evaluación</option><option value="herramienta">Herramienta</option></select></label><label>Título<input v-model="recursoEditando.titulo" required></label></div><label>Contenido introductorio<RichTextEditor v-model="recursoEditando.contenidoHtml" /></label><EvaluationBuilder v-if="recursoEditando.tipo === 'evaluacion'" v-model="recursoEditando.configuracion" /><div class="content-preview" v-html="recursoEditando.contenidoHtml"></div><label class="checkbox-line"><input v-model="recursoEditando.activo" type="checkbox"> Publicar este recurso</label><div class="form-actions"><button class="button" @click="guardarRecurso">Guardar recurso</button><button class="button ghost" @click="recursoEditando = null">Cancelar</button></div></div>
              <article v-for="recurso in recursos" :key="recurso.id" class="managed-row"><div><strong>{{ recurso.titulo }}</strong><small>{{ recurso.tipo }} · {{ recurso.activo ? 'Publicado' : 'Archivado' }}</small></div><div><button class="row-action" @click="editarRecurso(recurso)"><FileEdit :size="15" /> Editar</button><button class="row-action danger" @click="eliminarRecurso(recurso)"><Trash :size="15" /></button></div></article><p v-if="!recursos.length && !recursoEditando" class="empty-copy">Este curso todavía no tiene evaluaciones ni herramientas.</p>
            </section>
          </template>
        </section>
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel-head { margin-bottom:30px; }.panel-head p { max-width:620px; }.admin-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:12px; }.button.ghost { background:transparent; border:1px solid var(--borde); color:var(--verde); }.admin-layout { display:grid; grid-template-columns:280px minmax(0,1fr); gap:22px; align-items:start; }.course-browser,.course-workspace { border:1px solid var(--borde); border-radius:16px; background:var(--crema); }.course-browser { overflow:hidden; }.browser-title { padding:16px 18px; border-bottom:1px solid var(--borde); }.course-section { padding:13px 10px; border-bottom:1px solid var(--borde); }.course-section:last-child { border-bottom:0; }.course-section > div { display:flex; align-items:center; justify-content:space-between; padding:0 8px 7px; }.course-section h2 { margin:0; font-size:18px; text-transform:capitalize; }.icon-button,.row-action,.delete-link { display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; color:var(--verde); font:600 13px 'Work Sans',sans-serif; cursor:pointer; }.icon-button { padding:6px; border-radius:7px; }.icon-button:hover,.row-action:hover { background:var(--salvia); }.course-choice { display:grid; width:100%; gap:2px; padding:10px 11px; border:0; border-left:3px solid transparent; background:transparent; color:var(--tinta); text-align:left; cursor:pointer; font:inherit; }.course-choice:hover,.course-choice.selected { background:var(--salvia); border-left-color:var(--verde); }.course-choice strong { font-size:13px; }.course-choice small,.managed-row small { color:#746D62; }.course-workspace { min-height:520px; padding:clamp(20px,4vw,34px); }.empty-state { display:grid; place-items:center; align-content:center; min-height:450px; color:#746D62; text-align:center; }.empty-state h2 { color:var(--tinta); margin:12px 0 0; }.empty-state p { margin:4px 0; }.workspace-title,.manager-head,.managed-row { display:flex; align-items:center; justify-content:space-between; gap:16px; }.workspace-title h2,.manager-head h3 { margin:4px 0; }.delete-link { color:#9B3C28; }.tabs { display:flex; gap:8px; overflow:auto; margin:24px 0; border-bottom:1px solid var(--borde); }.tabs button { flex:0 0 auto; padding:11px 4px; border:0; border-bottom:3px solid transparent; background:transparent; color:#746D62; font:600 13px 'Work Sans',sans-serif; cursor:pointer; }.tabs button + button { margin-left:16px; }.tabs button.active { border-bottom-color:var(--verde); color:var(--verde); }.edit-form,.inline-editor { display:grid; gap:17px; }.edit-form label,.inline-editor label { display:grid; gap:6px; color:#4f4a42; font-weight:600; font-size:14px; }.edit-form input,.edit-form textarea,.edit-form select,.inline-editor input,.inline-editor textarea,.inline-editor select { width:100%; padding:11px; border:1px solid var(--borde); border-radius:8px; background:#fffdf7; color:var(--tinta); font:inherit; }.form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }.checkbox-line { display:flex !important; align-items:center; gap:9px !important; }.checkbox-line input { width:auto !important; }.form-actions { display:flex; flex-wrap:wrap; gap:10px; }.content-manager { display:grid; gap:15px; }.manager-head { padding-bottom:14px; border-bottom:1px solid var(--borde); }.manager-head p { max-width:520px; margin:4px 0 0; color:#746D62; font-size:14px; }.inline-editor { padding:20px; border:1px solid #B8C9B5; border-radius:12px; background:#F1F5ED; }.inline-editor h3 { margin:0; }.content-preview { max-height:270px; overflow:auto; padding:18px; border:1px solid var(--borde); border-radius:9px; background:#fffdf7; color:#403b34; line-height:1.6; }.content-preview :deep(h1),.content-preview :deep(h2),.content-preview :deep(h3),.content-preview :deep(h4),.content-preview :deep(h5),.content-preview :deep(h6) { font-family:Fraunces,serif; line-height:1.18; }.content-preview :deep(h1) { font-size:32px; }.content-preview :deep(h2) { font-size:27px; }.content-preview :deep(h3) { font-size:23px; }.content-preview :deep(h4) { font-size:20px; }.content-preview :deep(h5) { font-size:17px; }.content-preview :deep(h6) { font-size:14px; text-transform:uppercase; letter-spacing:.08em; color:#746D62; }.content-preview :deep(blockquote) { border-left:4px solid var(--terracota); background:#fff7f2; border-radius:8px; margin:12px 0; padding:10px 14px; }.content-preview :deep(p:first-child) { margin-top:0; }.managed-row { padding:15px 0; border-bottom:1px solid var(--borde); }.managed-row > div:first-child { display:flex; align-items:baseline; flex-wrap:wrap; gap:10px; }.managed-row > div:last-child { display:flex; gap:6px; }.row-action { padding:7px 8px; border-radius:7px; }.danger { color:#9B3C28; }.empty-copy { color:#746D62; }.button-icon { display:inline-flex; align-items:center; gap:7px; } @media(max-width:760px) { .admin-layout { grid-template-columns:1fr; }.course-browser { max-height:300px; overflow:auto; }.workspace-title,.manager-head { align-items:flex-start; flex-direction:column; }.form-grid { grid-template-columns:1fr; }.admin-actions { justify-content:flex-start; } }
</style>
