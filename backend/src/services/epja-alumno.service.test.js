import { jest } from '@jest/globals';

const epjaMateriasRepo = { obtenerPorCodigo: jest.fn(), estaAsignada: jest.fn(), listarDeEstudiante: jest.fn() };
const epjaModulosRepo = { listarDeMateria: jest.fn(), obtenerParaEstudiante: jest.fn() };
const epjaProgresoRepo = { marcarCompleto: jest.fn() };
const epjaAutoevaluacionesRepo = { estado: jest.fn() };
const epjaCertificadosRepo = { obtenerDeEstudiante: jest.fn() };

jest.unstable_mockModule('../repositories/epja-materias.repo.js', () => ({ epjaMateriasRepo }));
jest.unstable_mockModule('../repositories/epja-modulos.repo.js', () => ({ epjaModulosRepo }));
jest.unstable_mockModule('../repositories/epja-progreso.repo.js', () => ({ epjaProgresoRepo }));
jest.unstable_mockModule('../repositories/epja-autoevaluaciones.repo.js', () => ({ epjaAutoevaluacionesRepo }));
jest.unstable_mockModule('../repositories/epja-certificados.repo.js', () => ({ epjaCertificadosRepo }));

const { epjaAlumnoService } = await import('./epja-alumno.service.js');

describe('epjaAlumnoService y privacidad de la autoevaluación', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const modulo = {
      id: 7,
      materiaId: 2,
      certificadoModo: 'automatico',
      autoevaluacion: {
        activa: true,
        preguntas: [{
          id: 'p-1',
          enunciado: 'Pregunta',
          tipo: 'opcion_multiple',
          opciones: [{ texto: 'Sí', correcta: true }, { texto: 'No', correcta: false }]
        }]
      }
    };
    epjaModulosRepo.obtenerParaEstudiante.mockResolvedValue(modulo);
    epjaModulosRepo.listarDeMateria.mockResolvedValue([modulo]);
    epjaAutoevaluacionesRepo.estado.mockResolvedValue({ intentos: 0, mejorPorcentaje: 0, ultimoIntentoEn: null, certificado: null });
  });

  test('no envía respuestas correctas ni el modo de certificado al navegador', async () => {
    const modulo = await epjaAlumnoService.modulo(3, 7);

    expect(modulo.autoevaluacion.preguntas[0].opciones).toEqual([{ texto: 'Sí' }, { texto: 'No' }]);
    expect(modulo).not.toHaveProperty('certificadoModo');
  });

  test('impide marcar manualmente como completo un módulo con autoevaluación', async () => {
    await expect(epjaAlumnoService.completar(3, 7))
      .rejects.toMatchObject({ estado: 409 });
    expect(epjaProgresoRepo.marcarCompleto).not.toHaveBeenCalled();
  });
});
