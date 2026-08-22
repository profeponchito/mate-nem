/**
 * MATE-NEM · Sesión del alumno
 * ----------------------------------------------------
 * Guarda los tres datos de registro (Nombre, Grado, Grupo) en localStorage
 * del dispositivo. No hay contraseña ni autenticación real: es solo para
 * no volver a pedir los datos en cada PDA dentro de la misma sesión/dispositivo.
 */

const CLAVE_SESION = 'mateNemSesion';

/** @param {{nombre:string, grado:string, grupo:string}} datos */
export function guardarSesion({ nombre, grado, grupo }) {
  const sesion = {
    nombre: nombre.trim(),
    grado,
    grupo: grupo.trim(),
    creadoEn: new Date().toISOString()
  };
  localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
  return sesion;
}

export function obtenerSesion() {
  const datos = localStorage.getItem(CLAVE_SESION);
  return datos ? JSON.parse(datos) : null;
}

export function haySesion() {
  return obtenerSesion() !== null;
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION);
}
