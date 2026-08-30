import { jest } from '@jest/globals';

const epjaModulosRepo = { obtenerParaEstudiante: jest.fn() };
const epjaAutoevaluacionesRepo = { registrarIntento: jest.fn() };

jest.unstable_mockModule('../repositories/epja-modulos.repo.js', () => ({ epjaModulosRepo }));
jest.unstable_mockModule('../repositories/epja-autoevaluaciones.repo.js', () => ({ epjaAutoevaluacionesRepo }));

const { epjaAutoevaluacionesService } = await import('./epja-autoevaluaciones.service.js');

function moduloEvaluable(certificadoModo = 'manual') {
  return {
    id: 8,
    certificadoModo,
    autoevaluacion: {
      activa: true,
      preguntas: Array.from({ length: 15 }, (_, indice) => ({
        id: `p-${indice + 1}`,
        enunciado: `Pregunta ${indice + 1}`,
        opciones: [
          { texto: 'A', correcta: indice < 9 },
          { texto: 'B', correcta: indice >= 9 }
        ]
      }))
    }
  };
}

function respuestasSiempreA(cantidad = 15) {
  return Array.from({ length: cantidad }, (_, indice) => ({ preguntaId: `p-${indice + 1}`, opcion: 0 }));
}

describe('epjaAutoevaluacionesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    epjaModulosRepo.obtenerParaEstudiante.mockResolvedValue(moduloEvaluable());
    epjaAutoevaluacionesRepo.registrarIntento.mockResolvedValue({ id: 23, creadoEn: new Date(), certificado: null });
  });

  test('aprueba exactamente con 9 respuestas correctas de 15', async () => {
    const resultado = await epjaAutoevaluacionesService.responder(4, 8, { respuestas: respuestasSiempreA() });

    expect(resultado).toMatchObject({ aciertos: 9, total: 15, porcentaje: 60, aprobado: true });
    expect(epjaAutoevaluacionesRepo.registrarIntento).toHaveBeenCalledWith(expect.objectContaining({
      estudianteId: 4,
      moduloId: 8,
      aprobado: true,
      certificadoAutomatico: false
    }));
  });

  test('solicita emisión automática cuando el módulo así lo indica', async () => {
    epjaModulosRepo.obtenerParaEstudiante.mockResolvedValue(moduloEvaluable('automatico'));

    await epjaAutoevaluacionesService.responder(4, 8, { respuestas: respuestasSiempreA() });

    expect(epjaAutoevaluacionesRepo.registrarIntento).toHaveBeenCalledWith(expect.objectContaining({ certificadoAutomatico: true }));
  });

  test('rechaza una entrega incompleta sin guardar un intento', async () => {
    await expect(epjaAutoevaluacionesService.responder(4, 8, { respuestas: respuestasSiempreA(14) }))
      .rejects.toMatchObject({ estado: 400, message: 'Respondé las 15 preguntas antes de entregar' });
    expect(epjaAutoevaluacionesRepo.registrarIntento).not.toHaveBeenCalled();
  });
});
