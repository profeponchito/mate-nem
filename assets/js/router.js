/**
 * MATE-NEM · Router SPA (hash-based)
 * ----------------------------------------------------
 * Router minimalista sin dependencias externas. Registra rutas con
 * patrones tipo '/pda/:grado/:id' y renderiza el resultado de cada
 * manejador dentro del contenedor indicado en init(). Usa el hash de la
 * URL (#/ruta) para no necesitar configuración de servidor en GitHub Pages.
 */

const rutas = [];
let contenedor = null;
let rutaNoEncontrada = null;

/**
 * Registra una ruta.
 * @param {string} patron - ej. '/', '/grados', '/pda/:grado/:id'
 * @param {Function} manejador - async (params) => string | HTMLElement
 */
export function ruta(patron, manejador) {
  const nombresParametros = [];
  const regexTexto = patron
    .replace(/\/:([^/]+)/g, (_, nombre) => {
      nombresParametros.push(nombre);
      return '/([^/]+)';
    })
    .replace(/\//g, '\\/');

  rutas.push({
    regex: new RegExp(`^${regexTexto}$`),
    nombresParametros,
    manejador
  });
}

/** Manejador que se usa cuando ninguna ruta registrada coincide. */
export function rutaPorDefecto(manejador) {
  rutaNoEncontrada = manejador;
}

export function navegar(destino) {
  window.location.hash = destino;
}

/** Inicializa el router: engancha el contenedor y arranca el render. */
export function init(idContenedor) {
  contenedor = document.getElementById(idContenedor);
  window.addEventListener('hashchange', renderizarRutaActual);
  renderizarRutaActual();
}

async function renderizarRutaActual() {
  const hash = window.location.hash.replace(/^#/, '') || '/';

  for (const r of rutas) {
    const coincidencia = hash.match(r.regex);
    if (coincidencia) {
      const params = {};
      r.nombresParametros.forEach((nombre, i) => {
        params[nombre] = decodeURIComponent(coincidencia[i + 1]);
      });
      await renderizar_(r.manejador, params);
      return;
    }
  }

  if (rutaNoEncontrada) {
    await renderizar_(rutaNoEncontrada, {});
  }
}

async function renderizar_(manejador, params) {
  if (!contenedor) return;
  contenedor.innerHTML = '<p class="text-center text-slate-400 py-10">Cargando…</p>';

  let resultado;
  try {
    resultado = await manejador(params);
  } catch (error) {
    console.error('[router] Error al renderizar la ruta:', error);
    contenedor.innerHTML = `<p class="text-center text-red-600 py-10">Ocurrió un error: ${error.message}</p>`;
    return;
  }

  if (typeof resultado === 'string') {
    contenedor.innerHTML = resultado;
  } else if (resultado instanceof HTMLElement) {
    contenedor.innerHTML = '';
    contenedor.appendChild(resultado);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}
