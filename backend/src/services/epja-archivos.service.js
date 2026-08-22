import { randomUUID } from 'node:crypto';
import { ErrorApp } from '../errores.js';
import { epjaArchivosRepo } from '../repositories/epja-archivos.repo.js';

export const MAX_ARCHIVO_BYTES = 4 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const TIPO_POR_EXTENSION = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  txt: 'text/plain',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

function normalizarNombre(valor) {
  let nombre = String(valor || '').trim();
  try { nombre = decodeURIComponent(nombre); } catch { /* conserva el nombre recibido */ }
  nombre = nombre.replace(/[\\/\0\r\n]/g, '_').slice(0, 180);
  return nombre || 'archivo';
}

export const epjaArchivosService = {
  async crear({ nombre, tipoMime, contenido }) {
    if (!Buffer.isBuffer(contenido) || !contenido.length) {
      throw new ErrorApp(400, 'Seleccioná un archivo para subir');
    }
    if (contenido.length > MAX_ARCHIVO_BYTES) {
      throw new ErrorApp(413, 'El archivo supera el máximo de 4 MB');
    }
    const nombreLimpio = normalizarNombre(nombre);
    const extension = nombreLimpio.split('.').pop()?.toLowerCase();
    let tipo = String(tipoMime || 'application/octet-stream').split(';')[0].trim().toLowerCase();
    if (tipo === 'application/octet-stream' && TIPO_POR_EXTENSION[extension]) {
      tipo = TIPO_POR_EXTENSION[extension];
    }
    if (!TIPOS_PERMITIDOS.has(tipo)) {
      throw new ErrorApp(400, 'Ese tipo de archivo no está permitido');
    }
    return epjaArchivosRepo.crear({
      id: randomUUID(),
      nombre: nombreLimpio,
      tipoMime: tipo,
      contenido,
      tamanio: contenido.length
    });
  },

  async obtener(id) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(id || ''))) {
      throw new ErrorApp(400, 'Id de archivo inválido');
    }
    const archivo = await epjaArchivosRepo.obtener(id);
    if (!archivo) throw new ErrorApp(404, 'No existe el archivo');
    return archivo;
  }
};
