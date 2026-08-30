import { jest } from '@jest/globals';

const epjaEstudiantesRepo = {
  obtener: jest.fn(),
  asignarMaterias: jest.fn()
};
const epjaMateriasRepo = {
  listar: jest.fn()
};

jest.unstable_mockModule('../repositories/epja-estudiantes.repo.js', () => ({ epjaEstudiantesRepo }));
jest.unstable_mockModule('../repositories/epja-materias.repo.js', () => ({ epjaMateriasRepo }));

const { epjaEstudiantesService } = await import('./epja-estudiantes.service.js');

describe('asignación de materias por campo', () => {
  beforeEach(() => jest.clearAllMocks());

  test('asignar FO II habilita sus tres materias', async () => {
    epjaEstudiantesRepo.obtener.mockResolvedValue({ id: 7 });
    epjaMateriasRepo.listar.mockResolvedValue([
      { id: 1, codigo: 'foi', campo: 'foi' },
      { id: 2, codigo: 'foii', campo: 'foii' },
      { id: 3, codigo: 'foiiadministracionsueldos', campo: 'foii' },
      { id: 4, codigo: 'foiieconomiasocial', campo: 'foii' }
    ]);
    epjaEstudiantesRepo.asignarMaterias.mockResolvedValue({ id: 7, materias: ['foii'] });

    await epjaEstudiantesService.asignarMaterias(7, ['FO II']);

    expect(epjaEstudiantesRepo.asignarMaterias).toHaveBeenCalledWith(7, [2, 3, 4]);
  });
});
