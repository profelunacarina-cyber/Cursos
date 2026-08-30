import { ErrorApp } from '../errores.js';
import { epjaMateriasRepo } from '../repositories/epja-materias.repo.js';

function colorSeguro(color) {
  const limpio = String(color || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(limpio) ? limpio : '#2E5638';
}

function normalizarCodigo(codigo) {
  return String(codigo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40);
}

export const epjaMateriasService = {
  listar() {
    return epjaMateriasRepo.listar();
  },

  async crear(datos) {
    const campo = normalizarCodigo(datos.campo || datos.codigo);
    if (!campo) throw new ErrorApp(400, 'La materia necesita un campo');
    const codigo = normalizarCodigo(datos.codigo || `${campo}-${datos.nombre}`);
    if (!codigo) throw new ErrorApp(400, 'La materia necesita un código');
    if (await epjaMateriasRepo.obtenerPorCodigo(codigo)) {
      throw new ErrorApp(409, 'Ya existe una materia con ese código');
    }

    const nombre = String(datos.nombre || '').trim().slice(0, 120);
    if (!nombre) throw new ErrorApp(400, 'La materia necesita un nombre');

    return epjaMateriasRepo.crear({
      codigo,
      campo,
      nombre,
      descripcion: String(datos.descripcion || '').trim().slice(0, 600),
      color: colorSeguro(datos.color),
      orden: Number.isInteger(datos.orden) ? datos.orden : null,
      activa: typeof datos.activa === 'boolean' ? datos.activa : true
    });
  },

  async actualizar(id, datos) {
    if (!Number.isInteger(id)) throw new ErrorApp(400, 'Id de materia inválido');
    const previa = await epjaMateriasRepo.obtener(id);
    if (!previa) throw new ErrorApp(404, 'No existe la materia');

    const materia = {
      nombre: String(datos.nombre || '').trim().slice(0, 120) || previa.nombre,
      campo: normalizarCodigo(datos.campo || previa.campo),
      descripcion: String(datos.descripcion || '').trim().slice(0, 600),
      color: colorSeguro(datos.color || previa.color),
      orden: Number.isInteger(datos.orden) ? datos.orden : previa.orden,
      activa: typeof datos.activa === 'boolean' ? datos.activa : previa.activa
    };
    return epjaMateriasRepo.actualizar(id, materia);
  }
};
