import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import App from './App.vue';

const stubs = {
  SiteNavbar: true,
  TerritorialMap: true,
  AdminCourses: { template: '<div data-testid="admin-login" />' },
  AdminEpja: { template: '<div data-testid="admin-epja" />' },
  LoginEpja: true,
  AulaEpja: true,
  PerfilEpja: true
};

function tokenAdmin(expiraEn = Math.floor(Date.now() / 1000) + 300) {
  const payload = btoa(JSON.stringify({ tipo: 'admin', exp: expiraEn }));
  return `cabecera.${payload}.firma`;
}

describe('protección de rutas administrativas', () => {
  beforeEach(() => {
    sessionStorage.clear();
    location.hash = '#inicio';
  });

  afterEach(() => {
    sessionStorage.clear();
    location.hash = '#inicio';
  });

  test('redirige #admin-epja al login si no hay sesión administrativa', () => {
    location.hash = '#admin-epja';
    const wrapper = mount(App, { global: { stubs } });

    expect(location.hash).toBe('#admin');
    expect(wrapper.find('[data-testid="admin-login"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="admin-epja"]').exists()).toBe(false);
    wrapper.unmount();
  });

  test('permite #admin-epja con un token administrativo vigente', () => {
    sessionStorage.setItem('profeluna_token', tokenAdmin());
    location.hash = '#admin-epja';
    const wrapper = mount(App, { global: { stubs } });

    expect(location.hash).toBe('#admin-epja');
    expect(wrapper.find('[data-testid="admin-epja"]').exists()).toBe(true);
    wrapper.unmount();
  });

  test('descarta una sesión administrativa vencida', () => {
    sessionStorage.setItem('profeluna_token', tokenAdmin(Math.floor(Date.now() / 1000) - 60));
    location.hash = '#admin-epja';
    const wrapper = mount(App, { global: { stubs } });

    expect(location.hash).toBe('#admin');
    expect(sessionStorage.getItem('profeluna_token')).toBeNull();
    expect(wrapper.find('[data-testid="admin-epja"]').exists()).toBe(false);
    wrapper.unmount();
  });

  test('permite volver al aula desde la portada con una sesión de estudiante', () => {
    sessionStorage.setItem('profeluna_epja_token', 'token-estudiante');
    const wrapper = mount(App, { global: { stubs } });

    expect(wrapper.get('a[href="#aula"]').text()).toContain('Volver al aula EPJA');
    wrapper.unmount();
  });

  test('permite volver al panel desde la portada con una sesión administrativa', () => {
    sessionStorage.setItem('profeluna_token', tokenAdmin());
    const wrapper = mount(App, { global: { stubs } });

    expect(wrapper.get('a[href="#admin"]').text()).toContain('Volver al panel admin');
    wrapper.unmount();
  });
});
