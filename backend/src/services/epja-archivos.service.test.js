import { jest } from '@jest/globals';

const epjaArchivosRepo = {
  crear: jest.fn(),
  obtener: jest.fn()
};

jest.unstable_mockModule('../repositories/epja-archivos.repo.js', () => ({ epjaArchivosRepo }));

const { epjaArchivosService, MAX_ARCHIVO_BYTES } = await import('./epja-archivos.service.js');

describe('epjaArchivosService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('guarda un archivo permitido y limpia su nombre', async () => {
    epjaArchivosRepo.crear.mockImplementation(async archivo => archivo);
    const guardado = await epjaArchivosService.crear({
      nombre: encodeURIComponent('../Guía de trabajo.pdf'),
      tipoMime: 'application/pdf',
      contenido: Buffer.from('pdf')
    });

    expect(guardado.nombre).toBe('.._Guía de trabajo.pdf');
    expect(guardado.tipoMime).toBe('application/pdf');
    expect(guardado.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test('rechaza archivos demasiado grandes', async () => {
    await expect(epjaArchivosService.crear({
      nombre: 'grande.pdf',
      tipoMime: 'application/pdf',
      contenido: Buffer.alloc(MAX_ARCHIVO_BYTES + 1)
    })).rejects.toMatchObject({ estado: 413 });
  });

  test('deduce el tipo para extensiones conocidas si el navegador no lo informa', async () => {
    epjaArchivosRepo.crear.mockImplementation(async archivo => archivo);
    const guardado = await epjaArchivosService.crear({
      nombre: 'actividad.docx',
      tipoMime: 'application/octet-stream',
      contenido: Buffer.from('docx')
    });

    expect(guardado.tipoMime).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });
});
