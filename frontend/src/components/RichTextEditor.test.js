import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import RichTextEditor from './RichTextEditor.vue';

describe('RichTextEditor multimedia', () => {
  afterEach(() => vi.restoreAllMocks());

  test('transforma un enlace de YouTube pegado en una preview de video', async () => {
    const wrapper = mount(RichTextEditor, { props: { allowYoutube: true } });
    await flushPromises();
    const editor = wrapper.find('.ql-editor').element;
    const evento = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(evento, 'clipboardData', {
      value: { getData: tipo => tipo === 'text/plain' ? 'https://youtu.be/dQw4w9WgXcQ' : '' }
    });

    editor.dispatchEvent(evento);
    await flushPromises();

    expect(evento.defaultPrevented).toBe(true);
    expect(wrapper.find('.ql-youtube').exists()).toBe(true);
    expect(wrapper.find('iframe.ql-video').attributes('src')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    wrapper.unmount();
  });

  test('sube un archivo soltado en el compose e inserta una tarjeta de preview', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        nombre: 'planilla.xlsx',
        tipo: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        tamanio: 2048,
        url: '/api/epja/archivos/3f10a430-7b91-4ba7-8df4-3efcdac55a31'
      })
    }));
    const wrapper = mount(RichTextEditor, {
      props: { uploadUrl: '/api/epja/archivos', authToken: 'token-admin' }
    });
    await flushPromises();
    const archivo = new File(['datos'], 'planilla.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const arrastre = new Event('dragenter', { bubbles: true, cancelable: true });
    Object.defineProperty(arrastre, 'dataTransfer', { value: { types: ['Files'], files: [archivo] } });
    wrapper.element.dispatchEvent(arrastre);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.drop-overlay').exists()).toBe(true);

    const soltar = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(soltar, 'dataTransfer', { value: { types: ['Files'], files: [archivo] } });
    wrapper.element.dispatchEvent(soltar);
    await flushPromises();

    expect(wrapper.find('.drop-overlay').exists()).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/epja/archivos', expect.objectContaining({
      method: 'POST',
      body: archivo
    }));
    expect(wrapper.find('.ql-attachment').exists()).toBe(true);
    expect(wrapper.find('.attachment-info strong').text()).toBe('planilla.xlsx');
    expect(wrapper.find('.attachment-info small').text()).toBe('Planilla · 2 KB');

    await wrapper.find('.attachment-card').trigger('click');
    const controles = wrapper.find('.media-object-toolbar');
    expect(controles.exists()).toBe(true);
    const botones = controles.findAll('button');
    await botones.find(boton => boton.text() === 'Derecha').trigger('click');
    await wrapper.find('.media-object-toolbar').findAll('button').find(boton => boton.text() === 'Pequeño').trigger('click');
    expect(wrapper.find('.ql-attachment').attributes('data-media-align')).toBe('right');
    expect(wrapper.find('.ql-attachment').attributes('data-media-layout')).toBe('compact');
    await wrapper.find('.media-object-toolbar').findAll('button').find(boton => boton.text() === '↓ Bajar').trigger('click');
    expect(wrapper.find('.ql-editor').element.children[1].classList.contains('ql-attachment')).toBe(true);
    wrapper.unmount();
  });
});
