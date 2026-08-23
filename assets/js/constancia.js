/**
 * MATE-NEM · Módulo de Constancias
 * ----------------------------------------------------
 * Genera dinámicamente el HTML de una constancia/diploma, incluyendo
 * un código QR de verificación, y ofrece exportación a PDF.
 *
 * Dependencias externas (cargar vía CDN en el HTML anfitrión, ANTES de
 * importar este módulo):
 *  - qrcode.js   → https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js
 *  - html2pdf.js → https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js
 *
 * Ver components/constancia.html para un ejemplo de uso completo.
 */

// Cambia esto por la URL real donde vivirá la página de verificación de folios.
const URL_BASE_VERIFICACION = 'https://TU-USUARIO.github.io/mate-nem/verificar.html?codigo=';

/**
 * Inserta el diploma dentro de un contenedor del DOM.
 * @param {HTMLElement} contenedor - Elemento donde se renderiza la constancia.
 * @param {Object} datos - {
 *   nombre, grado, grupo, pdaNombre, eje,
 *   puntaje, estrellas, estrellasMax, codigoVerificacion, fecha
 * }
 */
export function generarConstancia(contenedor, datos) {
  const fecha = datos.fecha || new Date().toLocaleDateString('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  contenedor.innerHTML = `
    <div id="constancia" class="constancia">
      <div class="constancia__marco">
        <p class="constancia__sello">MATE-NEM</p>
        <h1 class="constancia__titulo">Constancia de Logro</h1>
        <p class="constancia__subtitulo">Nueva Escuela Mexicana · Matemáticas</p>

        <p class="constancia__texto">Se otorga la presente constancia a:</p>
        <h2 class="constancia__nombre">${escapeHTML_(datos.nombre)}</h2>

        <p class="constancia__texto">
          de <strong>${escapeHTML_(datos.grado)}</strong> de secundaria, grupo
          <strong>${escapeHTML_(datos.grupo)}</strong>, por haber concluido satisfactoriamente
          el Proceso de Desarrollo de Aprendizaje:
        </p>
        <h3 class="constancia__pda">${escapeHTML_(datos.pdaNombre || '')}</h3>
        <p class="constancia__eje">${escapeHTML_(datos.eje || '')}</p>

        <div class="constancia__resultados">
          <span>Puntaje: <strong>${datos.puntaje ?? '—'}</strong></span>
          <span>Estrellas: <strong>${'★'.repeat(datos.estrellas || 0)}${'☆'.repeat(Math.max(0, (datos.estrellasMax || 3) - (datos.estrellas || 0)))}</strong></span>
        </div>

        <div class="constancia__pie">
          <div class="constancia__fecha">${fecha}</div>
          <div id="constancia-qr" class="constancia__qr"></div>
          <div class="constancia__folio">Folio: ${escapeHTML_(datos.codigoVerificacion)}</div>
        </div>
      </div>
    </div>
  `;

  renderizarQR_(datos.codigoVerificacion);
}

function renderizarQR_(codigoVerificacion) {
  const destino = document.getElementById('constancia-qr');
  if (!destino || typeof QRCode === 'undefined') return;

  destino.innerHTML = '';
  new QRCode(destino, {
    text: URL_BASE_VERIFICACION + encodeURIComponent(codigoVerificacion),
    width: 96,
    height: 96,
    correctLevel: QRCode.CorrectLevel.M
  });
}

/**
 * Exporta el nodo de la constancia a un archivo PDF descargable.
 * @param {string} idElemento - id del contenedor a exportar (por defecto "constancia").
 * @param {string} nombreArchivo - nombre del PDF descargado.
 */
export function descargarComoPDF(idElemento = 'constancia', nombreArchivo = 'constancia-mate-nem.pdf') {
  const elemento = document.getElementById(idElemento);
  if (!elemento || typeof html2pdf === 'undefined') {
    console.error('[constancia] html2pdf no está disponible o el elemento no existe.');
    return;
  }

  html2pdf().set({
    margin: 0.4,
    filename: nombreArchivo,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
  }).from(elemento).save();
}

function escapeHTML_(texto = '') {
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}
