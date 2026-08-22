<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { loadQuill, QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { MAX_ARCHIVO_BYTES, tamanioLegible, tipoArchivo, urlYoutube } from '../utils/editor-media.js';

function registrarMultimedia(Quill) {
  const BlockEmbed = Quill.import('blots/block/embed');

  if (!Quill.imports?.['formats/adjunto']) {
    class AdjuntoBlot extends BlockEmbed {
    static blotName = 'adjunto';
    static tagName = 'figure';
    static className = 'ql-attachment';

    static create(valor = {}) {
      const nodo = super.create();
      const url = String(valor.url || '');
      const nombre = String(valor.nombre || 'Archivo adjunto').slice(0, 180);
      const tipo = String(valor.tipo || 'application/octet-stream').slice(0, 100);
      const tamanio = Math.max(0, Number(valor.tamanio) || 0);
      nodo.setAttribute('contenteditable', 'false');
      nodo.setAttribute('draggable', 'true');
      nodo.dataset.url = url;
      nodo.dataset.name = nombre;
      nodo.dataset.type = tipo;
      nodo.dataset.size = String(tamanio);
      nodo.dataset.mediaAlign = valor.align || 'left';
      nodo.dataset.mediaLayout = valor.layout || 'wide';

      const enlace = document.createElement('a');
      enlace.className = 'attachment-card';
      enlace.href = url;
      enlace.title = `Descargar ${nombre}`;

      const visual = document.createElement('span');
      visual.className = 'attachment-visual';
      if (tipo.startsWith('image/') && valor.previewUrl) {
        const imagen = document.createElement('img');
        imagen.src = valor.previewUrl;
        imagen.alt = '';
        visual.appendChild(imagen);
      } else {
        visual.textContent = tipoArchivo(tipo, nombre).slice(0, 3).toUpperCase();
      }

      const informacion = document.createElement('span');
      informacion.className = 'attachment-info';
      const titulo = document.createElement('strong');
      titulo.textContent = nombre;
      const detalle = document.createElement('small');
      detalle.textContent = `${tipoArchivo(tipo, nombre)} · ${tamanioLegible(tamanio)}`;
      informacion.append(titulo, detalle);

      const accion = document.createElement('span');
      accion.className = 'attachment-action';
      accion.textContent = 'Descargar';
      enlace.append(visual, informacion, accion);
      nodo.appendChild(enlace);
      return nodo;
    }

    static value(nodo) {
      return {
        url: nodo.dataset.url || nodo.querySelector('a')?.getAttribute('href') || '',
        nombre: nodo.dataset.name || 'Archivo adjunto',
        tipo: nodo.dataset.type || 'application/octet-stream',
        tamanio: Number(nodo.dataset.size) || 0
      };
    }

    static formats(nodo) {
      return {
        mediaAlign: nodo.dataset.mediaAlign || 'left',
        mediaLayout: nodo.dataset.mediaLayout || 'wide'
      };
    }

    format(nombre, valor) {
      if (nombre === 'mediaAlign') this.domNode.dataset.mediaAlign = valor || 'left';
      else if (nombre === 'mediaLayout') this.domNode.dataset.mediaLayout = valor || 'wide';
      else super.format(nombre, valor);
    }
    }

    Quill.register(AdjuntoBlot);
  }

  if (!Quill.imports?.['formats/youtube']) {
    class YoutubeBlot extends BlockEmbed {
      static blotName = 'youtube';
      static tagName = 'figure';
      static className = 'ql-youtube';

      static create(valor = {}) {
        const nodo = super.create();
        const src = String(typeof valor === 'string' ? valor : valor.src || '');
        nodo.setAttribute('contenteditable', 'false');
        nodo.setAttribute('draggable', 'true');
        nodo.dataset.src = src;
        nodo.dataset.mediaAlign = valor.align || 'center';
        nodo.dataset.mediaLayout = valor.layout || 'wide';

        const iframe = document.createElement('iframe');
        iframe.className = 'ql-video';
        iframe.src = src;
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.title = 'Video de YouTube';
        const control = document.createElement('span');
        control.className = 'media-select-handle';
        control.textContent = 'Mover o ajustar video';
        nodo.append(iframe, control);
        return nodo;
      }

      static value(nodo) {
        return { src: nodo.dataset.src || nodo.querySelector('iframe')?.getAttribute('src') || '' };
      }

      static formats(nodo) {
        return {
          mediaAlign: nodo.dataset.mediaAlign || 'center',
          mediaLayout: nodo.dataset.mediaLayout || 'wide'
        };
      }

      format(nombre, valor) {
        if (nombre === 'mediaAlign') this.domNode.dataset.mediaAlign = valor || 'center';
        else if (nombre === 'mediaLayout') this.domNode.dataset.mediaLayout = valor || 'wide';
        else super.format(nombre, valor);
      }
    }

    Quill.register(YoutubeBlot);
  }
}

const props = defineProps({
  modelValue: { type: String, default: '' },
  allowYoutube: { type: Boolean, default: false },
  uploadUrl: { type: String, default: '' },
  authToken: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue']);
const editorWrap = ref(null);
const selectorArchivo = ref(null);
const subiendoArchivo = ref(false);
const errorAdjunto = ref('');
const arrastrandoArchivo = ref(false);
const quillDisponible = ref(false);
const objetoSeleccionado = shallowRef(null);
const estadoObjeto = ref(0);
let editor = null;
let quillConstructor = null;
let observador = null;
let profundidadArrastre = 0;
let multimediaArrastrada = null;
const urlsTemporales = new Set();

const contenido = computed({
  get: () => props.modelValue || '',
  set: valor => emit('update:modelValue', valor)
});

const tipoObjetoSeleccionado = computed(() => objetoSeleccionado.value?.classList.contains('ql-youtube') ? 'Video de YouTube' : 'Archivo adjunto');
const alineacionActual = computed(() => {
  estadoObjeto.value;
  return objetoSeleccionado.value?.dataset.mediaAlign || 'left';
});
const tamanioActual = computed(() => {
  estadoObjeto.value;
  return objetoSeleccionado.value?.dataset.mediaLayout || 'wide';
});
const puedeSubirObjeto = computed(() => {
  estadoObjeto.value;
  return Boolean(objetoSeleccionado.value?.previousElementSibling);
});
const puedeBajarObjeto = computed(() => {
  estadoObjeto.value;
  return Boolean(objetoSeleccionado.value?.nextElementSibling);
});

const barra = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ size: ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ script: 'sub' }, { script: 'super' }],
  [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'link', 'clean']
];

function indiceInsercion() {
  const seleccion = editor?.getSelection(true);
  return seleccion ? seleccion.index + seleccion.length : Math.max(0, (editor?.getLength() || 1) - 1);
}

function insertarAdjunto(archivo) {
  if (!editor) return;
  const indice = indiceInsercion();
  editor.insertEmbed(indice, 'adjunto', archivo, 'user');
  editor.insertText(indice + 1, '\n', 'user');
  editor.setSelection(indice + 2, 0, 'silent');
}

function insertarYoutube(embed) {
  if (!editor) return;
  const indice = indiceInsercion();
  editor.insertEmbed(indice, 'youtube', { src: embed, align: 'center', layout: 'wide' }, 'user');
  editor.insertText(indice + 1, '\n', 'user');
  editor.setSelection(indice + 2, 0, 'silent');
}

function agregarYoutube() {
  errorAdjunto.value = '';
  const enlace = window.prompt('Pegá el enlace del video de YouTube:');
  if (enlace === null) return;
  const embed = urlYoutube(enlace);
  if (!embed) {
    errorAdjunto.value = 'El enlace de YouTube no es válido.';
    return;
  }
  insertarYoutube(embed);
}

function pegarEnEditor(evento) {
  if (!props.allowYoutube) return;
  const texto = evento.clipboardData?.getData('text/plain')?.trim() || '';
  const embed = urlYoutube(texto);
  if (!embed) return;
  evento.preventDefault();
  errorAdjunto.value = '';
  insertarYoutube(embed);
}

async function subirUnArchivo(archivo) {
  if (archivo.size > MAX_ARCHIVO_BYTES) {
    throw new Error(`${archivo.name}: supera el máximo de 4 MB.`);
  }

  const respuesta = await fetch(props.uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${props.authToken}`,
      'Content-Type': archivo.type || 'application/octet-stream',
      'X-File-Name': encodeURIComponent(archivo.name)
    },
    body: archivo
  });
  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.error || `No se pudo subir ${archivo.name}.`);

  let previewUrl = '';
  const tipo = datos.tipo || archivo.type || 'application/octet-stream';
  if (tipo.startsWith('image/')) {
    previewUrl = URL.createObjectURL(archivo);
    urlsTemporales.add(previewUrl);
  }
  insertarAdjunto({
    url: datos.url,
    nombre: datos.nombre || archivo.name,
    tipo,
    tamanio: datos.tamanio ?? archivo.size,
    previewUrl
  });
}

async function procesarArchivos(lista) {
  const archivos = Array.from(lista || []);
  if (!archivos.length || !props.uploadUrl || subiendoArchivo.value) return;
  errorAdjunto.value = '';
  subiendoArchivo.value = true;
  const errores = [];
  for (const archivo of archivos) {
    try {
      await subirUnArchivo(archivo);
    } catch (e) {
      errores.push(e.message || `No se pudo subir ${archivo.name}.`);
    }
  }
  errorAdjunto.value = errores.join(' ');
  subiendoArchivo.value = false;
}

async function subirArchivo(evento) {
  const archivos = evento.target.files;
  evento.target.value = '';
  await procesarArchivos(archivos);
}

function contieneArchivos(evento) {
  return Array.from(evento.dataTransfer?.types || []).includes('Files');
}

function entrarArrastre(evento) {
  if (!props.uploadUrl || !contieneArchivos(evento)) return;
  profundidadArrastre += 1;
  arrastrandoArchivo.value = true;
}

function salirArrastre() {
  profundidadArrastre = Math.max(0, profundidadArrastre - 1);
  if (!profundidadArrastre) arrastrandoArchivo.value = false;
}

function soltarContenido(evento) {
  profundidadArrastre = 0;
  arrastrandoArchivo.value = false;
  if (props.uploadUrl && contieneArchivos(evento)) {
    procesarArchivos(evento.dataTransfer.files);
    return;
  }
  if (!multimediaArrastrada) return;
  const editorDom = editor?.root;
  let destino = evento.target.closest?.('.ql-editor > *');
  if (destino === multimediaArrastrada) return;
  const blotOrigen = quillConstructor?.find(multimediaArrastrada);
  const operacion = blotOrigen && editor?.getContents(editor.getIndex(blotOrigen), 1).ops[0];
  if (!operacion) return;
  const origen = editor.getIndex(blotOrigen);
  let indiceDestino = Math.max(0, editor.getLength() - 1);
  if (destino && editorDom?.contains(destino)) {
    const blotDestino = quillConstructor?.find(destino);
    const mitad = destino.getBoundingClientRect().top + destino.getBoundingClientRect().height / 2;
    indiceDestino = editor.getIndex(blotDestino) + (evento.clientY < mitad ? 0 : blotDestino.length());
  }
  editor.deleteText(origen, 1, 'user');
  if (indiceDestino > origen) indiceDestino -= 1;
  editor.updateContents({ ops: [
    ...(indiceDestino ? [{ retain: indiceDestino }] : []),
    operacion
  ] }, 'user');
  const blotActual = editor.getLeaf(indiceDestino)?.[0];
  seleccionarObjeto(blotActual?.domNode?.closest?.('.ql-attachment, .ql-youtube') || null);
  multimediaArrastrada = null;
}

function seleccionarObjeto(nodo) {
  if (objetoSeleccionado.value && objetoSeleccionado.value !== nodo) {
    objetoSeleccionado.value.style.outline = '';
    objetoSeleccionado.value.style.outlineOffset = '';
  }
  objetoSeleccionado.value = nodo || null;
  if (nodo) {
    nodo.style.outline = '2px solid var(--terracota)';
    nodo.style.outlineOffset = '3px';
  }
  estadoObjeto.value += 1;
}

function manejarClickEditor(evento) {
  if (!evento.target.closest?.('.ql-editor')) return;
  const objeto = evento.target.closest?.('.ql-attachment, .ql-youtube');
  if (evento.target.closest?.('.ql-attachment a')) evento.preventDefault();
  seleccionarObjeto(objeto);
}

function aplicarFormatoObjeto(nombre, valor) {
  const nodo = objetoSeleccionado.value;
  const blot = nodo && quillConstructor?.find(nodo);
  if (!blot || !editor) return;
  const indice = editor.getIndex(blot);
  blot.format(nombre, valor);
  editor.update('user');
  const blotActual = editor.getLeaf(indice)?.[0];
  seleccionarObjeto(blotActual?.domNode?.closest?.('.ql-attachment, .ql-youtube') || nodo);
}

function moverObjeto(direccion) {
  const nodo = objetoSeleccionado.value;
  const blot = nodo && quillConstructor?.find(nodo);
  const destino = direccion < 0 ? blot?.prev : blot?.next;
  if (!destino?.domNode || !editor) return;
  const origen = editor.getIndex(blot);
  const operacion = editor.getContents(origen, 1).ops[0];
  let indiceDestino = direccion < 0
    ? editor.getIndex(destino)
    : editor.getIndex(destino) + destino.length();
  editor.deleteText(origen, 1, 'user');
  if (indiceDestino > origen) indiceDestino -= 1;
  editor.updateContents({ ops: [
    ...(indiceDestino ? [{ retain: indiceDestino }] : []),
    operacion
  ] }, 'user');
  const blotActual = editor.getLeaf(indiceDestino)?.[0];
  seleccionarObjeto(blotActual?.domNode?.closest?.('.ql-attachment, .ql-youtube') || null);
}

function iniciarMovimiento(evento) {
  const objeto = evento.target.closest?.('.ql-attachment, .ql-youtube');
  if (!objeto) return;
  multimediaArrastrada = objeto;
  seleccionarObjeto(objeto);
  evento.dataTransfer.effectAllowed = 'move';
  evento.dataTransfer.setData('text/plain', 'mover-multimedia');
}

function terminarMovimiento() {
  multimediaArrastrada = null;
}

async function hidratarMiniaturas() {
  const adjuntos = editor?.root?.querySelectorAll('.ql-attachment[data-type^="image/"]') || [];
  for (const adjunto of adjuntos) {
    const visual = adjunto.querySelector('.attachment-visual');
    const url = adjunto.dataset.url;
    if (!visual || visual.querySelector('img') || !url) continue;
    try {
      const respuesta = await fetch(url, {
        headers: props.authToken ? { Authorization: `Bearer ${props.authToken}` } : {}
      });
      if (!respuesta.ok) continue;
      const previewUrl = URL.createObjectURL(await respuesta.blob());
      urlsTemporales.add(previewUrl);
      const imagen = document.createElement('img');
      imagen.src = previewUrl;
      imagen.alt = '';
      visual.textContent = '';
      visual.appendChild(imagen);
    } catch {
      // La tarjeta sigue siendo utilizable aunque no se pueda cargar su miniatura.
    }
  }
}

function editorListo(instancia) {
  editor = instancia;
  editor.root.addEventListener('paste', pegarEnEditor);
  editor.root.querySelectorAll('.ql-attachment, .ql-youtube').forEach(nodo => nodo.setAttribute('draggable', 'true'));
  const videosHeredados = Array.from(editor.root.querySelectorAll(':scope > iframe.ql-video'));
  videosHeredados.reverse().forEach(iframe => {
    const blot = quillConstructor?.find(iframe);
    if (!blot) return;
    const indice = editor.getIndex(blot);
    const src = iframe.getAttribute('src');
    editor.deleteText(indice, 1, 'silent');
    editor.insertEmbed(indice, 'youtube', { src, align: 'center', layout: 'wide' }, 'user');
  });
  nextTick(hidratarMiniaturas);
}

function protegerBotonesToolbar() {
  editorWrap.value?.querySelectorAll('.ql-toolbar button').forEach(boton => {
    boton.setAttribute('type', 'button');
  });
}

onMounted(async () => {
  quillConstructor = await loadQuill();
  registrarMultimedia(quillConstructor);
  quillDisponible.value = true;
  await nextTick();
  protegerBotonesToolbar();
  if (editorWrap.value) {
    observador = new MutationObserver(protegerBotonesToolbar);
    observador.observe(editorWrap.value, { childList: true, subtree: true });
  }
});

onBeforeUnmount(() => {
  observador?.disconnect();
  editor?.root?.removeEventListener('paste', pegarEnEditor);
  seleccionarObjeto(null);
  urlsTemporales.forEach(url => URL.revokeObjectURL(url));
  urlsTemporales.clear();
});
</script>

<template>
  <div
    ref="editorWrap"
    class="rich-text-editor"
    :class="{ 'is-dragging': arrastrandoArchivo }"
    @mousedown.stop
    @click.stop="manejarClickEditor"
    @dragstart.stop="iniciarMovimiento"
    @dragend="terminarMovimiento"
    @dragenter.prevent="entrarArrastre"
    @dragover.prevent
    @dragleave.prevent="salirArrastre"
    @drop.prevent="soltarContenido"
  >
    <div v-if="arrastrandoArchivo" class="drop-overlay" aria-hidden="true">
      <strong>Soltá los archivos para subirlos</strong>
      <span>Se agregarán al contenido de la clase</span>
    </div>
    <div v-if="allowYoutube || uploadUrl" class="editor-insertions" aria-label="Insertar contenido">
      <button v-if="uploadUrl" type="button" :disabled="subiendoArchivo" @click="selectorArchivo?.click()">
        {{ subiendoArchivo ? 'Subiendo…' : '📎 Adjuntar archivo' }}
      </button>
      <input
        v-if="uploadUrl"
        ref="selectorArchivo"
        class="file-input"
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.webp"
        @change="subirArchivo"
      >
      <button v-if="allowYoutube" type="button" @click="agregarYoutube">▶ Agregar YouTube</button>
      <small v-if="uploadUrl">Arrastrá archivos acá · hasta 4 MB cada uno</small>
    </div>
    <div v-if="objetoSeleccionado" class="media-object-toolbar" aria-label="Posición del objeto seleccionado">
      <strong>{{ tipoObjetoSeleccionado }}</strong>
      <span class="media-tool-group">
        <button type="button" :disabled="!puedeSubirObjeto" title="Mover hacia arriba" @click="moverObjeto(-1)">↑ Subir</button>
        <button type="button" :disabled="!puedeBajarObjeto" title="Mover hacia abajo" @click="moverObjeto(1)">↓ Bajar</button>
      </span>
      <span class="media-tool-group" aria-label="Alineación">
        <button type="button" :class="{ active: alineacionActual === 'left' }" title="Alinear a la izquierda" @click="aplicarFormatoObjeto('mediaAlign', 'left')">Izquierda</button>
        <button type="button" :class="{ active: alineacionActual === 'center' }" title="Centrar" @click="aplicarFormatoObjeto('mediaAlign', 'center')">Centro</button>
        <button type="button" :class="{ active: alineacionActual === 'right' }" title="Alinear a la derecha" @click="aplicarFormatoObjeto('mediaAlign', 'right')">Derecha</button>
      </span>
      <span class="media-tool-group" aria-label="Tamaño">
        <button type="button" :class="{ active: tamanioActual === 'compact' }" @click="aplicarFormatoObjeto('mediaLayout', 'compact')">Pequeño</button>
        <button type="button" :class="{ active: tamanioActual === 'medium' }" @click="aplicarFormatoObjeto('mediaLayout', 'medium')">Mediano</button>
        <button type="button" :class="{ active: tamanioActual === 'wide' }" @click="aplicarFormatoObjeto('mediaLayout', 'wide')">Ancho</button>
      </span>
      <small>También podés arrastrarlo dentro del contenido</small>
    </div>
    <p v-if="errorAdjunto" class="attachment-error" role="alert">{{ errorAdjunto }}</p>
    <QuillEditor
      v-if="quillDisponible"
      v-model:content="contenido"
      content-type="html"
      theme="snow"
      :toolbar="barra"
      placeholder="Escribí el contenido del módulo…"
      @ready="editorListo"
    />
  </div>
</template>

<style scoped>
.rich-text-editor { position:relative; }
.drop-overlay { position:absolute; z-index:2200; inset:0; display:grid; place-content:center; gap:4px; padding:24px; border:3px dashed var(--terracota); border-radius:9px; background:rgba(255,247,242,.96); color:var(--tinta); text-align:center; pointer-events:none; }
.drop-overlay strong { font:700 17px 'Work Sans',sans-serif; }
.drop-overlay span { color:#746d62; font-size:13px; }
.editor-insertions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; padding:10px 12px; border:1px solid var(--borde); border-bottom:0; border-radius:9px 9px 0 0; background:#f4efe4; }
.editor-insertions button { padding:7px 11px; border:1px solid #b8c9b5; border-radius:7px; background:#fff; color:var(--verde); font:700 13px 'Work Sans',sans-serif; cursor:pointer; }
.editor-insertions button:hover { background:var(--salvia); }
.editor-insertions button:disabled { opacity:.6; cursor:wait; }
.editor-insertions small { margin-left:auto; color:#746d62; font-size:12px; }
.media-object-toolbar { display:flex; align-items:center; flex-wrap:wrap; gap:8px 12px; padding:9px 12px; border:1px solid #d7ad9f; border-bottom:0; background:#fff7f2; color:var(--tinta); }
.media-object-toolbar strong { font-size:13px; }
.media-object-toolbar small { margin-left:auto; color:#746d62; font-size:11px; }
.media-tool-group { display:inline-flex; overflow:hidden; border:1px solid #d7cfc1; border-radius:7px; }
.media-tool-group button { min-height:30px; padding:5px 8px; border:0; border-right:1px solid #d7cfc1; background:#fff; color:var(--verde); font:700 11px 'Work Sans',sans-serif; cursor:pointer; }
.media-tool-group button:last-child { border-right:0; }
.media-tool-group button:hover:not(:disabled),.media-tool-group button.active { background:var(--verde); color:#fff; }
.media-tool-group button:disabled { opacity:.4; cursor:not-allowed; }
.file-input { display:none; }
.attachment-error { margin:0; padding:8px 12px; border:1px solid #d9a493; border-bottom:0; background:#fff2ed; color:#8f321f; font-size:13px; }
:deep(.ql-toolbar.ql-snow),
:deep(.ql-container.ql-snow) { box-sizing:border-box; }
:deep(.ql-toolbar.ql-snow) { border-color:var(--borde); border-radius:9px 9px 0 0; background:var(--crema); }
.editor-insertions ~ :deep(.ql-toolbar.ql-snow),
.attachment-error ~ :deep(.ql-toolbar.ql-snow) { border-radius:0; }
:deep(.ql-toolbar .ql-picker-options) { z-index:2100; }
:deep(.ql-container.ql-snow) { min-height:300px; border-color:#C9C2B3; border-radius:0 0 9px 9px; background:#fff; font-family:'Work Sans',sans-serif; font-size:16px; }
:deep(.ql-editor) { min-height:300px; line-height:1.65; color:var(--tinta); }
:deep(.ql-editor h1),
:deep(.ql-editor h2),
:deep(.ql-editor h3),
:deep(.ql-editor h4),
:deep(.ql-editor h5),
:deep(.ql-editor h6) { font-family:Fraunces,serif; line-height:1.18; color:var(--tinta); }
:deep(.ql-editor h1) { font-size:34px; }
:deep(.ql-editor h2) { font-size:28px; }
:deep(.ql-editor h3) { font-size:24px; }
:deep(.ql-editor h4) { font-size:20px; }
:deep(.ql-editor h5) { font-size:17px; }
:deep(.ql-editor h6) { font-size:15px; text-transform:uppercase; letter-spacing:.08em; color:#746D62; }
:deep(.ql-editor blockquote) { border-left-color:var(--terracota); background:#fff7f2; border-radius:8px; padding:10px 14px; }
:deep(.ql-editor iframe.ql-video) { display:block; width:min(100%,720px); aspect-ratio:16 / 9; height:auto; margin:18px auto; border:0; border-radius:10px; }
:deep(.ql-attachment),:deep(.ql-youtube) { position:relative; width:min(100%,720px); margin:14px 0; transition:width .2s ease,margin .2s ease; }
:deep([data-media-layout="compact"]) { width:min(100%,360px); }
:deep([data-media-layout="medium"]) { width:min(100%,540px); }
:deep([data-media-layout="wide"]) { width:min(100%,720px); }
:deep([data-media-align="left"]) { margin-left:0; margin-right:auto; }
:deep([data-media-align="center"]) { margin-left:auto; margin-right:auto; }
:deep([data-media-align="right"]) { margin-left:auto; margin-right:0; }
:deep(.ql-youtube iframe.ql-video) { width:100%; max-width:none; margin:0; }
:deep(.media-select-handle) { position:absolute; z-index:2; top:8px; right:8px; padding:6px 9px; border-radius:7px; background:rgba(30,61,49,.92); color:#fff; font:700 11px 'Work Sans',sans-serif; cursor:move; }
:deep(.attachment-card) { display:flex; align-items:center; gap:12px; min-height:74px; padding:10px; border:1px solid #b8c9b5; border-radius:11px; background:#f1f5ed; color:var(--tinta); text-decoration:none; cursor:default; }
:deep(.attachment-visual) { flex:0 0 68px; display:grid; place-items:center; width:68px; height:52px; overflow:hidden; border-radius:8px; background:#dfe8da; color:var(--verde); font:800 13px 'Work Sans',sans-serif; letter-spacing:.04em; }
:deep(.attachment-visual img) { width:100%; height:100%; object-fit:cover; }
:deep(.attachment-info) { display:flex; flex:1; min-width:0; flex-direction:column; line-height:1.35; }
:deep(.attachment-info strong) { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
:deep(.attachment-info small) { margin-top:3px; color:#746d62; font-size:12px; }
:deep(.attachment-action) { padding:7px 10px; border-radius:7px; background:#fff; color:var(--verde); font-size:12px; font-weight:700; }
:deep(.ql-snow .ql-stroke) { stroke:var(--verde); }
:deep(.ql-snow .ql-fill) { fill:var(--verde); }
:deep(.ql-snow .ql-picker) { color:var(--verde); }

@media(max-width:600px) {
  .editor-insertions { align-items:stretch; }
  .editor-insertions button { flex:1 1 180px; }
  .editor-insertions small { width:100%; margin-left:0; }
  .media-object-toolbar { align-items:flex-start; }
  .media-object-toolbar strong,.media-object-toolbar small { width:100%; margin-left:0; }
  .media-tool-group { max-width:100%; }
  .media-tool-group button { padding:5px 6px; }
  :deep(.attachment-action) { display:none; }
}
</style>
