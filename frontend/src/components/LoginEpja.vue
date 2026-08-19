<script setup>
import { computed, ref } from 'vue';
import { ArrowRight, Eye, EyeSlash } from '@primeicons/vue';

const dni = ref('');
const password = ref('');
const error = ref('');
const aviso = ref('');
const enviando = ref(false);
const recuperando = ref(false);
const mostrarPassword = ref(false);
const mostrarNuevaPassword = ref(false);
const mostrarRepetirPassword = ref(false);
const mostrarRecuperacion = ref(false);
const recuperacionPaso = ref('email');
const recuperacionEmail = ref('');
const recuperacionCodigo = ref('');
const recuperacionToken = ref('');
const nuevaPassword = ref('');
const repetirPassword = ref('');
const MENSAJE_CONEXION = 'No se pudo conectar con el aula. Intentá nuevamente en unos minutos.';

async function leerRespuesta(respuesta, mensajeError) {
  let datos;
  try {
    datos = await respuesta.json();
  } catch {
    throw new Error(MENSAJE_CONEXION);
  }
  if (!respuesta.ok) throw new Error(datos?.error || mensajeError);
  return datos;
}

function mensajeVisible(errorActual, mensajePredeterminado) {
  const mensaje = errorActual instanceof Error ? errorActual.message : '';
  if (!mensaje) return mensajePredeterminado;
  if (/failed to fetch|networkerror|load failed/i.test(mensaje)) return MENSAJE_CONEXION;
  return mensaje;
}

const tituloRecuperacion = computed(() => ({
  email: 'Recuperar contraseña',
  codigo: 'Ingresá el código',
  nueva: 'Nueva contraseña'
})[recuperacionPaso.value]);

const textoBotonRecuperacion = computed(() => {
  if (recuperando.value) return 'Procesando…';
  return ({
    email: 'Enviar código',
    codigo: 'Verificar código',
    nueva: 'Guardar contraseña'
  })[recuperacionPaso.value];
});

async function entrar() {
  enviando.value = true;
  error.value = '';
  try {
    aviso.value = '';
    const respuesta = await fetch('/api/epja/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni: dni.value, password: password.value })
    });
    const datos = await leerRespuesta(respuesta, 'No se pudo ingresar al aula.');
    if (!datos?.token) throw new Error(MENSAJE_CONEXION);
    sessionStorage.setItem('profeluna_epja_token', datos.token);
    dispatchEvent(new Event('epja-session'));
    location.hash = '#aula';
  } catch (e) {
    error.value = mensajeVisible(e, 'No se pudo ingresar al aula.');
  } finally {
    enviando.value = false;
  }
}

function abrirRecuperacion() {
  mostrarRecuperacion.value = true;
  recuperacionPaso.value = 'email';
  recuperacionCodigo.value = '';
  recuperacionToken.value = '';
  nuevaPassword.value = '';
  repetirPassword.value = '';
  error.value = '';
  aviso.value = '';
}

function volverLogin() {
  mostrarRecuperacion.value = false;
  error.value = '';
}

async function pedirCodigo() {
  const respuesta = await fetch('/api/epja/auth/recuperar-clave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recuperacionEmail.value })
  });
  const datos = await leerRespuesta(respuesta, 'No se pudo enviar el código.');
  aviso.value = datos.mensaje || 'Si el correo está registrado, te enviamos un código para restablecer tu contraseña.';
  recuperacionPaso.value = 'codigo';
}

async function verificarCodigo() {
  const respuesta = await fetch('/api/epja/auth/verificar-codigo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: recuperacionEmail.value, codigo: recuperacionCodigo.value })
  });
  const datos = await leerRespuesta(respuesta, 'El código es inválido o venció.');
  recuperacionToken.value = datos.resetToken || '';
  recuperacionPaso.value = 'nueva';
  aviso.value = '';
}

async function guardarNuevaClave() {
  if (nuevaPassword.value !== repetirPassword.value) {
    throw new Error('Las contraseñas no coinciden.');
  }
  const respuesta = await fetch('/api/epja/auth/restablecer-clave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken: recuperacionToken.value, passwordNueva: nuevaPassword.value })
  });
  await leerRespuesta(respuesta, 'No se pudo guardar la nueva contraseña.');
  aviso.value = 'Contraseña actualizada. Ya podés ingresar con tu nueva clave.';
  mostrarRecuperacion.value = false;
  password.value = '';
}

async function enviarRecuperacion() {
  recuperando.value = true;
  error.value = '';
  aviso.value = recuperacionPaso.value === 'email' ? '' : aviso.value;
  try {
    if (recuperacionPaso.value === 'email') await pedirCodigo();
    else if (recuperacionPaso.value === 'codigo') await verificarCodigo();
    else await guardarNuevaClave();
  } catch (e) {
    error.value = mensajeVisible(e, 'No se pudo completar la recuperación.');
  } finally {
    recuperando.value = false;
  }
}
</script>

<template>
  <section class="auth-wrap">
    <form v-if="!mostrarRecuperacion" class="admin-card login" @submit.prevent="entrar">
      <span class="aula-chip">Aula EPJA</span>
      <h1>Ingresá al aula</h1>
      <p>Usá tu DNI y la clave que te entregó la docente.</p>
      <div class="campos">
        <input v-model="dni" inputmode="numeric" autocomplete="username" placeholder="DNI" required>
        <div class="password-field">
          <input v-model="password" :type="mostrarPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Contraseña" required>
          <button class="password-toggle" type="button" :aria-label="mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="mostrarPassword = !mostrarPassword">
            <EyeSlash v-if="mostrarPassword" :size="18" aria-hidden="true" />
            <Eye v-else :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="aviso" class="notice">{{ aviso }}</p>
      <div class="acciones">
        <button class="button button-icon" :disabled="enviando">{{ enviando ? 'Ingresando…' : 'Entrar al aula' }} <ArrowRight v-if="!enviando" :size="16" aria-hidden="true" /></button>
        <button class="admin-link link-button" type="button" @click="abrirRecuperacion">Me olvidé la contraseña</button>
        <a class="admin-link" href="#admin">Ingresar como administradora</a>
      </div>
    </form>

    <form v-else class="admin-card login" @submit.prevent="enviarRecuperacion">
      <span class="aula-chip">Aula EPJA</span>
      <h1>{{ tituloRecuperacion }}</h1>
      <p v-if="recuperacionPaso === 'email'">Ingresá el correo cargado en tu perfil. Te vamos a mandar un código para crear una contraseña nueva.</p>
      <p v-else-if="recuperacionPaso === 'codigo'">Revisá tu correo e ingresá el código de 6 dígitos. Vence en unos minutos.</p>
      <p v-else>Creá una contraseña nueva para volver a entrar al aula.</p>

      <div v-if="recuperacionPaso === 'email'" class="campos">
        <input v-model="recuperacionEmail" type="email" autocomplete="email" placeholder="Correo registrado" required>
      </div>
      <div v-else-if="recuperacionPaso === 'codigo'" class="campos">
        <input v-model="recuperacionCodigo" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="000000" required>
      </div>
      <div v-else class="campos">
        <div class="password-field">
          <input v-model="nuevaPassword" :type="mostrarNuevaPassword ? 'text' : 'password'" autocomplete="new-password" minlength="6" placeholder="Nueva contraseña" required>
          <button class="password-toggle" type="button" :aria-label="mostrarNuevaPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="mostrarNuevaPassword = !mostrarNuevaPassword">
            <EyeSlash v-if="mostrarNuevaPassword" :size="18" aria-hidden="true" />
            <Eye v-else :size="18" aria-hidden="true" />
          </button>
        </div>
        <div class="password-field">
          <input v-model="repetirPassword" :type="mostrarRepetirPassword ? 'text' : 'password'" autocomplete="new-password" minlength="6" placeholder="Repetir contraseña" required>
          <button class="password-toggle" type="button" :aria-label="mostrarRepetirPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="mostrarRepetirPassword = !mostrarRepetirPassword">
            <EyeSlash v-if="mostrarRepetirPassword" :size="18" aria-hidden="true" />
            <Eye v-else :size="18" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="aviso" class="notice">{{ aviso }}</p>
      <div class="acciones">
        <button class="button" :disabled="recuperando">{{ textoBotonRecuperacion }}</button>
        <button class="admin-link link-button" type="button" @click="volverLogin">Volver al login</button>
      </div>
    </form>
  </section>
</template>

<style scoped>
.auth-wrap { width:100%; padding:1px 24px 60px; }
.admin-card.login { display:flex; flex-direction:column; gap:22px; padding:34px 25px; }
.admin-card.login h1,.admin-card.login p { margin:0; }
.aula-chip { align-self:flex-start; padding:6px 11px; border-radius:999px; background:var(--salvia); color:var(--verde); font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; }
.campos { display:grid; gap:14px; }
.admin-card.login input { margin:0; }
.password-field { position:relative; display:flex; align-items:center; }
.password-field input { padding-right:46px; }
.password-toggle { position:absolute; right:6px; display:grid; place-items:center; width:34px; height:34px; border:0; border-radius:7px; background:transparent; color:var(--verde); cursor:pointer; }
.password-toggle:hover { background:var(--salvia); }
.otp-input { text-align:center; letter-spacing:.18em; font-weight:700; }
.acciones { display:flex; flex-wrap:wrap; align-items:center; gap:18px; }
.admin-link { color:var(--verde); font-size:14px; font-weight:700; text-decoration:underline; text-underline-offset:3px; }
.admin-link:hover { color:var(--terracota); }
.link-button { padding:0; border:0; background:transparent; cursor:pointer; font:700 14px 'Work Sans',sans-serif; }
.notice { padding:10px 14px; border-radius:8px; background:var(--salvia); color:var(--verde); font-weight:600; }
</style>
