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
});
