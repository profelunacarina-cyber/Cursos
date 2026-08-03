// Error de aplicación con código HTTP.
// Los servicios lanzan ErrorApp y el middleware de errores lo traduce a JSON;
// cualquier otro error se trata como 500 sin filtrar detalles internos.
export class ErrorApp extends Error {
  constructor(estado, mensaje) {
    super(mensaje);
    this.estado = estado;
  }
}
