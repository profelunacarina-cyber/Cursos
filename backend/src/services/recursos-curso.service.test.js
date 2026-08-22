import { jest } from '@jest/globals';

const recursosCursoRepo = {
  listarActivos: jest.fn(),
  listarTodos: jest.fn(),
  crear: jest.fn(),
  actualizar: jest.fn(),
  eliminar: jest.fn()
};

jest.unstable_mockModule('../repositories/recursos-curso.repo.js', () => ({
  recursosCursoRepo
}));

const { recursosCursoService } = await import('./recursos-curso.service.js');

describe('recursosCursoService.listarPublicos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('oculta HTML legacy y respuestas correctas en evaluaciones públicas', async () => {
    recursosCursoRepo.listarActivos.mockResolvedValue([{
      id: 1,
      cursoId: 2,
      tipo: 'evaluacion',
      titulo: 'Evaluación final',
      contenidoHtml: '<p>Intro</p>',
      activo: true,
      orden: 1,
      configuracion: {
        fuenteHtml: '<script>const respuestas = [1]</script>',
        archivo: 'evaluacion.html',
        preguntas: [{
          id: 'p1',
          enunciado: 'Pregunta',
          tipo: 'opcion_multiple',
          opciones: [
            { texto: 'A', correcta: true },
            { texto: 'B', correcta: false }
          ]
        }]
      }
    }]);

    const [recurso] = await recursosCursoService.listarPublicos(2);

    expect(recurso.configuracion).toEqual({
      preguntas: [{
        id: 'p1',
        enunciado: 'Pregunta',
        tipo: 'opcion_multiple',
        opciones: [
          { texto: 'A' },
          { texto: 'B' }
        ]
      }]
    });
    expect(JSON.stringify(recurso)).not.toContain('fuenteHtml');
    expect(JSON.stringify(recurso)).not.toContain('correcta');
  });

  test('conserva el solucionario en el endpoint administrativo', async () => {
    const recursos = [{
      id: 1,
      tipo: 'evaluacion',
      configuracion: {
        preguntas: [{
          opciones: [{ texto: 'A', correcta: true }]
        }]
      }
    }];
    recursosCursoRepo.listarTodos.mockResolvedValue(recursos);

    await expect(recursosCursoService.listarTodos(2)).resolves.toBe(recursos);
  });
});
