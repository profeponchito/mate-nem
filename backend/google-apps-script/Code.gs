/**
 * MATE-NEM · Backend Serverless (Google Apps Script)
 * ----------------------------------------------------
 * Web Endpoint que recibe (POST) los resultados de un PDA concluido
 * desde el frontend y los almacena como una fila nueva en Google Sheets.
 *
 * DESPLIEGUE:
 * 1. Crea una hoja de cálculo en Google Drive, por ejemplo "MATE-NEM Registros".
 * 2. Abre Extensiones > Apps Script y pega este archivo como Code.gs
 *    (reemplazando el Code.gs vacío que Apps Script crea por defecto).
 * 3. Ajusta SHEET_NAME si usas un nombre de pestaña distinto a "Registros".
 * 4. Implementar > Nueva implementación > Tipo: Aplicación web.
 *      - Ejecutar como: Yo (tu cuenta)
 *      - Quién tiene acceso: Cualquier usuario
 *        (necesario para que el frontend público, sin login, pueda hacer POST)
 * 5. Copia la URL de la Web App resultante (termina en /exec) y pégala en
 *    assets/js/webhook.js, en la constante WEBHOOK_URL.
 * 6. Prueba abriendo esa URL directamente en el navegador: debe responder
 *    un JSON de doGet() confirmando que el endpoint está activo.
 */

const SHEET_NAME = 'Registros';

// Encabezados esperados en la fila 1 (se crean automáticamente si la hoja está vacía)
const HEADERS = [
  'Timestamp',
  'Nombre Completo',
  'Grado',
  'Grupo',
  'PDA ID',
  'PDA Concluido',
  'Eje / Contenido',
  'Tipo de Registro',
  'Subtema',
  'Puntaje',
  'Estrellas',
  'Codigo Verificacion',
  'User Agent'
];

function doPost(e) {
  try {
    const sheet = getOrCreateSheet_();
    const payload = parsePayload_(e);

    validatePayload_(payload);

    const codigoVerificacion = payload.codigoVerificacion || Utilities.getUuid();
    const timestamp = new Date();

    sheet.appendRow([
      timestamp,
      payload.nombre,
      payload.grado,
      payload.grupo,
      payload.pdaId || '',
      payload.pdaNombre || '',
      payload.eje || '',
      payload.tipo === 'subtema' ? 'Subtema' : 'PDA completo',
      payload.subtema || '',
      payload.puntaje != null ? payload.puntaje : '',
      payload.estrellas != null ? payload.estrellas : '',
      codigoVerificacion,
      payload.userAgent || ''
    ]);

    return jsonResponse_({
      status: 'ok',
      codigoVerificacion: codigoVerificacion,
      timestamp: timestamp.toISOString()
    });

  } catch (error) {
    return jsonResponse_({
      status: 'error',
      message: error.message
    });
  }
}

// Permite una prueba rápida abriendo la URL de la Web App directamente en el navegador
function doGet(e) {
  return jsonResponse_({
    status: 'ok',
    message: 'MATE-NEM Web Endpoint activo. Usa POST para enviar registros.'
  });
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('No se recibió ningún dato en la solicitud POST.');
  }
  return JSON.parse(e.postData.contents);
}

function validatePayload_(payload) {
  const requeridos = ['nombre', 'grado', 'grupo'];
  requeridos.forEach(function (campo) {
    if (!payload[campo]) {
      throw new Error('Falta el campo requerido: ' + campo);
    }
  });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
