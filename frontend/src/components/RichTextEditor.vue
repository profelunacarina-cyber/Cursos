<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';

const props = defineProps({ modelValue: { type: String, default: '' } });
const emit = defineEmits(['update:modelValue']);
const editorWrap = ref(null);
let observador = null;

const contenido = computed({
  get: () => props.modelValue || '',
  set: valor => emit('update:modelValue', valor)
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

function protegerBotonesToolbar() {
  editorWrap.value?.querySelectorAll('.ql-toolbar button').forEach(boton => {
    boton.setAttribute('type', 'button');
  });
}

onMounted(async () => {
  await nextTick();
  protegerBotonesToolbar();
  if (editorWrap.value) {
    observador = new MutationObserver(protegerBotonesToolbar);
    observador.observe(editorWrap.value, { childList: true, subtree: true });
  }
});

onBeforeUnmount(() => {
  observador?.disconnect();
});
</script>

<template>
  <div ref="editorWrap" class="rich-text-editor" @mousedown.stop @click.stop>
    <QuillEditor v-model:content="contenido" content-type="html" theme="snow" :toolbar="barra" placeholder="Escribí el contenido del módulo…" />
  </div>
</template>

<style scoped>
:deep(.ql-toolbar.ql-snow),
:deep(.ql-container.ql-snow) { box-sizing:border-box; }
:deep(.ql-toolbar.ql-snow) { border-color:var(--borde); border-radius:9px 9px 0 0; background:var(--crema); }
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
:deep(.ql-snow .ql-stroke) { stroke:var(--verde); }:deep(.ql-snow .ql-fill) { fill:var(--verde); }:deep(.ql-snow .ql-picker) { color:var(--verde); }
</style>
