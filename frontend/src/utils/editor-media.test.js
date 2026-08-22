import { describe, expect, test } from 'vitest';
import { tamanioLegible, tipoArchivo, urlYoutube } from './editor-media.js';

describe('contenido multimedia del editor', () => {
  test.each([
    ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ'],
    ['https://music.youtube.com/watch?v=dQw4w9WgXcQ', 'https://www.youtube.com/embed/dQw4w9WgXcQ']
  ])('convierte %s a una URL embebible', (entrada, esperada) => {
    expect(urlYoutube(entrada)).toBe(esperada);
  });

  test('rechaza URLs ajenas a YouTube', () => {
    expect(urlYoutube('https://example.com/watch?v=dQw4w9WgXcQ')).toBe('');
  });

  test('presenta tipo y tamaño legibles para la tarjeta de preview', () => {
    expect(tipoArchivo('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'notas.xlsx')).toBe('Planilla');
    expect(tamanioLegible(2 * 1024 * 1024)).toBe('2 MB');
  });
});
