<script setup>
import { onMounted, ref } from 'vue';
import { Download } from '@primeicons/vue';

const certificado = ref(null);
const cargando = ref(true);
const descargando = ref(false);
const error = ref('');
const token = sessionStorage.getItem('profeluna_epja_token') || '';

function moduloDesdeHash() {
  const consulta = String(location.hash || '').split('?')[1] || '';
  return Number(new URLSearchParams(consulta).get('modulo'));
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

async function cargar() {
  const moduloId = moduloDesdeHash();
  if (!token || !Number.isInteger(moduloId) || moduloId < 1) {
    location.hash = '#login';
    return;
  }
  const respuesta = await fetch(`/api/epja/alumno/modulos/${moduloId}/certificado`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      sessionStorage.removeItem('profeluna_epja_token');
      location.hash = '#login';
      return;
    }
    throw new Error(datos.error || 'No se pudo cargar el certificado.');
  }
  certificado.value = datos;
}

async function descargar() {
  if (!certificado.value) return;
  descargando.value = true;
  error.value = '';
  try {
    const { jsPDF } = await import('jspdf');
    const c = certificado.value;
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const ancho = pdf.internal.pageSize.getWidth();
    const alto = pdf.internal.pageSize.getHeight();
    const nombreCompleto = `${c.estudiante.nombre} ${c.estudiante.apellido}`.trim();
    const fecha = new Date(c.emitidoEn);
    const fechaTexto = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(Number.isNaN(fecha.getTime()) ? new Date() : fecha);

    pdf.setProperties({ title: `Certificado de aprobación - ${nombreCompleto}`, subject: c.modulo.titulo, author: 'Prof. Carina Luna' });
    pdf.setFillColor(246, 241, 231);
    pdf.rect(0, 0, ancho, alto, 'F');
    pdf.setDrawColor(64, 98, 78);
    pdf.setLineWidth(1);
    pdf.roundedRect(12, 12, ancho - 24, alto - 24, 3, 3);
    pdf.setDrawColor(222, 162, 59);
    pdf.setLineWidth(.35);
    pdf.roundedRect(16, 16, ancho - 32, alto - 32, 2, 2);
    pdf.setTextColor(190, 90, 60);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('EPJA N° 753 · RAWSON · CHUBUT', ancho / 2, 31, { align: 'center' });
    pdf.setTextColor(42, 39, 35);
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
    pdf.text(`DNI ${dniFormateado(c.estudiante.dni)}`, ancho / 2, 84, { align: 'center' });
    pdf.setTextColor(42, 39, 35);
    pdf.setFontSize(12);
    pdf.text('cursó y aprobó el módulo', ancho / 2, 97, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(17);
    const tituloModulo = pdf.splitTextToSize(`“${c.modulo.titulo}”`, 220);
    pdf.text(tituloModulo, ancho / 2, 108, { align: 'center' });
    const yMateria = 108 + (tituloModulo.length * 7);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(93, 88, 80);
    pdf.text(`${(c.materia.campo || c.materia.codigo).toUpperCase()} · ${c.materia.nombre}`, ancho / 2, yMateria, { align: 'center' });
    pdf.text(`Emitido en Rawson, Chubut, el ${fechaTexto}.`, ancho / 2, yMateria + 11, { align: 'center' });
    pdf.setDrawColor(64, 98, 78);
    pdf.setLineWidth(.4);
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
    pdf.text(`Código de certificado: ${c.codigo}`, ancho / 2, 190, { align: 'center' });
    const archivo = nombreArchivo(`certificado-${c.estudiante.apellido}-${c.estudiante.nombre}-${c.modulo.titulo}`);
    pdf.save(`${archivo || 'certificado-epja'}.pdf`);
  } catch (e) {
    error.value = e.message || 'No se pudo generar el PDF.';
  } finally {
    descargando.value = false;
  }
}

onMounted(() => cargar().catch(e => { error.value = e.message; }).finally(() => { cargando.value = false; }));
</script>

<template>
  <section class="certificate-page">
    <span class="section-label">Aula EPJA</span>
    <h1>Tu certificado</h1>
    <p v-if="cargando">Cargando certificado…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <article v-else-if="certificado" class="certificate-card">
      <small>{{ (certificado.materia.campo || certificado.materia.codigo).toUpperCase() }} · {{ certificado.materia.nombre }}</small>
      <h2>{{ certificado.modulo.titulo }}</h2>
      <p>Certificado {{ certificado.codigo }}</p>
      <div class="certificate-buttons">
        <button class="button button-icon" :disabled="descargando" @click="descargar"><Download :size="18" />{{ descargando ? 'Generando…' : 'Descargar PDF' }}</button>
        <a class="button secondary" :href="`/epja/modulo.html?id=${certificado.modulo.id}`">Volver al módulo</a>
      </div>
    </article>
  </section>
</template>

<style scoped>
.certificate-page { max-width:760px; min-height:70vh; margin:auto; padding:70px 24px; }
.certificate-page h1 { margin-bottom:24px; }
.certificate-card { padding:30px; border:1px solid var(--borde); border-radius:16px; background:var(--crema); }
.certificate-card small { color:#746D62; font-weight:700; }
.certificate-card h2 { margin:8px 0; }
.certificate-buttons { display:flex; flex-wrap:wrap; gap:10px; margin-top:24px; }
.button:disabled { opacity:.55; cursor:wait; }
</style>
