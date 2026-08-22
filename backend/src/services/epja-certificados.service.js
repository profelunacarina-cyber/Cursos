import { ErrorApp } from '../errores.js';
import { epjaEstudiantesRepo } from '../repositories/epja-estudiantes.repo.js';
import { epjaCertificadosRepo } from '../repositories/epja-certificados.repo.js';

const entero = (valor, nombre) => { const n=Number(valor); if (!Number.isInteger(n)) throw new ErrorApp(400, `${nombre} inválido`); return n; };
export const epjaCertificadosService = {
  listar(estudianteId) { return epjaCertificadosRepo.listar(estudianteId ? entero(estudianteId, 'Estudiante') : null); },
  async recorrido(estudianteId) { const id=entero(estudianteId,'Estudiante'); if (!(await epjaEstudiantesRepo.obtener(id))) throw new ErrorApp(404,'No existe el estudiante'); return epjaCertificadosRepo.recorrido(id); },
  async aprobarYEmitir(estudianteId, moduloId) { const estudiante=entero(estudianteId,'Estudiante'); const modulo=entero(moduloId,'Módulo'); try { await epjaCertificadosRepo.aprobarYEmitir(estudiante,modulo); return { ok:true, recorrido:await epjaCertificadosRepo.recorrido(estudiante) }; } catch (e) { throw e instanceof ErrorApp ? e : new ErrorApp(400,e.message); } },
  async revocar(id) { if (!(await epjaCertificadosRepo.revocar(entero(id,'Certificado')))) throw new ErrorApp(404,'No existe un certificado activo con ese id'); }
};
