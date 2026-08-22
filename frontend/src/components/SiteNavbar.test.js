import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import SiteNavbar from './SiteNavbar.vue';

describe('SiteNavbar', () => {
  beforeEach(() => {
    sessionStorage.clear();
    location.hash = '#inicio';
  });

  afterEach(() => {
    sessionStorage.clear();
    location.hash = '#inicio';
  });

  test('no muestra logout ni perfil en la pantalla de login aunque exista token previo', () => {
    sessionStorage.setItem('profeluna_epja_token', 'token-viejo');
    location.hash = '#login';

    const wrapper = mount(SiteNavbar);

    expect(wrapper.text()).toContain('Login');
    expect(wrapper.text()).not.toContain('Logout');
    expect(wrapper.text()).not.toContain('Mi perfil');
  });

  test('ofrece volver al aula desde la portada si hay sesión de estudiante', () => {
    sessionStorage.setItem('profeluna_epja_token', 'token-alumno');
    const wrapper = mount(SiteNavbar);

    expect(wrapper.get('a[href="#aula"]').text()).toBe('Volver al aula');
  });

  test('ofrece volver al panel desde la portada si hay sesión administrativa', () => {
    sessionStorage.setItem('profeluna_token', 'token-admin');
    const wrapper = mount(SiteNavbar);

    expect(wrapper.get('a[href="#admin"]').text()).toBe('Volver al panel admin');
  });

  test('oculta volver al aula cuando el estudiante ya está dentro', () => {
    sessionStorage.setItem('profeluna_epja_token', 'token-alumno');
    location.hash = '#aula';
    const wrapper = mount(SiteNavbar);

    expect(wrapper.text()).not.toContain('Volver al aula');
  });

  test.each(['#admin', '#admin-epja'])('oculta volver al panel dentro de %s', hash => {
    sessionStorage.setItem('profeluna_token', 'token-admin');
    location.hash = hash;
    const wrapper = mount(SiteNavbar);

    expect(wrapper.find('a[href="#admin"]').exists()).toBe(false);
  });
});
