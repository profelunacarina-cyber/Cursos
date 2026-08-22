import bcrypt from 'bcryptjs';
import { ErrorApp } from '../errores.js';
import { epjaEstudiantesRepo } from '../repositories/epja-estudiantes.repo.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';

function normalizarDni(dni) {
  const limpio = String(dni || '').replace(/\D+/g, '');
  if (limpio.length < 7 || limpio.length > 10) {
    throw new ErrorApp(400, 'El DNI debe tener entre 7 y 10 dígitos');
  }
  return limpio;
}

function texto(v, max, nombreCampo) {
  const limpio = String(v || '').trim().slice(0, max);
  if (!limpio) throw new ErrorApp(400, `«${nombreCampo}» es obligatorio`);
  return limpio;
}

function emailOpcional(valor) {
  const limpio = String(valor || '').trim().toLowerCase();
  if (!limpio) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    throw new ErrorApp(400, 'El correo no tiene un formato válido');
  }
  return limpio.slice(0, 160);
}

function activoDesdeValor(valor) {
  if (typeof valor === 'boolean') return valor;
  if (valor == null || valor === '') return true;
  const t = String(valor).trim().toLowerCase();
  return !['0', 'false', 'no', 'inactivo'].includes(t);
}

function normalizarCodigoMateria(codigo) {
  const limpio = String(codigo || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return limpio;
}

function parsearMaterias(materias) {
  if (Array.isArray(materias)) return materias.map(normalizarCodigoMateria).filter(Boolean);
  const bruto = String(materias || '').trim();
  if (!bruto) return [];
  return bruto
    .replace(/\by\b/gi, ',')
    .split(/[;,/|]+/)
    .map(normalizarCodigoMateria)
    .filter(Boolean);
}

async function resolverMaterias(materias) {
  const codigos = [...new Set(parsearMaterias(materias))];
  if (!codigos.length) throw new ErrorApp(400, 'Asigná al menos una materia');
  const disponibles = await epjaMateriasRepo.listar();
  const porCodigo = new Map(disponibles.map(m => [m.codigo, m]));
  const faltantes = codigos.filter(c => !porCodigo.has(c));
  if (faltantes.length) throw new ErrorApp(400, `Materias inválidas: ${faltantes.join(', ')}`);
  return codigos.map(c => porCodigo.get(c).id);
}

function claveInicial(valor, dni) {
  const limpia = String(valor || '').trim();
  return limpia || dni;
}

export const epjaEstudiantesService = {
  listar({ q = '', activo } = {}) {
    const filtroActivo =
      activo === undefined || activo === null || activo === ''
        ? null
        : activoDesdeValor(activo);
    return epjaEstudiantesRepo.listar({ busqueda: String(q || '').trim(), activo: filtroActivo });
  },

  async crear(datos) {
    const dni = normalizarDni(datos.dni);
    if (await epjaEstudiantesRepo.obtenerPorDni(dni)) {
      throw new ErrorApp(409, 'Ya existe un estudiante con ese DNI');
    }
    const email = emailOpcional(datos.email);
    if (email && await epjaEstudiantesRepo.obtenerPorEmail(email)) {
      throw new ErrorApp(409, 'Ya existe un estudiante con ese correo');
    }
    const materiaIds = await resolverMaterias(datos.materias);

    const estudiante = await epjaEstudiantesRepo.crear({
      dni,
      nombre: texto(datos.nombre, 80, 'nombre'),
      apellido: texto(datos.apellido, 80, 'apellido'),
      email,
      passwordHash: await bcrypt.hash(claveInicial(datos.password, dni), 10),
      activo: activoDesdeValor(datos.activo)
    });

    return epjaEstudiantesRepo.asignarMaterias(estudiante.id, materiaIds);
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const previo = await epjaEstudiantesRepo.obtener(id);
    if (!previo) throw new ErrorApp(404, 'No existe el estudiante');

    const dni = normalizarDni(datos.dni || previo.dni);
    const otro = await epjaEstudiantesRepo.obtenerPorDni(dni);
    if (otro && otro.id !== id) throw new ErrorApp(409, 'Ya existe otro estudiante con ese DNI');
    const email = emailOpcional(datos.email ?? previo.email);
    const otroEmail = email ? await epjaEstudiantesRepo.obtenerPorEmail(email) : null;
    if (otroEmail && otroEmail.id !== id) throw new ErrorApp(409, 'Ya existe otro estudiante con ese correo');

    const activoPresente =
      datos.activo !== undefined &&
      datos.activo !== null &&
      !(typeof datos.activo === 'string' && datos.activo.trim() === '');
    const materiaIds = datos.materias ? await resolverMaterias(datos.materias) : null;

    await epjaEstudiantesRepo.actualizar(id, {
      dni,
      nombre: texto(datos.nombre ?? previo.nombre, 80, 'nombre'),
      apellido: texto(datos.apellido ?? previo.apellido, 80, 'apellido'),
      email,
      activo: activoPresente ? activoDesdeValor(datos.activo) : previo.activo
    });

    if (datos.password) {
      await epjaEstudiantesRepo.actualizarPassword(id, await bcrypt.hash(claveInicial(datos.password, dni), 10));
    }

    if (materiaIds) {
      return epjaEstudiantesRepo.asignarMaterias(id, materiaIds);
    }
    return epjaEstudiantesRepo.obtener(id);
  },

  async asignarMaterias(id, materias) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const previo = await epjaEstudiantesRepo.obtener(id);
    if (!previo) throw new ErrorApp(404, 'No existe el estudiante');
    const materiaIds = await resolverMaterias(materias);
    return epjaEstudiantesRepo.asignarMaterias(id, materiaIds);
  },

  async resetClave(id, nuevaClave) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    const estudiante = await epjaEstudiantesRepo.obtener(id);
    if (!estudiante) throw new ErrorApp(404, 'No existe el estudiante');
    const clave = claveInicial(nuevaClave, estudiante.dni);
    await epjaEstudiantesRepo.actualizarPassword(id, await bcrypt.hash(clave, 10));
    return { ok: true, clave };
  },

  async eliminar(id) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id inválido');
    if (!(await epjaEstudiantesRepo.eliminar(id))) {
      throw new ErrorApp(404, 'No existe el estudiante');
    }
  },

  async importar(filas) {
    if (!Array.isArray(filas) || !filas.length) {
      throw new ErrorApp(400, 'No llegaron filas para importar');
    }

    const resumen = { creados: 0, actualizados: 0, errores: [] };

    for (let i = 0; i < filas.length; i++) {
      const fila = filas[i] || {};
      try {
        const dni = normalizarDni(fila.dni ?? fila.DNI ?? fila.documento);
        const payload = {
          dni,
          nombre: fila.nombre ?? fila.nombres,
          apellido: fila.apellido ?? fila.apellidos,
          email: fila.email ?? fila.correo,
          materias: fila.materias ?? fila.materia ?? fila.cursos,
          password: fila.clave_inicial ?? fila.clave ?? fila.password,
          activo: fila.activo
        };

        const existente = await epjaEstudiantesRepo.obtenerPorDni(dni);
        if (existente) {
          await this.actualizar(existente.id, payload);
          resumen.actualizados++;
        } else {
          await this.crear(payload);
          resumen.creados++;
        }
      } catch (e) {
        resumen.errores.push({
          fila: i + 2,
          error: e instanceof Error ? e.message : 'Error desconocido'
        });
      }
    }

    return resumen;
  }
};
