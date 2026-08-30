import { jest } from '@jest/globals';

const epjaMateriasRepo = {
  obtenerPorCodigo: jest.fn(),
  crear: jest.fn(),
  obtener: jest.fn(),
  actualizar: jest.fn()
};

jest.unstable_mockModule('../repositories/epja-materias.repo.js', () => ({ epjaMateriasRepo }));

const { epjaMateriasService } = await import('./epja-materias.service.js');

describe('epjaMateriasService y campos compartidos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('crea otra materia dentro de FO II con un código interno distinto', async () => {
    epjaMateriasRepo.obtenerPorCodigo.mockResolvedValue(null);
    epjaMateriasRepo.crear.mockImplementation(async materia => materia);

    const materia = await epjaMateriasService.crear({
      campo: 'FO II',
      nombre: 'Administración y liquidación de sueldos'
    });

    expect(materia.campo).toBe('foii');
    expect(materia.codigo).toBe('foiiadministracionyliquidaciondesueldos');
    expect(epjaMateriasRepo.crear).toHaveBeenCalledWith(expect.objectContaining({
      campo: 'foii',
      nombre: 'Administración y liquidación de sueldos'
    }));
  });

  test('permite cambiar el campo visible sin alterar el código interno', async () => {
    epjaMateriasRepo.obtener.mockResolvedValue({
      id: 4,
      codigo: 'materia-interna',
      campo: 'foi',
      nombre: 'Materia',
      descripcion: '',
      color: '#2E5638',
      orden: 4,
      activa: true
    });
    epjaMateriasRepo.actualizar.mockImplementation(async (_id, materia) => materia);

    const materia = await epjaMateriasService.actualizar(4, { campo: 'FO II', nombre: 'Materia' });

    expect(materia.campo).toBe('foii');
  });
});
