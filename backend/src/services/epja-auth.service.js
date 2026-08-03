import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';
import { ErrorApp } from '../errores.js';
import { epjaEstudiantesRepo } from '../repositories/epja-estudiantes.repo.js';
import { epjaPasswordResetsRepo } from '../repositories/epja-password-resets.repo.js';
import { emailService } from './email.service.js';

const HASH_RELLENO = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
const MENSAJE_RECUPERACION = 'Si el correo está registrado, te enviamos un código para restablecer tu contraseña.';
const MINUTOS_CODIGO = 10;
const MINUTOS_RESET = 10;
const MAX_INTENTOS_CODIGO = 5;

function normalizarDni(dni) {
  return String(dni || '').replace(/\D+/g, '');
}

function texto(valor, max, campo) {
  const limpio = String(valor || '').trim().slice(0, max);
  if (!limpio) throw new ErrorApp(400, `«${campo}» es obligatorio`);
  return limpio;
}

function email(valor) {
  const limpio = String(valor || '').trim().toLowerCase();
  if (!limpio) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) {
    throw new ErrorApp(400, 'El correo no tiene un formato válido');
  }
  return limpio.slice(0, 160);
}

function clave(valor, campo = 'contraseña') {
  const limpia = String(valor || '').trim();
  if (limpia.length < 6) throw new ErrorApp(400, `La ${campo} debe tener al menos 6 caracteres`);
  if (limpia.length > 120) throw new ErrorApp(400, `La ${campo} no puede superar 120 caracteres`);
  return limpia;
}

function codigoOtp(valor) {
  const limpio = String(valor || '').replace(/\D/g, '');
  if (!/^\d{6}$/.test(limpio)) throw new ErrorApp(400, 'Ingresá el código de 6 dígitos');
  return limpio;
}

function hashSecreto(valor) {
  return crypto
    .createHmac('sha256', config.jwtSecret)
    .update(String(valor))
    .digest('hex');
}

function nuevoCodigo() {
  return String(crypto.randomInt(100000, 1000000));
}

function nuevoResetToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function enMinutos(minutos) {
  return new Date(Date.now() + minutos * 60_000);
}

function respuestaSesion(estudiante) {
  const token = jwt.sign(
    {
      sub: estudiante.id,
      dni: estudiante.dni,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      email: estudiante.email || '',
      tipo: 'estudiante'
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpira }
  );

  return {
    token,
    estudiante: {
      id: estudiante.id,
      dni: estudiante.dni,
      nombre: estudiante.nombre,
      apellido: estudiante.apellido,
      email: estudiante.email || '',
      materias: estudiante.materias || []
    }
  };
}

export const epjaAuthService = {
  async login(dni, password) {
    const limpio = normalizarDni(dni);
    const estudiante = await epjaEstudiantesRepo.obtenerPorDni(limpio);
    const valida = await bcrypt.compare(String(password || ''), estudiante ? estudiante.passwordHash : HASH_RELLENO);
    if (!estudiante || !valida) throw new ErrorApp(401, 'DNI o contraseña incorrectos');
    if (!estudiante.activo) throw new ErrorApp(403, 'Este usuario está inactivo');

    return respuestaSesion(estudiante);
  },

  async yo(id) {
    const estudiante = await epjaEstudiantesRepo.obtener(Number(id));
    if (!estudiante) throw new ErrorApp(404, 'No existe el estudiante');
    return estudiante;
  },

  async actualizarPerfil(id, datos) {
    const estudiante = await epjaEstudiantesRepo.obtener(Number(id));
    if (!estudiante) throw new ErrorApp(404, 'No existe el estudiante');

    const correo = email(datos.email);
    const otroEmail = correo ? await epjaEstudiantesRepo.obtenerPorEmail(correo) : null;
    if (otroEmail && otroEmail.id !== estudiante.id) {
      throw new ErrorApp(409, 'Ya existe otro estudiante con ese correo');
    }

    const actualizado = await epjaEstudiantesRepo.actualizar(estudiante.id, {
      dni: estudiante.dni,
      nombre: texto(datos.nombre ?? estudiante.nombre, 80, 'nombre'),
      apellido: texto(datos.apellido ?? estudiante.apellido, 80, 'apellido'),
      email: correo,
      activo: estudiante.activo
    });
    return respuestaSesion(actualizado);
  },

  async cambiarClave(id, datos) {
    const estudiante = await epjaEstudiantesRepo.obtener(Number(id));
    if (!estudiante) throw new ErrorApp(404, 'No existe el estudiante');
    const conHash = await epjaEstudiantesRepo.obtenerPorDni(estudiante.dni);
    const valida = await bcrypt.compare(String(datos.passwordActual || ''), conHash ? conHash.passwordHash : HASH_RELLENO);
    if (!valida) throw new ErrorApp(401, 'La contraseña actual no coincide');

    await epjaEstudiantesRepo.actualizarPassword(estudiante.id, await bcrypt.hash(clave(datos.passwordNueva, 'nueva contraseña'), 10));
    return { ok: true };
  },

  async recuperarClave(datos) {
    const correo = email(datos.email);
    if (!emailService.servicioConfigurado()) {
      throw new ErrorApp(503, 'La recuperación por correo todavía no está configurada.');
    }

    const estudiante = await epjaEstudiantesRepo.obtenerPorEmail(correo);
    if (!estudiante || !estudiante.activo || !estudiante.email) {
      return { ok: true, mensaje: MENSAJE_RECUPERACION };
    }

    const codigo = nuevoCodigo();
    await epjaPasswordResetsRepo.invalidarPendientes(estudiante.id);
    const reset = await epjaPasswordResetsRepo.crear({
      estudianteId: estudiante.id,
      codigoHash: hashSecreto(codigo),
      expiraEn: enMinutos(MINUTOS_CODIGO)
    });

    try {
      await emailService.enviarCodigoRecuperacion({ estudiante, codigo, resetId: reset.id });
    } catch (e) {
      await epjaPasswordResetsRepo.invalidarPendientes(estudiante.id);
      throw e;
    }

    return { ok: true, mensaje: MENSAJE_RECUPERACION };
  },

  async verificarCodigoRecuperacion(datos) {
    const correo = email(datos.email);
    const codigo = codigoOtp(datos.codigo);
    const reset = await epjaPasswordResetsRepo.obtenerActivoPorEmail(correo);
    if (!reset || reset.intentos >= MAX_INTENTOS_CODIGO) {
      throw new ErrorApp(400, 'El código es inválido o venció');
    }

    if (reset.codigoHash !== hashSecreto(codigo)) {
      await epjaPasswordResetsRepo.registrarIntentoFallido(reset.id, MAX_INTENTOS_CODIGO);
      throw new ErrorApp(400, 'El código es inválido o venció');
    }

    const resetToken = nuevoResetToken();
    const ok = await epjaPasswordResetsRepo.marcarVerificado(
      reset.id,
      hashSecreto(resetToken),
      enMinutos(MINUTOS_RESET)
    );
    if (!ok) throw new ErrorApp(400, 'El código es inválido o venció');
    return { ok: true, resetToken };
  },

  async restablecerClave(datos) {
    const token = texto(datos.resetToken, 200, 'token de recuperación');
    const password = clave(datos.passwordNueva, 'nueva contraseña');
    const ok = await epjaPasswordResetsRepo.consumir(
      hashSecreto(token),
      await bcrypt.hash(password, 10)
    );
    if (!ok) throw new ErrorApp(400, 'El enlace de recuperación venció o ya fue usado');
    return { ok: true };
  }
};
