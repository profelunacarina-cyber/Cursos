// Capa de servicios: reglas de negocio de las organizaciones.
import { organizacionesRepo } from '../repositories/organizaciones.repo.js';
import { ErrorApp } from '../errores.js';

export const TIPOS = ['Asociacion', 'Cooperativa', 'Produccion', 'Emprendimiento', 'Mutual'];

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
    destacado: Boolean(datos.destacado)
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
