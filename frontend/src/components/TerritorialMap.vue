<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const props = defineProps({ organizaciones: { type: Array, default: () => [] } });
let mapa;
let capa;
const esc = valor => String(valor || '').replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
const zona = ref('');
const tipo = ref('');
const activa = ref(null);
const colores = { Asociacion:'#3A7680', Cooperativa:'#40624E', Produccion:'#DEA23B', Emprendimiento:'#BE5A3C', Mutual:'#7A65A5', 'Asociación civil':'#3A7680' };
const lista = computed(() => props.organizaciones.filter(org => (!zona.value || org.zona === zona.value) && (!tipo.value || org.tipo === tipo.value)));
const zonas = computed(() => [...new Set(props.organizaciones.map(org => org.zona).filter(Boolean))]);
const tipos = computed(() => [...new Set(props.organizaciones.map(org => org.tipo).filter(Boolean))]);

function dibujar() {
  if (!mapa) return;
  capa?.clearLayers();
  capa = L.layerGroup().addTo(mapa);
  lista.value.filter(org => org.lat != null && org.lng != null).forEach(org => {
    const etiquetas = (org.tags || []).map(tag => `<span class="map-tag">${esc(tag)}</span>`).join('');
    const contenido = `<div class="map-popup">${org.destacado ? '<small>Organización destacada</small>' : ''}<strong>${esc(org.nombre)}</strong><span>Ubicación: ${esc(org.localidad)} · ${esc(org.zona)}</span><p>${esc(org.descripcion)}</p><div>${etiquetas}</div></div>`;
    const icono = L.divIcon({ className:'map-pin-wrap', html:`<span class="map-pin" style="background:${colores[org.tipo] || '#40624E'}"></span>`, iconSize:[24,24], iconAnchor:[12,12] });
    const marker = L.marker([org.lat, org.lng], { icon:icono }).bindPopup(contenido, { maxWidth: 300 }).addTo(capa);
    marker.on('click', () => { activa.value = org.id || org.nombre; });
  });
}
function enfocar(org) { if (!mapa || org.lat == null || org.lng == null) return; activa.value = org.id || org.nombre; mapa.setView([org.lat,org.lng], 13, { animate:true }); capa.eachLayer(marker => { if (marker.getLatLng && marker.getLatLng().lat === org.lat && marker.getLatLng().lng === org.lng) marker.openPopup(); }); }
function limpiar() { zona.value=''; tipo.value=''; }

onMounted(() => {
  mapa = L.map('mapa-vitrina').setView([-43.30, -65.10], 11);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(mapa);
  dibujar();
});
watch([() => props.organizaciones, zona, tipo], dibujar, { deep: true });
onUnmounted(() => mapa?.remove());
</script>

<template>
  <div class="map-filters"><select v-model="zona"><option value="">Todas las zonas</option><option v-for="z in zonas" :key="z">{{ z }}</option></select><select v-model="tipo"><option value="">Todos los tipos</option><option v-for="t in tipos" :key="t">{{ t }}</option></select><button @click="limpiar">Limpiar</button><span>Mostrando <strong>{{ lista.length }}</strong> organizaciones</span></div>
  <div class="map-layout"><div class="map-frame"><div id="mapa-vitrina" aria-label="Mapa territorial de organizaciones"></div><div class="map-legend"><strong>Referencias</strong><span v-for="t in tipos" :key="t"><i :style="{ background: colores[t] || '#40624E' }"></i>{{ t }}</span></div></div><aside class="map-list"><strong>Lista</strong><button v-for="org in lista" :key="org.id || org.nombre" :class="{ activa: activa === (org.id || org.nombre) }" @click="enfocar(org)"><small>{{ org.tipo }} · {{ org.zona }}</small><b>{{ org.nombre }}</b><span>Ubicación: {{ org.localidad }}</span><div><em v-for="tag in org.tags || []" :key="tag">{{ tag }}</em></div></button><p v-if="!lista.length">No hay organizaciones con esos filtros.</p></aside></div>
</template>
