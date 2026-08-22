import { epjaArchivosService } from '../services/epja-archivos.service.js';

export const epjaArchivosController = {
  async crear(req, res, next) {
    try {
      const archivo = await epjaArchivosService.crear({
        nombre: req.headers['x-file-name'],
        tipoMime: req.headers['content-type'],
        contenido: req.body
      });
      res.status(201).json({
        id: archivo.id,
        nombre: archivo.nombre,
        tipo: archivo.tipoMime,
        tamanio: archivo.tamanio,
        url: `/api/epja/archivos/${archivo.id}`
      });
    } catch (e) { next(e); }
  },

  async descargar(req, res, next) {
    try {
      const archivo = await epjaArchivosService.obtener(req.params.id);
      res.setHeader('Content-Type', archivo.tipoMime);
      res.setHeader('Content-Length', archivo.tamanio);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.send(archivo.contenido);
    } catch (e) { next(e); }
  }
};
