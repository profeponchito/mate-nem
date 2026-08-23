/**
 * MATE-NEM · Cliente del Webhook (Google Apps Script)
 * ----------------------------------------------------
 * Envía el resultado de un PDA concluido al backend serverless (Code.gs)
 * y maneja el caso de conexión intermitente guardando el registro
 * pendiente en localStorage para reintentar más tarde.
 */

const WEBHOOK_URL = 'https://script.google.com/macros/s/TU_ID_DE_IMPLEMENTACION/exec';

/**
 * @param {Object} registro - { nombre, grado, grupo, pdaId, pdaNombre, eje,
 *                              tipo ('subtema' | 'pda_completo'), subtema (ej. '3.2', vacío si tipo='pda_completo'),
 *                              puntaje, estrellas, codigoVerificacion }
 *   Se llama una vez por cada subtema concluido (tipo='subtema', su propio mini-resultado)
 *   y una vez más al terminar el PDA completo (tipo='pda_completo', resultado global).
 * @returns {Promise<Object>} - { status, codigoVerificacion, timestamp }
 */
export async function enviarRegistroPDA(registro) {
  const payload = {
    ...registro,
    userAgent: navigator.userAgent
  };

  try {
    const respuesta = await fetch(WEBHOOK_URL, {
      method: 'POST',
      // Apps Script no procesa el preflight CORS (OPTIONS) que dispara un
      // Content-Type "application/json"; usamos text/plain para evitarlo.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const data = await respuesta.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'Error desconocido al guardar el registro.');
    }

    return data;
  } catch (error) {
    console.error('[webhook] No se pudo enviar el registro:', error);
    guardarRegistroPendiente_(payload);
    throw error;
  }
}

/** Reintenta enviar todos los registros que quedaron pendientes por fallas de red. */
export async function reintentarPendientes() {
  const pendientes = JSON.parse(localStorage.getItem('mateNemPendientes') || '[]');
  if (pendientes.length === 0) return;

  const restantes = [];
  for (const registro of pendientes) {
    try {
      await enviarRegistroPDA(registro);
    } catch {
      restantes.push(registro);
    }
  }
  localStorage.setItem('mateNemPendientes', JSON.stringify(restantes));
}

function guardarRegistroPendiente_(payload) {
  const pendientes = JSON.parse(localStorage.getItem('mateNemPendientes') || '[]');
  pendientes.push(payload);
  localStorage.setItem('mateNemPendientes', JSON.stringify(pendientes));
}
