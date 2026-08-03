// Capa de servicios: reglas de negocio de las organizaciones.
import { organizacionesRepo } from '../repositories/organizaciones.repo.js';
import { ErrorApp } from '../errores.js';

export const TIPOS = ['Asociacion', 'Cooperativa', 'Produccion', 'Emprendimiento', 'Mutual'];

// Pasos del recorrido guiado y el ícono (Tabler) por defecto de cada tipo.
export const TIPOS_ROOM = ['portal', 'narrativa', 'quiz', 'cierre'];
const ICONO_DEFECTO = { portal: 'ti-map-pin', narrativa: 'ti-message-2', quiz: 'ti-help-circle', cierre: 'ti-certificate' };

// El contenido del recorrido es texto plano (narración). Se limpia de etiquetas y se acota;
// en el mapa igual se escapa al renderizar, así no hay forma de inyectar HTML.
function textoPlano(v, max) {
  return String(v || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Deja el recorrido en pasos válidos y bien formados. Un icono sólo se acepta si es
// una clase Tabler (ti-...); si no, se usa el de por defecto según el tipo del paso.
function normalizarRooms(rooms) {
  if (!Array.isArray(rooms)) return [];
  return rooms
    .filter(r => r && TIPOS_ROOM.includes(r.tipo))
    .slice(0, 12)
    .map(r => {
      const icon = /^ti-[a-z0-9-]{1,40}$/.test(r.icon || '') ? r.icon : ICONO_DEFECTO[r.tipo];
      const base = {
        tipo: r.tipo, icon,
        titulo: textoPlano(r.titulo, 120),
        subtitulo: textoPlano(r.subtitulo, 160)
      };
      if (r.tipo === 'quiz') {
        const opciones = (Array.isArray(r.opciones) ? r.opciones : [])
          .map(o => ({ texto: textoPlano(o && o.texto, 200), correcta: Boolean(o && o.correcta) }))
          .filter(o => o.texto)
          .slice(0, 4);
        if (opciones.length < 2) throw new ErrorApp(400, 'Cada pregunta necesita al menos 2 opciones');
        if (!opciones.some(o => o.correcta)) throw new ErrorApp(400, 'Marcá cuál opción es la correcta en la pregunta');
        return {
          ...base,
          pregunta: textoPlano(r.pregunta, 400),
          opciones,
          feedbackCorrecta: textoPlano(r.feedbackCorrecta, 400),
          feedbackIncorrecta: textoPlano(r.feedbackIncorrecta, 400),
          cta: textoPlano(r.cta, 40) || 'Seguir el recorrido'
        };
      }
      const room = { ...base, cuerpo: textoPlano(r.cuerpo, 900) };
      if (r.tipo !== 'cierre') room.cta = textoPlano(r.cta, 40) || 'Continuar';
      return room;
    });
}

function coordenada(valor, min, max) {
  if (valor === '' || valor === null || valor === undefined) return null;
  const n = Number(valor);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new ErrorApp(400, `Coordenada fuera de rango (${min} a ${max})`);
  }
  return n;
}

function normalizar(datos) {
  const org = {
    nombre: String(datos.nombre || '').trim().slice(0, 120),
    tipo: TIPOS.includes(datos.tipo) ? datos.tipo : 'Emprendimiento',
    zona: String(datos.zona || 'Chubut').trim().slice(0, 60),
    localidad: String(datos.localidad || '').trim().slice(0, 80),
    descripcion: String(datos.descripcion || '').trim().slice(0, 800),
    tags: Array.isArray(datos.tags)
      ? datos.tags.map(t => String(t).trim()).filter(Boolean).slice(0, 8)
      : [],
    lat: coordenada(datos.lat, -90, 90),
    lng: coordenada(datos.lng, -180, 180),
    contacto: String(datos.contacto || '').trim().slice(0, 300),
    aprobado: Boolean(datos.aprobado),
    destacado: Boolean(datos.destacado),
    rooms: normalizarRooms(datos.rooms)
  };
  if (!org.nombre) throw new ErrorApp(400, 'El nombre es obligatorio');
  // Regla de negocio: una organización aprobada tiene que poder ubicarse en el mapa.
  if (org.aprobado && (org.lat === null || org.lng === null)) {
    throw new ErrorApp(400, 'Una organización aprobada necesita latitud y longitud');
  }
  return org;
}

export const organizacionesService = {
  listarPublicas() { return organizacionesRepo.listar({ soloAprobadas: true }); },
  listarTodas() { return organizacionesRepo.listar({ soloAprobadas: false }); },

  async crear(datos) {
    return organizacionesRepo.crear(normalizar(datos));
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const org = await organizacionesRepo.actualizar(id, normalizar(datos));
    if (!org) throw new ErrorApp(404, 'No existe una organización con ese id');
    return org;
  },

  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    if (!(await organizacionesRepo.eliminar(id))) {
      throw new ErrorApp(404, 'No existe una organización con ese id');
    }
  }
};
