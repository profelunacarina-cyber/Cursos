import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import LoginEpja from './LoginEpja.vue';

describe('LoginEpja', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mensaje: 'Si el correo está registrado, te enviamos un código para restablecer tu contraseña.'
      })
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('solicita recuperación sólo con el correo registrado', async () => {
    const wrapper = mount(LoginEpja);

    await wrapper.get('button.link-button').trigger('click');
    await wrapper.get('input[type="email"]').setValue('alumna@example.com');
    await wrapper.get('form').trigger('submit.prevent');
    await flushPromises();

    expect(fetch).toHaveBeenCalledWith('/api/epja/auth/recuperar-clave', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'alumna@example.com' })
    }));
    expect(wrapper.text()).toContain('te enviamos un código');
    expect(wrapper.text()).not.toContain('docente que restablezca');
    expect(wrapper.text()).not.toContain('DNI');
  });

  test('permite mostrar y ocultar la contraseña del login', async () => {
    const wrapper = mount(LoginEpja);
    const input = () => wrapper.get('input[autocomplete="current-password"]');

    expect(input().attributes('type')).toBe('password');
    await wrapper.get('.password-toggle').trigger('click');
    expect(input().attributes('type')).toBe('text');
    await wrapper.get('.password-toggle').trigger('click');
    expect(input().attributes('type')).toBe('password');
  });
});
