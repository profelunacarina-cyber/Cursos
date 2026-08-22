import { jest } from '@jest/globals';

const epjaMateriasRepo = {
  obtener: jest.fn()
};
const epjaModulosRepo = {
  crear: jest.fn(),
  obtener: jest.fn(),
  actualizar: jest.fn()
};

jest.unstable_mockModule('../repositories/epja-materias.repo.js', () => ({ epjaMateriasRepo }));
jest.unstable_mockModule('../repositories/epja-modulos.repo.js', () => ({ epjaModulosRepo }));

const { epjaModulosService } = await import('./epja-modulos.service.js');

describe('epjaModulosService y contenido multimedia', () => {
  beforeEach(() => jest.clearAllMocks());

  test('conserva videos de YouTube y enlaces a adjuntos al crear un módulo', async () => {
    epjaMateriasRepo.obtener.mockResolvedValue({ id: 2 });
    epjaModulosRepo.crear.mockImplementation(async modulo => modulo);
    const youtube = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
    const archivo = '/api/epja/archivos/3f10a430-7b91-4ba7-8df4-3efcdac55a31';

    const creado = await epjaModulosService.crear(2, {
      titulo: 'Clase con materiales',
      contenido: `<p><a href="${archivo}">Guía.pdf</a></p><iframe class="ql-video" src="${youtube}" frameborder="0" allowfullscreen></iframe>`
    });

    expect(creado.contenido).toContain(`href="${archivo}"`);
    expect(creado.contenido).toContain(`src="${youtube}"`);
  });

  test('elimina la URL de iframes que no sean de YouTube', async () => {
    epjaMateriasRepo.obtener.mockResolvedValue({ id: 2 });
    epjaModulosRepo.crear.mockImplementation(async modulo => modulo);

    const creado = await epjaModulosService.crear(2, {
      titulo: 'Contenido inseguro',
      contenido: '<iframe src="https://sitio-malicioso.example/video"></iframe><script>alert(1)</script>'
    });

    expect(creado.contenido).not.toContain('sitio-malicioso');
    expect(creado.contenido).not.toContain('<script');
  });

  test('conserva la tarjeta de preview de un archivo y elimina atributos inseguros', async () => {
    epjaMateriasRepo.obtener.mockResolvedValue({ id: 2 });
    epjaModulosRepo.crear.mockImplementation(async modulo => modulo);
    const archivo = '/api/epja/archivos/3f10a430-7b91-4ba7-8df4-3efcdac55a31';

    const creado = await epjaModulosService.crear(2, {
      titulo: 'Clase con preview',
      contenido: `<figure class="ql-attachment" data-url="${archivo}" data-name="Guía.pdf" data-type="application/pdf" data-size="2048" data-media-align="right" data-media-layout="medium" onclick="alert(1)"><a class="attachment-card" href="${archivo}"><span class="attachment-visual">PDF</span><span class="attachment-info"><strong>Guía.pdf</strong><small>PDF · 2 KB</small></span><span class="attachment-action">Descargar</span></a></figure>`
    });

    expect(creado.contenido).toContain('class="ql-attachment"');
    expect(creado.contenido).toContain('data-type="application/pdf"');
    expect(creado.contenido).toContain('data-media-align="right"');
    expect(creado.contenido).toContain('data-media-layout="medium"');
    expect(creado.contenido).toContain('class="attachment-card"');
    expect(creado.contenido).not.toContain('onclick');
  });

  test('conserva posición y tamaño de una preview de YouTube', async () => {
    epjaMateriasRepo.obtener.mockResolvedValue({ id: 2 });
    epjaModulosRepo.crear.mockImplementation(async modulo => modulo);
    const youtube = 'https://www.youtube.com/embed/dQw4w9WgXcQ';

    const creado = await epjaModulosService.crear(2, {
      titulo: 'Video posicionado',
      contenido: `<figure class="ql-youtube" data-src="${youtube}" data-media-align="left" data-media-layout="compact"><iframe class="ql-video" src="${youtube}" frameborder="0" allowfullscreen title="Video de YouTube"></iframe><span class="media-select-handle">Mover o ajustar video</span></figure>`
    });

    expect(creado.contenido).toContain('class="ql-youtube"');
    expect(creado.contenido).toContain('data-media-align="left"');
    expect(creado.contenido).toContain('data-media-layout="compact"');
    expect(creado.contenido).toContain(`src="${youtube}"`);
  });
});
