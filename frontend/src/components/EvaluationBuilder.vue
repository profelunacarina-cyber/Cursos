<script setup>
import { computed } from 'vue';
import { PlusCircle, Trash } from '@primeicons/vue';

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  maxQuestions: { type: Number, default: 40 },
  exactQuestions: { type: Number, default: 0 }
});
const emit = defineEmits(['update:modelValue']);
const configuracion = computed(() => ({ ...props.modelValue, preguntas: Array.isArray(props.modelValue?.preguntas) ? props.modelValue.preguntas : [] }));

function id() { return `pregunta-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }
function emitir(preguntas) { emit('update:modelValue', { ...props.modelValue, preguntas }); }
function nuevaPregunta() {
  if (configuracion.value.preguntas.length >= props.maxQuestions) return;
  emitir([...configuracion.value.preguntas, { id: id(), enunciado: '', tipo: 'opcion_multiple', opciones: [{ texto: '', correcta: true }, { texto: '', correcta: false }] }]);
}
function quitarPregunta(indice) { emitir(configuracion.value.preguntas.filter((_, i) => i !== indice)); }
function actualizar() { emitir([...configuracion.value.preguntas]); }
function cambiarTipo(pregunta) {
  pregunta.opciones = pregunta.tipo === 'verdadero_falso'
    ? [{ texto: 'Verdadero', correcta: true }, { texto: 'Falso', correcta: false }]
    : [{ texto: '', correcta: true }, { texto: '', correcta: false }];
  actualizar();
}
function agregarOpcion(pregunta) { pregunta.opciones.push({ texto: '', correcta: false }); actualizar(); }
function quitarOpcion(pregunta, indice) { if (pregunta.opciones.length <= 2) return; pregunta.opciones.splice(indice, 1); if (!pregunta.opciones.some(o => o.correcta)) pregunta.opciones[0].correcta = true; actualizar(); }
function marcarCorrecta(pregunta, indice) { pregunta.opciones.forEach((opcion, i) => { opcion.correcta = i === indice; }); actualizar(); }
</script>

<template>
  <section class="evaluation-builder">
    <div class="builder-head"><div><h3>Preguntas de la evaluación</h3><p>Armá preguntas de opción múltiple o verdadero/falso. Marcá una respuesta correcta por pregunta.</p><strong v-if="exactQuestions" class="question-count" :class="{ complete: configuracion.preguntas.length === exactQuestions }">{{ configuracion.preguntas.length }} de {{ exactQuestions }} preguntas</strong></div><button type="button" class="button button-icon" :disabled="configuracion.preguntas.length >= maxQuestions" @click="nuevaPregunta"><PlusCircle :size="19" /> Agregar pregunta</button></div>
    <article v-for="(pregunta, indice) in configuracion.preguntas" :key="pregunta.id || indice" class="question-card">
      <div class="question-top"><strong>Pregunta {{ indice + 1 }}</strong><button type="button" class="remove-button" @click="quitarPregunta(indice)"><Trash :size="15" /> Eliminar</button></div>
      <label>Enunciado<textarea v-model="pregunta.enunciado" rows="3" placeholder="Escribí la pregunta" @input="actualizar"></textarea></label>
      <label>Tipo<select v-model="pregunta.tipo" @change="cambiarTipo(pregunta)"><option value="opcion_multiple">Opción múltiple</option><option value="verdadero_falso">Verdadero / Falso</option></select></label>
      <div class="options"><label v-for="(opcion, opcionIndice) in pregunta.opciones" :key="opcionIndice" class="option-row"><input :checked="opcion.correcta" type="radio" :name="`correcta-${pregunta.id || indice}`" @change="marcarCorrecta(pregunta, opcionIndice)"><input v-model="opcion.texto" :disabled="pregunta.tipo === 'verdadero_falso'" :placeholder="`Opción ${opcionIndice + 1}`" @input="actualizar"><button v-if="pregunta.tipo === 'opcion_multiple'" type="button" class="remove-option" :disabled="pregunta.opciones.length <= 2" @click="quitarOpcion(pregunta, opcionIndice)"><Trash :size="14" /></button></label></div>
      <button v-if="pregunta.tipo === 'opcion_multiple'" type="button" class="add-option" @click="agregarOpcion(pregunta)"><PlusCircle :size="16" /> Agregar opción</button>
    </article>
    <p v-if="!configuracion.preguntas.length" class="empty-copy">Todavía no hay preguntas. Agregá la primera para construir la evaluación.</p>
  </section>
</template>

<style scoped>
.evaluation-builder { display:grid; gap:16px; padding:20px; border:1px solid #B8C9B5; border-radius:12px; background:#F1F5ED; }.builder-head,.question-top { display:flex; align-items:center; justify-content:space-between; gap:16px; }.builder-head h3,.builder-head p { margin:0; }.builder-head p { max-width:520px; color:#746D62; font-size:14px; }.question-count { display:block; margin-top:7px; color:#9B3C28; font-size:13px; }.question-count.complete { color:var(--verde); }.builder-head .button:disabled { opacity:.5; cursor:not-allowed; }.question-card { display:grid; gap:12px; padding:17px; border:1px solid var(--borde); border-radius:10px; background:#fffdf7; }.question-top strong { font-family:Fraunces,serif; font-size:18px; }.question-card label { display:grid; gap:6px; color:#4f4a42; font-weight:700; font-size:14px; }.question-card textarea,.question-card select,.option-row input[type="text"],.option-row input:not([type]) { width:100%; padding:10px; border:1px solid var(--borde); border-radius:7px; background:#fff; font:inherit; }.options { display:grid; gap:8px; }.option-row { display:grid !important; grid-template-columns:auto minmax(0,1fr) auto; align-items:center; gap:9px !important; }.option-row input[type="radio"] { width:16px; height:16px; }.option-row input:disabled { color:#746D62; background:#f3f0e9; }.remove-button,.remove-option,.add-option { display:inline-flex; align-items:center; gap:6px; border:0; background:transparent; color:#9B3C28; font:700 13px 'Work Sans',sans-serif; cursor:pointer; }.remove-option:disabled { opacity:.35; cursor:not-allowed; }.add-option { justify-self:start; color:var(--verde); }.button-icon { display:inline-flex; align-items:center; gap:7px; } @media(max-width:650px) { .builder-head,.question-top { align-items:flex-start; flex-direction:column; } }
</style>
