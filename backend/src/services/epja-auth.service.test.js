import crypto from 'node:crypto';
import { jest } from '@jest/globals';

process.env.JWT_SECRET = 'secreto-de-prueba';

const epjaEstudiantesRepo = {
  obtenerPorDni: jest.fn(),
  actualizarPassword: jest.fn(),
  obtener: jest.fn(),
  obtenerPorEmail: jest.fn(),
  actualizar: jest.fn()
};

const epjaPasswordResetsRepo = {
  invalidarPendientes: jest.fn(),
  crear: jest.fn(),
  obtenerActivoPorEmail: jest.fn(),
  registrarIntentoFallido: jest.fn(),
  marcarVerificado: jest.fn(),
  consumir: jest.fn()
};

const emailService = {
  servicioConfigurado: jest.fn(),
  enviarCodigoRecuperacion: jest.fn()
};

jest.unstable_mockModule('../repositories/epja-estudiantes.repo.js', () => ({
  epjaEstudiantesRepo
}));

jest.unstable_mockModule('../repositories/epja-password-resets.repo.js', () => ({
  epjaPasswordResetsRepo
}));

jest.unstable_mockModule('./email.service.js', () => ({
  emailService
}));

const { epjaAuthService } = await import('./epja-auth.service.js');

function hashSecreto(valor) {
  return crypto
    .createHmac('sha256', process.env.JWT_SECRET)
    .update(String(valor))
    .digest('hex');
}

describe('epjaAuthService.recuperarClave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    emailService.servicioConfigurado.mockReturnValue(true);
    epjaPasswordResetsRepo.crear.mockResolvedValue({ id: 99 });
  });

  test('responde genérico si el correo no está registrado', async () => {
    epjaEstudiantesRepo.obtenerPorEmail.mockResolvedValue(null);

    const resultado = await epjaAuthService.recuperarClave({
      email: 'alumna@example.com'
    });

    expect(resultado).toEqual({
      ok: true,
      mensaje: 'Si el correo está registrado, te enviamos un código para restablecer tu contraseña.'
    });
    expect(epjaPasswordResetsRepo.crear).not.toHaveBeenCalled();
    expect(emailService.enviarCodigoRecuperacion).not.toHaveBeenCalled();
  });

  test('crea un OTP y lo envía por correo', async () => {
    const estudiante = {
      id: 7,
      dni: '12345678',
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'alumna@example.com',
      activo: true
    };
    epjaEstudiantesRepo.obtenerPorEmail.mockResolvedValue(estudiante);

    await epjaAuthService.recuperarClave({ email: 'alumna@example.com' });

    expect(epjaPasswordResetsRepo.invalidarPendientes).toHaveBeenCalledWith(7);
    expect(epjaPasswordResetsRepo.crear).toHaveBeenCalledWith(expect.objectContaining({
      estudianteId: 7,
      codigoHash: expect.any(String),
      expiraEn: expect.any(Date)
    }));
    expect(emailService.enviarCodigoRecuperacion).toHaveBeenCalledWith(expect.objectContaining({
      estudiante,
      codigo: expect.stringMatching(/^\d{6}$/),
      resetId: 99
    }));
  });

  test('rechaza correo inválido sin tocar la contraseña', async () => {
    await expect(epjaAuthService.recuperarClave({
      email: 'correo-invalido'
    })).rejects.toMatchObject({ estado: 400 });

    expect(epjaPasswordResetsRepo.crear).not.toHaveBeenCalled();
    expect(epjaEstudiantesRepo.actualizarPassword).not.toHaveBeenCalled();
  });
});

describe('epjaAuthService.verificarCodigoRecuperacion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    epjaPasswordResetsRepo.marcarVerificado.mockResolvedValue(true);
  });

  test('verifica el OTP y devuelve un token temporal', async () => {
    epjaPasswordResetsRepo.obtenerActivoPorEmail.mockResolvedValue({
      id: 12,
      codigoHash: hashSecreto('123456'),
      intentos: 0,
      estudiante: { id: 7, email: 'alumna@example.com' }
    });

    const resultado = await epjaAuthService.verificarCodigoRecuperacion({
      email: 'alumna@example.com',
      codigo: '123456'
    });

    expect(resultado).toEqual({ ok: true, resetToken: expect.any(String) });
    expect(epjaPasswordResetsRepo.marcarVerificado).toHaveBeenCalledWith(
      12,
      expect.any(String),
      expect.any(Date)
    );
  });

  test('incrementa intentos si el OTP no coincide', async () => {
    epjaPasswordResetsRepo.obtenerActivoPorEmail.mockResolvedValue({
      id: 12,
      codigoHash: hashSecreto('123456'),
      intentos: 0,
      estudiante: { id: 7, email: 'alumna@example.com' }
    });

    await expect(epjaAuthService.verificarCodigoRecuperacion({
      email: 'alumna@example.com',
      codigo: '000000'
    })).rejects.toMatchObject({ estado: 400 });

    expect(epjaPasswordResetsRepo.registrarIntentoFallido).toHaveBeenCalledWith(12, 5);
  });
});

describe('epjaAuthService.restablecerClave', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('consume el token temporal y cambia la contraseña', async () => {
    epjaPasswordResetsRepo.consumir.mockResolvedValue(true);

    await expect(epjaAuthService.restablecerClave({
      resetToken: 'token-temporal',
      passwordNueva: 'nueva-clave'
    })).resolves.toEqual({ ok: true });

    expect(epjaPasswordResetsRepo.consumir).toHaveBeenCalledWith(
      hashSecreto('token-temporal'),
      expect.any(String)
    );
  });
});
