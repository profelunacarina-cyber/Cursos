<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  Book,
  Download,
  FileImport,
  FileEdit,
  PlusCircle,
  Search,
  Star,
  Times,
  Trash,
  UserPlus
} from '@primeicons/vue';
import RichTextEditor from './RichTextEditor.vue';
import EvaluationBuilder from './EvaluationBuilder.vue';

const token = sessionStorage.getItem('profeluna_token') || '';
const estudiantes = ref([]);
const materias = ref([]);
const busqueda = ref('');
const pestaña = ref('estudiantes');
const error = ref('');
const aviso = ref('');
const formulario = ref(null);
const archivo = ref(null);
const filasImportacion = ref([]);
const importando = ref(false);
const materiaSeleccionada = ref(null);
const materiaForm = ref(null);
const modulosMateria = ref([]);
const moduloForm = ref(null);
const errorModulo = ref('');
const seccionModulo = ref('contenido');
const estudianteCert = ref('');
const recorrido = ref([]);
const certificadoDescargando = ref(null);

const headers = () => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json'
});

const estudiantesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase();
  return !q
    ? estudiantes.value
    : estudiantes.value.filter(e => `${e.apellido} ${e.nombre} ${e.dni}`.toLowerCase().includes(q));
});

const materiasPorCampo = computed(() => {
  const grupos = new Map();
  materias.value.forEach(materia => {
    const campo = materia.campo || materia.codigo;
    if (!grupos.has(campo)) grupos.set(campo, { campo, materias: [] });
    grupos.get(campo).materias.push(materia);
  });
  return [...grupos.values()];
});

const estudianteVacio = () => ({
  dni: '',
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  activo: true,
  materias: []
});

const materiaVacia = (campo = '') => ({
  campo,
  nombre: '',
  descripcion: '',
  color: '#2E5638',
  orden: materias.value.length + 1,
  activa: true
});

const mensajeError = (d, t) => d?.error || t;

function claveCabecera(k) {
  return String(k || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function valorFila(fila, nombres) {
  const k = Object.keys(fila || {}).find(x => nombres.includes(claveCabecera(x)));
  return k === undefined ? '' : fila[k];
}

function normalizarFila(fila) {
  return {
    dni: String(valorFila(fila, ['dni', 'documento', 'documentoidentidad']) || '').replace(/\D/g, ''),
    nombre: String(valorFila(fila, ['nombre', 'nombres']) || '').trim(),
    apellido: String(valorFila(fila, ['apellido', 'apellidos']) || '').trim(),
    email: String(valorFila(fila, ['email', 'correo', 'correoelectronico']) || '').trim(),
    materias: String(valorFila(fila, ['materias', 'materia', 'curso', 'cursos']) || '').trim(),
    clave_inicial: String(valorFila(fila, ['claveinicial', 'clave', 'password', 'contrasena']) || '').trim(),
    activo: valorFila(fila, ['activo', 'estado'])
  };
}

function filasDesdeMatriz(matriz) {
  const filas = matriz.filter(fila => Array.isArray(fila) && fila.some(celda => String(celda ?? '').trim()));
  if (filas.length < 2) return [];
  const cabeceras = filas[0].map(celda => String(celda ?? '').trim());
  return filas.slice(1).map(fila => Object.fromEntries(
    cabeceras.map((cabecera, indice) => [cabecera, fila[indice] ?? ''])
  ));
}

function parsearCsv(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let entreComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const siguiente = texto[i + 1];
    if (char === '"' && entreComillas && siguiente === '"') {
      celda += '"';
      i++;
    } else if (char === '"') {
      entreComillas = !entreComillas;
    } else if (char === ',' && !entreComillas) {
      fila.push(celda);
      celda = '';
    } else if ((char === '\n' || char === '\r') && !entreComillas) {
      if (char === '\r' && siguiente === '\n') i++;
      fila.push(celda);
      filas.push(fila);
      fila = [];
      celda = '';
    } else {
      celda += char;
    }
  }

  if (celda || fila.length) {
    fila.push(celda);
    filas.push(fila);
  }
  return filasDesdeMatriz(filas);
}

async function leerFilasArchivo(f) {
  if (/\.csv$/i.test(f.name) || f.type.includes('csv')) {
    return parsearCsv(await f.text());
  }
  if (/\.xlsx$/i.test(f.name)) {
    const { default: leerXlsx } = await import('read-excel-file/browser');
    return filasDesdeMatriz(await leerXlsx(f));
  }
  throw new Error('Formato no soportado. Usá .xlsx o .csv.');
}

function normalizarCodigoMateria(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);
}

async function cargar() {
  const [a, b] = await Promise.all([
    fetch('/api/epja/estudiantes', { headers: headers() }),
    fetch('/api/epja/materias', { headers: headers() })
  ]);
  if ([a.status, b.status].some(estado => estado === 401 || estado === 403)) {
    sessionStorage.removeItem('profeluna_token');
    dispatchEvent(new Event('admin-session'));
    location.hash = '#admin';
    return;
  }
  const [da, db] = await Promise.all([a.json(), b.json()]);
  if (!a.ok) throw new Error(mensajeError(da, 'No se pudieron cargar estudiantes.'));
  if (!b.ok) throw new Error(mensajeError(db, 'No se pudieron cargar materias.'));
  estudiantes.value = da;
  materias.value = db;
}

function nuevoEstudiante() {
  formulario.value = estudianteVacio();
  error.value = '';
}

function editarEstudiante(e) {
  formulario.value = { ...e, password: '', materias: [...(e.materias || [])] };
  error.value = '';
}

async function guardarEstudiante() {
  const e = formulario.value;
  const r = await fetch(e.id ? `/api/epja/estudiantes/${e.id}` : '/api/epja/estudiantes', {
    method: e.id ? 'PUT' : 'POST',
    headers: headers(),
    body: JSON.stringify(e)
  });
  const d = await r.json();
  if (!r.ok) {
    error.value = mensajeError(d, 'No se pudo guardar el estudiante.');
    return;
  }
  formulario.value = null;
  aviso.value = e.id ? 'Estudiante actualizado.' : 'Estudiante agregado. La clave inicial es su DNI si no cargaste otra.';
  await cargar();
}

async function eliminarEstudiante(e) {
  if (!confirm(`¿Eliminar a ${e.nombre} ${e.apellido}?`)) return;
  const r = await fetch(`/api/epja/estudiantes/${e.id}`, { method: 'DELETE', headers: headers() });
  if (!r.ok) {
    error.value = 'No se pudo eliminar el estudiante.';
    return;
  }
  aviso.value = 'Estudiante eliminado.';
  await cargar();
}

async function leerPlanilla(evento) {
  const f = evento.target.files?.[0];
  if (!f) return;
  error.value = '';
  archivo.value = f;
  try {
    const filas = (await leerFilasArchivo(f)).map(normalizarFila);
    if (!filas.length) throw new Error('La primera hoja no tiene filas de estudiantes.');
    filasImportacion.value = filas;
  } catch (e) {
    filasImportacion.value = [];
    error.value = e.message || 'No se pudo leer la planilla.';
  }
}

async function confirmarImportacion() {
  importando.value = true;
  try {
    const r = await fetch('/api/epja/estudiantes/importar', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ filas: filasImportacion.value })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(mensajeError(d, 'No se pudo importar.'));
    aviso.value = `Importación terminada: ${d.creados} creados y ${d.actualizados} actualizados.`;
    if (d.errores?.length) error.value = d.errores.map(e => `Fila ${e.fila}: ${e.error}`).join(' · ');
    filasImportacion.value = [];
    await cargar();
  } catch (e) {
    error.value = e.message;
  } finally {
    importando.value = false;
  }
}

function descargarPlantilla() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['dni,nombre,apellido,email,materias,clave_inicial,activo\n12345678,Ana,Pérez,ana@example.com,FOI,12345678,si\n'], { type: 'text/csv;charset=utf-8' }));
  a.download = 'plantilla-estudiantes-epja.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function nuevaMateria(campo = '') {
  materiaForm.value = materiaVacia(campo);
  error.value = '';
}

function editarMateria(m = materiaSeleccionada.value) {
  if (!m) return;
  materiaForm.value = { ...m };
  error.value = '';
}

function cerrarMateriaModal() {
  materiaForm.value = null;
}

async function guardarMateria() {
  const m = materiaForm.value;
  m.campo = normalizarCodigoMateria(m.campo);
  const esNueva = !m.id;
  const r = await fetch(esNueva ? '/api/epja/materias' : `/api/epja/materias/${m.id}`, {
    method: esNueva ? 'POST' : 'PUT',
    headers: headers(),
    body: JSON.stringify(m)
  });
  const d = await r.json();
  if (!r.ok) {
    error.value = mensajeError(d, 'No se pudo guardar la materia.');
    return;
  }

  materiaForm.value = null;
  aviso.value = esNueva ? 'Materia agregada.' : 'Materia actualizada.';
  await cargar();
  const actual = materias.value.find(x => x.id === d.id) || d;
  await abrirMateria(actual);
}

async function abrirMateria(m) {
  materiaSeleccionada.value = m;
  moduloForm.value = null;
  const r = await fetch(`/api/epja/materias/${m.id}/modulos`, { headers: headers() });
  modulosMateria.value = r.ok ? await r.json() : [];
}

function nuevoModulo() {
  if (!materiaSeleccionada.value?.id) return;
  errorModulo.value = '';
  seccionModulo.value = 'contenido';
  moduloForm.value = {
    titulo: '',
    resumen: '',
    contenido: '',
    publicado: true,
    autoevaluacion: { activa: false, notaAprobacion: 60, preguntas: [] },
    certificadoModo: 'manual'
  };
}

function editarModulo(m) {
  errorModulo.value = '';
  seccionModulo.value = 'contenido';
  moduloForm.value = {
    ...m,
    contenido: typeof m.contenido === 'string' ? m.contenido : '',
    autoevaluacion: JSON.parse(JSON.stringify(m.autoevaluacion || { activa: false, notaAprobacion: 60, preguntas: [] })),
    certificadoModo: m.certificadoModo === 'automatico' ? 'automatico' : 'manual'
  };
}

function cerrarModuloModal() {
  moduloForm.value = null;
  errorModulo.value = '';
}

async function guardarModulo() {
  const m = moduloForm.value;
  errorModulo.value = '';
  const r = await fetch(m.id ? `/api/epja/modulos/${m.id}` : `/api/epja/materias/${materiaSeleccionada.value.id}/modulos`, {
    method: m.id ? 'PUT' : 'POST',
    headers: headers(),
    body: JSON.stringify(m)
  });
  const d = await r.json();
  if (!r.ok) {
    errorModulo.value = mensajeError(d, 'No se pudo guardar la clase.');
    return;
  }
  moduloForm.value = null;
  aviso.value = 'Clase guardada.';
  await abrirMateria(materiaSeleccionada.value);
}

async function eliminarModulo(m) {
  if (!confirm(`¿Eliminar la clase “${m.titulo}”?`)) return;
  await fetch(`/api/epja/modulos/${m.id}`, { method: 'DELETE', headers: headers() });
  await abrirMateria(materiaSeleccionada.value);
}

async function cargarRecorrido() {
  if (!estudianteCert.value) {
    recorrido.value = [];
    return;
  }
  const r = await fetch(`/api/epja/estudiantes/${estudianteCert.value}/recorrido`, { headers: headers() });
  const d = await r.json();
  if (!r.ok) {
    error.value = mensajeError(d, 'No se pudo cargar el recorrido.');
    return;
  }
  recorrido.value = d;
}

async function aprobar(modulo) {
  const r = await fetch(`/api/epja/estudiantes/${estudianteCert.value}/modulos/${modulo.id}/aprobar`, {
    method: 'POST',
    headers: headers()
  });
  const d = await r.json();
  if (!r.ok) {
    error.value = mensajeError(d, 'No se pudo emitir el certificado.');
    return;
  }
  recorrido.value = d.recorrido;
  aviso.value = `Certificado emitido para “${modulo.titulo}”.`;
}

function dniFormateado(dni) {
  return String(dni || '').replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function nombreArchivo(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

async function descargarCertificado(modulo) {
  const estudiante = estudiantes.value.find(e => Number(e.id) === Number(estudianteCert.value));
  if (!estudiante || !modulo.certificado) {
    error.value = 'No se encontraron los datos necesarios para generar el certificado.';
    return;
  }

  certificadoDescargando.value = modulo.certificado.id;
  error.value = '';
  aviso.value = '';
  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const ancho = pdf.internal.pageSize.getWidth();
    const alto = pdf.internal.pageSize.getHeight();
    const nombreCompleto = `${estudiante.nombre} ${estudiante.apellido}`.trim();
    const fecha = new Date(modulo.certificado.emitidoEn);
    const fechaTexto = new Intl.DateTimeFormat('es-AR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(Number.isNaN(fecha.getTime()) ? new Date() : fecha);

    pdf.setProperties({
      title: `Certificado de aprobación - ${nombreCompleto}`,
      subject: modulo.titulo,
      author: 'Prof. Carina Luna'
    });
    pdf.setFillColor(246, 241, 231);
    pdf.rect(0, 0, ancho, alto, 'F');
    pdf.setDrawColor(64, 98, 78);
    pdf.setLineWidth(1);
    pdf.roundedRect(12, 12, ancho - 24, alto - 24, 3, 3);
    pdf.setDrawColor(222, 162, 59);
    pdf.setLineWidth(0.35);
    pdf.roundedRect(16, 16, ancho - 32, alto - 32, 2, 2);

    pdf.setTextColor(190, 90, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('EPJA N° 753 · RAWSON · CHUBUT', ancho / 2, 31, { align: 'center' });

    pdf.setTextColor(42, 39, 35);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(27);
    pdf.text('Constancia de aprobación', ancho / 2, 47, { align: 'center' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);
    pdf.text('Se deja constancia de que', ancho / 2, 62, { align: 'center' });
    pdf.setTextColor(64, 98, 78);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text(nombreCompleto, ancho / 2, 76, { align: 'center' });
    pdf.setTextColor(93, 88, 80);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`DNI ${dniFormateado(estudiante.dni)}`, ancho / 2, 84, { align: 'center' });

    pdf.setTextColor(42, 39, 35);
    pdf.setFontSize(12);
    pdf.text('cursó y aprobó el módulo', ancho / 2, 97, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    const tituloModulo = pdf.splitTextToSize(`“${modulo.titulo}”`, 220);
    pdf.text(tituloModulo, ancho / 2, 108, { align: 'center' });
    const yMateria = 108 + (tituloModulo.length * 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(93, 88, 80);
    pdf.text(`${(modulo.materia.campo || modulo.materia.codigo).toUpperCase()} · ${modulo.materia.nombre}`, ancho / 2, yMateria, { align: 'center' });
    pdf.text(`Emitido en Rawson, Chubut, el ${fechaTexto}.`, ancho / 2, yMateria + 11, { align: 'center' });

    pdf.setDrawColor(64, 98, 78);
    pdf.setLineWidth(0.4);
    pdf.line(103, 163, 194, 163);
    pdf.setTextColor(42, 39, 35);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Prof. Carina Luna', ancho / 2, 170, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(93, 88, 80);
    pdf.text('Economía y Administración · EPJA N° 753', ancho / 2, 176, { align: 'center' });
    pdf.setFontSize(8);
    pdf.text(`Código de certificado: ${modulo.certificado.codigo}`, ancho / 2, 190, { align: 'center' });

    const archivo = nombreArchivo(`certificado-${estudiante.apellido}-${estudiante.nombre}-${modulo.titulo}`);
    pdf.save(`${archivo || 'certificado-epja'}.pdf`);
    aviso.value = `Certificado descargado para ${nombreCompleto}.`;
  } catch (e) {
    error.value = e.message || 'No se pudo generar el certificado.';
  } finally {
    certificadoDescargando.value = null;
  }
}

async function revocar(certificado) {
  if (!confirm('¿Revocar este certificado?')) return;
  const r = await fetch(`/api/epja/certificados/${certificado.id}`, { method: 'DELETE', headers: headers() });
  if (!r.ok) {
    error.value = 'No se pudo revocar el certificado.';
    return;
  }
  aviso.value = 'Certificado revocado.';
  await cargarRecorrido();
}

onMounted(() => cargar().catch(e => (error.value = e.message)));
</script>

<template>
  <section class="admin-wrap epja-wrap">
    <div class="admin-head">
      <div>
        <span class="section-label">Administración EPJA</span>
        <h1>Aula virtual</h1>
        <p>Gestioná estudiantes, clases, aprobaciones y certificados.</p>
      </div>
      <a class="button secondary" href="#admin">Volver al panel</a>
    </div>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="aviso" class="notice">{{ aviso }}</p>

    <div class="epja-tabs">
      <button :class="{ active: pestaña === 'estudiantes' }" @click="pestaña = 'estudiantes'">Estudiantes</button>
      <button :class="{ active: pestaña === 'importar' }" @click="pestaña = 'importar'">Importar planilla</button>
      <button :class="{ active: pestaña === 'materias' }" @click="pestaña = 'materias'">Materias y clases</button>
      <button :class="{ active: pestaña === 'certificados' }" @click="pestaña = 'certificados'">Certificados</button>
    </div>

    <section v-if="pestaña === 'estudiantes'" class="admin-card student-card">
      <div class="student-toolbar">
        <div>
          <h2>Estudiantes</h2>
          <p>{{ estudiantes.length }} registrados en el aula.</p>
        </div>
        <div class="student-tools">
          <label class="search">
            <Search :size="16" />
            <input v-model="busqueda" placeholder="Buscar por nombre o DNI">
          </label>
          <button class="button button-icon" @click="nuevoEstudiante">
            <UserPlus :size="18" />Agregar estudiante
          </button>
        </div>
      </div>

      <div v-if="formulario" class="student-form">
        <h3>{{ formulario.id ? 'Editar estudiante' : 'Nuevo estudiante' }}</h3>
        <div class="student-grid">
          <label>Nombre<input v-model="formulario.nombre" required></label>
          <label>Apellido<input v-model="formulario.apellido" required></label>
          <label>DNI<input v-model="formulario.dni" inputmode="numeric" required></label>
          <label>Correo<input v-model="formulario.email" type="email" autocomplete="email"></label>
          <label>Clave {{ formulario.id ? '(vacía: conservar)' : '(opcional: DNI)' }}<input v-model="formulario.password" type="password"></label>
        </div>
        <fieldset>
          <legend>Materias asignadas</legend>
          <label v-for="grupo in materiasPorCampo" :key="grupo.campo" class="subject-check">
            <input v-model="formulario.materias" type="checkbox" :value="grupo.campo">
            <span><strong>{{ grupo.campo.toUpperCase() }}</strong> · {{ grupo.materias.map(m => m.nombre).join(' / ') }}</span>
          </label>
        </fieldset>
        <label class="subject-check"><input v-model="formulario.activo" type="checkbox">Acceso activo al aula</label>
        <div class="form-actions">
          <button class="button" @click="guardarEstudiante">Guardar estudiante</button>
          <button class="button ghost" @click="formulario = null">Cancelar</button>
        </div>
      </div>

      <div class="student-list">
        <article v-for="e in estudiantesFiltrados" :key="e.id" class="student-row">
          <div class="student-name">
            <strong>{{ e.apellido }}, {{ e.nombre }}</strong>
            <small>DNI {{ e.dni }}<template v-if="e.email"> · {{ e.email }}</template> · <span :class="e.activo ? 'active-status' : 'inactive-status'">{{ e.activo ? 'Activo' : 'Inactivo' }}</span></small>
          </div>
          <div class="student-subjects">
            <span v-for="m in e.materias" :key="m" class="subject-pill">{{ m.toUpperCase() }}</span>
          </div>
          <div class="student-actions">
            <button class="row-action" @click="editarEstudiante(e)"><FileEdit :size="15" />Editar</button>
            <button class="row-action danger" @click="eliminarEstudiante(e)"><Trash :size="15" /></button>
          </div>
        </article>
      </div>
    </section>

    <section v-else-if="pestaña === 'importar'" class="admin-card import-card">
      <span class="section-label">Carga masiva</span>
      <h2>Importar una planilla</h2>
      <p>Subí Excel (.xlsx) o CSV. Columnas: <strong>dni, nombre, apellido, materias</strong>; opcionalmente email, clave_inicial y activo.</p>
      <div class="import-actions">
        <label class="upload-button">
          <FileImport :size="20" />Seleccionar planilla
          <input type="file" accept=".xlsx,.csv" @change="leerPlanilla">
        </label>
        <button class="button ghost button-icon" @click="descargarPlantilla"><Download :size="17" />Descargar plantilla CSV</button>
      </div>
      <div v-if="filasImportacion.length" class="import-preview">
        <div class="preview-head">
          <h3>{{ filasImportacion.length }} filas listas</h3>
          <button class="button" :disabled="importando" @click="confirmarImportacion">{{ importando ? 'Importando…' : 'Confirmar importación' }}</button>
        </div>
        <div v-for="(f, i) in filasImportacion.slice(0, 8)" :key="i" class="preview-row">
          <span>{{ f.dni || 'Sin DNI' }}</span>
          <span>{{ f.apellido }}, {{ f.nombre }}</span>
          <span>{{ f.materias || 'Sin materias' }}</span>
        </div>
      </div>
    </section>

    <section v-else-if="pestaña === 'materias'" class="materias-layout">
      <aside class="admin-card materia-list">
        <div class="materia-list-head">
          <h2>Materias</h2>
          <button class="icon-button" aria-label="Agregar materia" @click="nuevaMateria">
            <PlusCircle :size="19" />
          </button>
        </div>
        <div v-for="grupo in materiasPorCampo" :key="grupo.campo" class="materia-group">
          <div class="materia-group-head">
            <strong>{{ grupo.campo.toUpperCase() }}</strong>
            <button class="icon-button small" :aria-label="`Agregar materia a ${grupo.campo.toUpperCase()}`" @click="nuevaMateria(grupo.campo)">
              <PlusCircle :size="16" />
            </button>
          </div>
          <button
            v-for="m in grupo.materias"
            :key="m.id"
            class="materia-choice"
            :class="{ selected: materiaSeleccionada?.id === m.id }"
            @click="abrirMateria(m)"
          >
            <span>{{ m.nombre }}</span>
          </button>
        </div>
      </aside>

      <section class="admin-card class-workspace">
        <div v-if="!materiaSeleccionada" class="empty-state">
          <Book :size="30" />
          <h2>Elegí una materia</h2>
          <p>Después podrás crear y editar sus clases.</p>
        </div>

        <template v-else>
          <div class="workspace-head">
            <div>
              <span class="section-label">{{ (materiaSeleccionada.campo || materiaSeleccionada.codigo).toUpperCase() }}</span>
              <h2>{{ materiaSeleccionada.nombre }}</h2>
              <p>{{ materiaSeleccionada.descripcion || 'Sin descripción cargada.' }}</p>
            </div>
            <div class="workspace-actions">
              <button class="button ghost button-icon" @click="editarMateria()"><FileEdit :size="15" />Editar materia</button>
              <button class="button button-icon" @click="nuevoModulo"><PlusCircle :size="19" />Agregar clase</button>
            </div>
          </div>

          <article v-for="m in modulosMateria" :key="m.id" class="class-row">
            <div>
              <strong>{{ m.titulo }}</strong>
              <small>{{ m.publicado ? 'Publicado' : 'Borrador' }} · {{ m.palabras }} palabras · {{ m.autoevaluacion?.activa ? `Autoevaluación de ${m.autoevaluacion.preguntas?.length || 0} preguntas` : 'Sin autoevaluación' }}</small>
            </div>
            <div>
              <button class="row-action" @click="editarModulo(m)"><FileEdit :size="15" />Editar</button>
              <button class="row-action danger" @click="eliminarModulo(m)"><Trash :size="15" /></button>
            </div>
          </article>
          <p v-if="!modulosMateria.length" class="empty-copy">Esta materia no tiene clases todavía.</p>
        </template>
      </section>
    </section>

    <section v-else class="admin-card certificates">
      <div class="certificate-head">
        <div>
          <span class="section-label">Aprobaciones</span>
          <h2>Certificados por módulo</h2>
          <p>Elegí un estudiante y aprobá sus módulos para emitir el certificado.</p>
        </div>
        <Star :size="34" />
      </div>
      <label class="student-select">
        Estudiante
        <select v-model="estudianteCert" @change="cargarRecorrido">
          <option value="">Seleccionar estudiante</option>
          <option v-for="e in estudiantes" :key="e.id" :value="e.id">{{ e.apellido }}, {{ e.nombre }} · {{ e.dni }}</option>
        </select>
      </label>
      <div v-if="estudianteCert" class="certificate-list">
        <article v-for="m in recorrido" :key="m.id" class="certificate-row">
          <div>
            <small>{{ (m.materia.campo || m.materia.codigo).toUpperCase() }} · {{ m.materia.nombre }}</small>
            <strong>{{ m.titulo }}</strong>
            <span v-if="m.certificado && !m.certificado.revocadoEn" class="certificate-code">Certificado {{ m.certificado.codigo }}</span>
            <span v-else-if="m.certificado?.revocadoEn" class="revoked">Certificado revocado</span>
            <span v-else>{{ m.aprobado ? 'Aprobado sin certificado' : 'Pendiente de aprobación' }}</span>
            <small v-if="m.autoevaluacionActiva">Autoevaluación: {{ m.intentos }} intento{{ m.intentos === 1 ? '' : 's' }} · mejor nota {{ m.mejorPorcentaje }} % · certificado {{ m.certificadoModo === 'automatico' ? 'automático' : 'manual' }}</small>
          </div>
          <div class="certificate-actions">
            <button v-if="!m.certificado || m.certificado.revocadoEn" class="button" @click="aprobar(m)">Aprobar y emitir</button>
            <template v-else>
              <button class="row-action" :disabled="certificadoDescargando === m.certificado.id" @click="descargarCertificado(m)">
                <Download :size="15" />{{ certificadoDescargando === m.certificado.id ? 'Generando…' : 'Descargar PDF' }}
              </button>
              <button class="row-action danger" @click="revocar(m.certificado)">Revocar</button>
            </template>
          </div>
        </article>
        <p v-if="!recorrido.length" class="empty-copy">Este estudiante aún no tiene módulos asignados.</p>
      </div>
    </section>

    <Teleport to="body">
      <div v-if="materiaForm" class="modal-backdrop" @click.self="cerrarMateriaModal">
        <form class="modal-panel materia-modal" @submit.prevent="guardarMateria">
          <div class="modal-head">
            <div>
              <span class="section-label">{{ materiaForm.id ? 'Editar materia' : 'Nueva materia' }}</span>
              <h2>{{ materiaForm.id ? materiaForm.nombre : 'Agregar materia' }}</h2>
            </div>
            <button type="button" class="icon-button" aria-label="Cerrar" @click="cerrarMateriaModal"><Times :size="18" /></button>
          </div>

          <div class="materia-form-grid">
            <label>
              Campo
              <input v-model="materiaForm.campo" list="campos-materia" placeholder="Por ejemplo: FOII" required @blur="materiaForm.campo = normalizarCodigoMateria(materiaForm.campo)">
              <datalist id="campos-materia">
                <option v-for="grupo in materiasPorCampo" :key="grupo.campo" :value="grupo.campo.toUpperCase()" />
              </datalist>
            </label>
            <label>
              Color
              <input v-model="materiaForm.color" type="color">
            </label>
            <label class="field-full">
              Nombre
              <input v-model="materiaForm.nombre" required>
            </label>
            <label class="field-full">
              Descripción
              <textarea v-model="materiaForm.descripcion" rows="4"></textarea>
            </label>
            <label>
              Orden
              <input v-model.number="materiaForm.orden" type="number" min="0">
            </label>
            <label class="subject-check modal-check">
              <input v-model="materiaForm.activa" type="checkbox">Materia activa
            </label>
          </div>

          <div class="form-actions modal-actions">
            <button class="button">{{ materiaForm.id ? 'Guardar cambios' : 'Crear materia' }}</button>
            <button type="button" class="button ghost" @click="cerrarMateriaModal">Cancelar</button>
          </div>
        </form>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="moduloForm" class="modal-backdrop" @click.self="cerrarModuloModal">
        <form class="modal-panel module-modal" @submit.prevent="guardarModulo">
          <div class="modal-head">
            <div>
              <span class="section-label">{{ moduloForm.id ? 'Editar clase' : 'Nueva clase' }}</span>
              <h2>{{ moduloForm.id ? moduloForm.titulo : materiaSeleccionada?.nombre }}</h2>
            </div>
            <button type="button" class="icon-button" aria-label="Cerrar" @click="cerrarModuloModal"><Times :size="18" /></button>
          </div>

          <div class="module-modal-body">
            <p v-if="errorModulo" class="error module-save-error" role="alert">{{ errorModulo }}</p>
            <label>Título<input v-model="moduloForm.titulo" required></label>
            <label>Resumen<input v-model="moduloForm.resumen"></label>
            <nav class="module-form-tabs" aria-label="Secciones de la clase">
              <button type="button" :class="{ active: seccionModulo === 'contenido' }" @click="seccionModulo = 'contenido'">Contenido y archivos</button>
              <button type="button" :class="{ active: seccionModulo === 'autoevaluacion' }" @click="seccionModulo = 'autoevaluacion'">
                Autoevaluación
                <span>{{ moduloForm.autoevaluacion.activa ? `${moduloForm.autoevaluacion.preguntas.length}/15` : 'Desactivada' }}</span>
              </button>
            </nav>
            <div v-if="seccionModulo === 'contenido'" class="module-editor-field">
              <span class="module-editor-label">Contenido</span>
              <RichTextEditor
                v-model="moduloForm.contenido"
                allow-youtube
                upload-url="/api/epja/archivos"
                :auth-token="token"
              />
            </div>
            <section v-else class="module-evaluation-settings">
              <div>
                <span class="section-label">Actividad de cierre</span>
                <h3>Autoevaluación del módulo</h3>
              </div>
              <label class="subject-check"><input v-model="moduloForm.autoevaluacion.activa" type="checkbox">Cerrar este módulo con una autoevaluación</label>
              <p>La aprobación requiere 9 respuestas correctas de 15 (60 %). Los intentos quedan registrados.</p>
              <template v-if="moduloForm.autoevaluacion.activa">
                <label>
                  Emisión del certificado
                  <select v-model="moduloForm.certificadoModo">
                    <option value="manual">Manual: aprobar y emitir desde administración</option>
                    <option value="automatico">Automática: emitir al aprobar la autoevaluación</option>
                  </select>
                </label>
                <EvaluationBuilder v-model="moduloForm.autoevaluacion" :max-questions="15" :exact-questions="15" />
              </template>
            </section>
            <label class="subject-check"><input v-model="moduloForm.publicado" type="checkbox">Publicar para estudiantes</label>
          </div>

          <div class="form-actions modal-actions">
            <button class="button">Guardar clase</button>
            <button type="button" class="button ghost" @click="cerrarModuloModal">Cancelar</button>
          </div>
        </form>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.epja-wrap { max-width:1100px; }
.epja-tabs { display:flex; gap:10px; margin:30px 0 18px; border-bottom:1px solid var(--borde); overflow:auto; }
.epja-tabs button { padding:11px 4px; border:0; border-bottom:3px solid transparent; background:transparent; color:#746D62; font:700 14px 'Work Sans',sans-serif; cursor:pointer; white-space:nowrap; }
.epja-tabs button + button { margin-left:18px; }
.epja-tabs button.active { border-bottom-color:var(--verde); color:var(--verde); }
.student-card,.import-card,.materia-list,.class-workspace,.certificates { padding:clamp(22px,4vw,34px); }
.student-toolbar,.student-tools,.student-row,.preview-head,.workspace-head,.class-row,.certificate-head,.certificate-row,.materia-list-head { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.student-toolbar h2,.import-card h2,.materia-list h2,.class-workspace h2,.certificates h2 { margin:0; }
.student-toolbar p,.import-card>p,.certificate-head p,.workspace-head p { margin:4px 0; color:#746D62; }
.student-tools,.workspace-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
.search { display:flex; align-items:center; gap:8px; min-height:38px; padding:0 9px; border:1px solid var(--borde); border-radius:8px; background:#fff; }
.search input { width:210px; height:34px; margin:0; padding:6px 0; border:0; outline:0; background:transparent; font:inherit; }
.student-form { display:grid; gap:17px; margin:24px 0; padding:22px; border:1px solid #B8C9B5; border-radius:13px; background:#F1F5ED; }
.student-form h3 { margin:0; }
.student-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; }
.student-grid label,.modal-panel label,.student-select { display:grid; gap:6px; font-size:14px; font-weight:700; }
.student-grid input,.modal-panel input,.modal-panel textarea { width:100%; padding:11px; border:1px solid var(--borde); border-radius:8px; background:#fff; font:inherit; }
.modal-panel input[type="color"] { min-height:42px; padding:5px; }
fieldset { display:flex; flex-wrap:wrap; gap:12px 20px; margin:0; padding:12px; border:1px solid var(--borde); border-radius:9px; }
legend { padding:0 5px; font-size:13px; font-weight:700; }
.subject-check { display:inline-flex !important; align-items:center; gap:7px; font-size:14px; }
.subject-check input { width:auto !important; }
.student-list { border-top:1px solid var(--borde); }
.student-row,.class-row,.certificate-row { padding:16px 0; border-bottom:1px solid var(--borde); }
.student-name,.class-row>div:first-child,.certificate-row>div:first-child { display:grid; gap:2px; }
.student-name small,.class-row small { color:#746D62; }
.active-status,.certificate-code { color:var(--verde); font-weight:700; }
.inactive-status,.revoked { color:#9B3C28; font-weight:700; }
.student-subjects { display:flex; flex-wrap:wrap; gap:6px; margin-left:auto; }
.subject-pill { padding:3px 8px; border-radius:999px; background:var(--salvia); color:var(--verde); font-size:11px; font-weight:700; }
.student-actions,.class-row>div:last-child { display:flex; gap:6px; }
.icon-button,.row-action { display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; color:var(--verde); font:700 13px 'Work Sans',sans-serif; cursor:pointer; }
.icon-button { padding:7px; border-radius:7px; }
.row-action { padding:8px 9px; border-radius:7px; }
.icon-button:hover,.row-action:hover { background:var(--salvia); }
.danger { color:#9B3C28; }
.notice { padding:10px 14px; border-radius:8px; background:var(--salvia); color:var(--verde); font-weight:600; }
.button.ghost { background:transparent; border:1px solid var(--borde); color:var(--verde); }
.button-icon,.upload-button { display:inline-flex; align-items:center; gap:7px; }
.import-card { max-width:820px; }
.import-actions { display:flex; gap:12px; flex-wrap:wrap; margin:24px 0; }
.upload-button { padding:13px 20px; border-radius:999px; background:var(--verde); color:var(--crema); font:700 14px 'Work Sans',sans-serif; cursor:pointer; }
.upload-button input { display:none; }
.import-preview { margin-top:24px; padding:20px; border:1px solid #B8C9B5; border-radius:13px; background:#F1F5ED; }
.preview-row { display:grid; grid-template-columns:110px 1fr 130px; gap:12px; padding:9px 0; border-bottom:1px solid var(--borde); font-size:13px; }
.materias-layout { display:grid; grid-template-columns:270px minmax(0,1fr); gap:20px; }
.materia-list { align-self:start; }
.materia-list-head { margin-bottom:10px; }
.materia-group { margin-top:14px; }
.materia-group-head { display:flex; align-items:center; justify-content:space-between; padding:0 8px 5px 12px; color:var(--verde); }
.icon-button.small { width:30px; height:30px; }
.materia-choice { display:grid; width:100%; gap:3px; padding:12px; border:0; border-left:3px solid transparent; background:transparent; text-align:left; cursor:pointer; font:inherit; }
.materia-choice.selected,.materia-choice:hover { background:var(--salvia); border-left-color:var(--verde); }
.materia-choice span { font-size:13px; color:#746D62; }
.class-workspace { min-height:500px; }
.empty-state { display:grid; place-items:center; align-content:center; min-height:400px; color:#746D62; text-align:center; }
.empty-state h2 { color:var(--tinta); margin:12px 0 0; }
.certificate-head>svg { color:var(--ocre); }
.student-select { max-width:500px; margin:24px 0; }
.student-select select { padding:11px; border:1px solid var(--borde); border-radius:8px; background:#fff; font:inherit; }
.certificate-list { border-top:1px solid var(--borde); }
.certificate-row small { color:#746D62; }
.certificate-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
.certificate-actions .row-action { margin:0; }
.certificate-actions .row-action:disabled { opacity:.55; cursor:wait; }
.empty-copy { color:#746D62; }
.modal-backdrop { position:fixed; z-index:2000; inset:0; display:grid; place-items:center; padding:22px; background:rgba(38,34,29,.48); }
.modal-panel { width:min(720px,100%); max-height:min(88vh,840px); overflow:auto; display:grid; gap:17px; padding:clamp(22px,4vw,34px); border:1px solid var(--borde); border-radius:14px; background:var(--crema); box-shadow:0 24px 80px rgba(33,29,24,.32); }
.module-modal { width:min(860px,100%); max-height:min(92vh,900px); grid-template-rows:auto minmax(0,1fr) auto; overflow:hidden; }
.module-modal-body { min-height:0; overflow:auto; display:grid; gap:17px; padding-right:6px; scrollbar-gutter:stable; }
.module-save-error { position:sticky; z-index:3; top:0; margin:0; }
.module-editor-field { min-height:0; }
.module-editor-label { display:block; margin-bottom:6px; font-size:14px; font-weight:700; }
.module-form-tabs { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:5px; border:1px solid var(--borde); border-radius:11px; background:#eee9dd; }
.module-form-tabs button { display:flex; align-items:center; justify-content:center; gap:8px; min-height:42px; padding:9px 12px; border:0; border-radius:8px; background:transparent; color:#746D62; font:700 14px 'Work Sans',sans-serif; cursor:pointer; }
.module-form-tabs button.active { background:#fffdf7; color:var(--verde); box-shadow:0 1px 4px rgba(40,35,29,.1); }
.module-form-tabs span { padding:2px 7px; border-radius:999px; background:var(--salvia); font-size:11px; }
.module-evaluation-settings { display:grid; gap:13px; padding:17px; border:1px solid var(--borde); border-radius:12px; background:#fffdf7; }
.module-evaluation-settings h3 { margin:3px 0 0; }
.module-evaluation-settings>p { margin:0; color:#746D62; font-size:14px; }
.module-evaluation-settings select { width:100%; padding:11px; border:1px solid var(--borde); border-radius:8px; background:#fff; font:inherit; }
.module-modal :deep(.rich-text-editor) { min-width:0; }
.module-modal :deep(.ql-container.ql-snow) { min-height:260px; max-height:42vh; overflow:hidden; }
.module-modal :deep(.ql-editor) { min-height:260px; max-height:42vh; overflow-y:auto; }
.modal-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding-bottom:12px; border-bottom:1px solid var(--borde); }
.modal-head h2 { margin:4px 0 0; }
.materia-form-grid { display:grid; grid-template-columns:minmax(140px,1fr) 120px; gap:16px; align-items:end; }
.field-full { grid-column:1 / -1; }
.modal-check { align-self:center; padding-bottom:10px; }
.modal-actions { padding-top:4px; }
.form-actions { display:flex; flex-wrap:wrap; gap:10px; }
@media(max-width:760px) {
  .student-toolbar,.student-row,.preview-head,.workspace-head,.class-row,.certificate-row { align-items:flex-start; flex-direction:column; }
  .student-tools,.workspace-actions { width:100%; justify-content:flex-start; }
  .search { width:100%; }
  .search input { width:100%; }
  .student-grid,.materias-layout,.materia-form-grid { grid-template-columns:1fr; }
  .student-list { display:grid; gap:12px; padding-top:14px; border-top:1px solid var(--borde); }
  .student-row { width:100%; padding:14px; border:1px solid #d7d1c4; border-radius:12px; background:#eeeae0; }
  .student-subjects { margin-left:0; }
  .preview-row { grid-template-columns:1fr; }
  .modal-backdrop { place-items:end center; padding:14px; }
  .modal-panel { max-height:92vh; }
  .module-form-tabs { grid-template-columns:1fr; }
}
</style>
