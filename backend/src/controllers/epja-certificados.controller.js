import { epjaCertificadosService } from '../services/epja-certificados.service.js';
export const epjaCertificadosController = {
  listar:async(req,res,next)=>{try{res.json(await epjaCertificadosService.listar(req.query.estudianteId));}catch(e){next(e);}},
  recorrido:async(req,res,next)=>{try{res.json(await epjaCertificadosService.recorrido(req.params.id));}catch(e){next(e);}},
  aprobarYEmitir:async(req,res,next)=>{try{res.json(await epjaCertificadosService.aprobarYEmitir(req.params.id,req.params.moduloId));}catch(e){next(e);}},
  revocar:async(req,res,next)=>{try{await epjaCertificadosService.revocar(req.params.id);res.status(204).end();}catch(e){next(e);}}
};
