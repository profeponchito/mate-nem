/**
 * MATE-NEM · Bootstrap de la aplicación
 * ----------------------------------------------------
 * Define las vistas de la SPA y las conecta con el router. Cada vista es
 * una función que recibe los parámetros de la ruta y devuelve HTML (string)
 * o un HTMLElement ya armado (cuando necesita mantener estado interno,
 * como la vista de un PDA con sus fases).
 *
 * Diseño: paleta índigo/violeta como marca, con un acento distinto por
 * grado (índigo, fucsia, esmeralda) para que la app se sienta vistosa y
 * fácil de ubicar. Los íconos son SVG dibujados a mano (sin librería
 * externa) y las animaciones vienen de las clases `mn-*` de styles.css.
 */

import { ruta, rutaPorDefecto, navegar, init } from './router.js';
import { guardarSesion, obtenerSesion, haySesion } from './session.js';
import { cargarListaPDAs, cargarPDAporId } from './pda-loader.js';
import { calcularResultado, esRespuestaCorrecta } from './gamification.js';
import { enviarRegistroPDA, reintentarPendientes } from './webhook.js';
import { generarConstancia, descargarComoPDF } from './constancia.js';

// ============================================================
// Sistema visual: acentos por grado + íconos SVG dibujados a mano
// ============================================================
const TEMAS_GRADO = {
  '1°': {
    grad: 'from-indigo-500 via-violet-500 to-purple-600',
    texto: 'text-indigo-600',
    chip: 'bg-indigo-50 text-indigo-700',
    borde: 'border-indigo-200'
  },
  '2°': {
    grad: 'from-fuchsia-500 via-pink-500 to-rose-500',
    texto: 'text-fuchsia-600',
    chip: 'bg-fuchsia-50 text-fuchsia-700',
    borde: 'border-fuchsia-200'
  },
  '3°': {
    grad: 'from-emerald-500 via-teal-500 to-cyan-600',
    texto: 'text-emerald-600',
    chip: 'bg-emerald-50 text-emerald-700',
    borde: 'border-emerald-200'
  }
};

function temaGrado_(grado) {
  return TEMAS_GRADO[grado] || TEMAS_GRADO['1°'];
}

/** Íconos SVG originales (trazo, sin relleno) para cada tipo de paso. */
function icono_(nombre, clase = 'w-5 h-5') {
  const iconos = {
    foco: `<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.9 1 .9 1.7V16h5.4v-.5c0-.7.4-1.3.9-1.7A6 6 0 0 0 12 3Z"/>`,
    libro: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 1 2.5 2V5.5Z"/>`,
    lupa: `<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>`,
    trofeo: `<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 5H5a3 3 0 0 0 3 5"/><path d="M16 5h3a3 3 0 0 1-3 5"/><path d="M12 13v3"/><path d="M9 20h6"/><path d="M9.5 16.2h5l.7 2.8h-6.4l.7-2.8Z"/>`,
    medalla: `<circle cx="12" cy="14.5" r="6"/><path d="m9 8.5-3-5"/><path d="m15 8.5 3-5"/><path d="M12 12.2 13.2 14.6 15.8 15l-1.9 1.8.4 2.6-2.3-1.2-2.3 1.2.4-2.6L8.2 15l2.6-.4 1.2-2.4Z"/>`,
    chispas: `<path d="M12 3v4M12 17v4M4.5 12h4M15.5 12h4"/><path d="M7 7l2 2M17 7l-2 2M7 17l2-2M17 17l-2-2"/><circle cx="12" cy="12" r="2.2"/>`,
    salida: `<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 8l-4 4 4 4"/><path d="M6 12h12"/>`,
    flecha: `<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>`
  };
  return `<svg viewBox="0 0 24 24" class="${clase}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconos[nombre] || ''}</svg>`;
}

/** Genera `style="animation-delay:...ms"` para escalonar animaciones de listas. */
function retraso_(indice, pasoMs = 70) {
  return `style="animation-delay:${indice * pasoMs}ms"`;
}

// ============================================================
// Vista: Registro (Nombre, Grado, Grupo)
// ============================================================
function vistaRegistro() {
  if (haySesion()) {
    navegar('/grados');
    return '';
  }

  // El formulario aún no existe en el DOM cuando este string se genera;
  // se engancha el listener en el siguiente ciclo de eventos.
  setTimeout(() => {
    const formulario = document.getElementById('form-registro');
    formulario?.addEventListener('submit', (evento) => {
      evento.preventDefault();
      const datos = new FormData(formulario);
      const nombre = (datos.get('nombre') || '').toString().trim();
      const grado = (datos.get('grado') || '').toString();
      const grupo = (datos.get('grupo') || '').toString().trim();

      if (!nombre || !grado || !grupo) return;

      guardarSesion({ nombre, grado, grupo });
      navegar('/grados');
    });
  }, 0);

  return `
    <div class="min-h-screen flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md">
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-300/50 mn-tarjeta">
            <span class="font-heading text-3xl font-extrabold text-white">M</span>
          </div>
          <h1 class="font-heading text-4xl font-extrabold mt-4 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
            MATE-NEM
          </h1>
          <p class="text-slate-500 mt-1">Matemáticas · Nueva Escuela Mexicana</p>
        </div>
        <form id="form-registro" class="mn-panel bg-white/90 backdrop-blur rounded-3xl shadow-xl shadow-indigo-200/40 border border-white p-6 sm:p-7 space-y-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Nombre completo</label>
            <input name="nombre" type="text" required autocomplete="name"
                   class="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                   placeholder="Ej. María López Hernández">
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Grado</label>
            <select name="grado" required
                    class="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition bg-white">
              <option value="" disabled selected>Selecciona tu grado</option>
              <option value="1°">1° de secundaria</option>
              <option value="2°">2° de secundaria</option>
              <option value="3°">3° de secundaria</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-1">Grupo</label>
            <input name="grupo" type="text" required
                   class="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition"
                   placeholder="Ej. A">
          </div>
          <button type="submit"
                  class="mn-elevar w-full bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-heading font-bold text-lg py-3 rounded-xl shadow-lg shadow-indigo-300/50 transition">
            Comenzar →
          </button>
        </form>
      </div>
    </div>
  `;
}

// ============================================================
// Vista: Selección de grado
// ============================================================
function vistaSeleccionGrado() {
  const sesion = obtenerSesion();
  if (!sesion) { navegar('/'); return ''; }

  const grados = ['1°', '2°', '3°'];

  return `
    ${encabezado_(sesion)}
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h2 class="font-heading text-2xl font-bold text-slate-800 mb-1">Hola, ${escapeHTML_(sesion.nombre.split(' ')[0])} 👋</h2>
      <p class="text-slate-500 mb-6">Elige tu grado para ver los PDAs disponibles.</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${grados.map((grado, i) => {
          const tema = temaGrado_(grado);
          return `
          <a href="#/pda-lista/${encodeURIComponent(grado)}" ${retraso_(i, 90)}
             class="mn-tarjeta mn-elevar group block rounded-3xl p-[2px] bg-gradient-to-br ${tema.grad} shadow-lg">
            <div class="bg-white rounded-[calc(1.5rem-2px)] px-6 py-8 text-center h-full">
              <span class="font-heading text-4xl font-extrabold bg-gradient-to-br ${tema.grad} bg-clip-text text-transparent">${grado}</span>
              <p class="text-slate-500 mt-1 font-medium">Secundaria</p>
              <p class="mt-3 inline-flex items-center gap-1 text-sm font-semibold ${tema.texto}">
                Ver PDAs ${icono_('flecha', 'w-4 h-4 group-hover:translate-x-1 transition-transform')}
              </p>
            </div>
          </a>
        `;
        }).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// Vista: Lista de PDAs de un grado
// ============================================================
async function vistaListaPDA({ grado }) {
  const sesion = obtenerSesion();
  if (!sesion) { navegar('/'); return ''; }

  const tema = temaGrado_(grado);
  let pdas = [];
  let error = null;
  try {
    pdas = await cargarListaPDAs(grado);
  } catch (e) {
    error = e.message;
  }

  return `
    ${encabezado_(sesion)}
    <div class="max-w-2xl mx-auto px-4 py-8">
      <a href="#/grados" class="inline-flex items-center gap-1 text-sm font-semibold ${tema.texto} hover:underline">
        ${icono_('flecha', 'w-4 h-4 rotate-180')} Cambiar de grado
      </a>
      <h2 class="font-heading text-2xl font-bold text-slate-800 mt-3 mb-6">PDAs de ${escapeHTML_(grado)} de secundaria</h2>
      ${error ? `<p class="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">No se pudieron cargar los PDAs: ${escapeHTML_(error)}</p>` : ''}
      ${(!error && pdas.length === 0) ? `<p class="text-slate-500">Todavía no hay PDAs cargados para este grado. Vuelve pronto.</p>` : ''}
      <div class="space-y-3">
        ${pdas.map((pda, i) => `
          <a href="#/pda/${encodeURIComponent(grado)}/${encodeURIComponent(pda.id)}" ${retraso_(i, 60)}
             class="mn-tarjeta mn-elevar block bg-white rounded-2xl shadow-sm border border-slate-100 p-4 border-l-4 ${tema.borde}">
            <p class="text-xs uppercase tracking-wide ${tema.texto} font-bold">${escapeHTML_(pda.eje)}</p>
            <p class="text-slate-800 font-semibold font-heading text-lg">${escapeHTML_(pda.titulo)}</p>
          </a>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// Vista: un PDA completo
// (problematización → subtemas [con checks formativos] → reto → resultado)
// ============================================================
async function vistaPDA({ grado, id }) {
  const sesion = obtenerSesion();
  if (!sesion) { navegar('/'); return ''; }

  const tema = temaGrado_(grado);

  let pda;
  try {
    pda = await cargarPDAporId(grado, id);
  } catch (e) {
    const contenedorError = document.createElement('div');
    contenedorError.innerHTML = `
      ${encabezado_(sesion)}
      <div class="max-w-2xl mx-auto px-4 py-8">
        <p class="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">No se pudo cargar el PDA: ${escapeHTML_(e.message)}</p>
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="${tema.texto} font-semibold hover:underline">← Volver</a>
      </div>
    `;
    return contenedorError;
  }

  // Aplana el PDA en una secuencia lineal de pasos: problematización,
  // cada subtema (más su check si tiene uno), el reto y el resultado.
  // Esto es lo que permite calcular el % de avance de forma sencilla.
  const pasos = [{ tipo: 'problematizacion' }];
  pda.subtemas.forEach((subtema, si) => {
    pasos.push({ tipo: 'subtema', subtemaIndex: si });
    if (subtema.check) pasos.push({ tipo: 'check', subtemaIndex: si });
  });
  pasos.push({ tipo: 'reto' });
  pasos.push({ tipo: 'resultado' });

  const raiz = document.createElement('div');
  const estado = {
    pasoIndex: 0,
    resultado: null,
    codigoVerificacion: null
  };

  function repintar() {
    const paso = pasos[estado.pasoIndex];
    const esResultado = paso.tipo === 'resultado';
    raiz.innerHTML = `
      ${encabezado_(sesion)}
      <div class="max-w-2xl mx-auto px-4 py-8">
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="inline-flex items-center gap-1 text-sm font-semibold ${tema.texto} hover:underline">
          ${icono_('flecha', 'w-4 h-4 rotate-180')} ${escapeHTML_(grado)} secundaria
        </a>
        ${barraAvance_(estado.pasoIndex, pasos.length, tema)}
        <div class="mn-panel bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 sm:p-7 mt-4">
          ${paso.tipo === 'problematizacion' ? panelProblematizacion_(pda, tema) : ''}
          ${paso.tipo === 'subtema' ? panelSubtema_(pda.subtemas[paso.subtemaIndex], paso.subtemaIndex, pda.subtemas.length, tema) : ''}
          ${paso.tipo === 'check' ? panelCheck_(pda.subtemas[paso.subtemaIndex], `check-${paso.subtemaIndex}`, tema) : ''}
          ${paso.tipo === 'reto' ? panelReto_(pda, tema) : ''}
          ${esResultado ? panelResultado_(pda, estado, tema) : ''}
        </div>
        ${esResultado && Array.isArray(pda.practicaExtra) && pda.practicaExtra.length > 0 ? panelPracticaExtra_(pda, tema) : ''}
      </div>
    `;
    conectarEventos_();
  }

  function conectarEventos_() {
    // Avanza al siguiente paso (problematización, subtemas, y "continuar" tras un check)
    raiz.querySelector('[data-accion="continuar"]')?.addEventListener('click', () => {
      estado.pasoIndex++;
      repintar();
    });

    // Verifica la respuesta del check formativo de un subtema (no se califica,
    // solo da retroalimentación inmediata antes de dejar continuar).
    raiz.querySelector('[data-accion="verificar-check"]')?.addEventListener('click', () => {
      const paso = pasos[estado.pasoIndex];
      const pregunta = pda.subtemas[paso.subtemaIndex].check;
      const prefijo = `check-${paso.subtemaIndex}`;
      const respuesta = leerRespuesta_(raiz, prefijo, pregunta.tipo);

      if (respuesta === null) {
        alert('Responde antes de continuar.');
        return;
      }

      const correcta = esRespuestaCorrecta(pregunta, respuesta);
      const feedback = raiz.querySelector('[data-check-feedback]');
      feedback.classList.remove('hidden');
      feedback.innerHTML = `
        <div class="text-sm px-4 py-3 rounded-xl border ${correcta ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
          <span class="font-bold">${correcta ? '✓ ¡Correcto!' : '✗ No es correcto.'}</span> ${escapeHTML_(pregunta.retroalimentacion)}
        </div>
      `;
      raiz.querySelector('[data-accion="verificar-check"]').classList.add('hidden');
      raiz.querySelector('[data-accion="continuar"]').classList.remove('hidden');
    });

    // Envía las respuestas del reto final: califica, guarda en Sheets y
    // avanza al panel de resultado.
    raiz.querySelector('[data-accion="enviar-reto"]')?.addEventListener('click', async () => {
      const reto = pda.reto;
      const respuestas = reto.reactivos.map((r, i) => leerRespuesta_(raiz, `reto-${i}`, r.tipo));

      if (respuestas.some((r) => r === null)) {
        alert('Responde todos los reactivos antes de continuar.');
        return;
      }

      estado.resultado = calcularResultado(pda, respuestas);
      estado.pasoIndex++; // avanza al paso 'resultado'
      repintar();

      try {
        const respuestaServidor = await enviarRegistroPDA({
          nombre: sesion.nombre,
          grado: sesion.grado,
          grupo: sesion.grupo,
          pdaId: pda.id,
          pdaNombre: pda.titulo,
          eje: pda.eje,
          puntaje: estado.resultado.puntaje,
          estrellas: estado.resultado.estrellas
        });
        estado.codigoVerificacion = respuestaServidor.codigoVerificacion;
      } catch {
        // Sin conexión al webhook (aún no desplegado o sin internet): se genera
        // un folio provisional para no bloquear la constancia; el registro
        // queda guardado en localStorage por webhook.js para reintentar después.
        estado.codigoVerificacion = 'PENDIENTE-' + Date.now();
      }
      repintar();
    });

    raiz.querySelector('[data-accion="ver-constancia"]')?.addEventListener('click', () => {
      const contenedorConstancia = raiz.querySelector('#contenedor-constancia');
      generarConstancia(contenedorConstancia, {
        nombre: sesion.nombre,
        grado: sesion.grado,
        grupo: sesion.grupo,
        pdaNombre: pda.titulo,
        eje: pda.eje,
        puntaje: estado.resultado.puntaje,
        estrellas: estado.resultado.estrellas,
        estrellasMax: pda.reto.estrellasMax || 3,
        codigoVerificacion: estado.codigoVerificacion
      });
      raiz.querySelector('[data-accion="ver-constancia"]')?.classList.add('hidden');
      raiz.querySelector('[data-accion="descargar-pdf"]')?.classList.remove('hidden');
    });

    raiz.querySelector('[data-accion="descargar-pdf"]')?.addEventListener('click', () => {
      descargarComoPDF('constancia', `constancia-${sesion.nombre.replace(/\s+/g, '_')}.pdf`);
    });

    // Práctica extra (opcional, no calificada): un botón "Verificar" por
    // reactivo, delegado porque hay varios con el mismo data-accion.
    raiz.querySelectorAll('[data-accion="verificar-practica"]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const indice = Number(boton.dataset.indice);
        const pregunta = pda.practicaExtra[indice];
        const prefijo = `practica-${indice}`;
        const respuesta = leerRespuesta_(raiz, prefijo, pregunta.tipo);

        if (respuesta === null) {
          alert('Responde antes de verificar.');
          return;
        }

        const correcta = esRespuestaCorrecta(pregunta, respuesta);
        const feedback = raiz.querySelector(`[data-practica-feedback="${indice}"]`);
        feedback.classList.remove('hidden');
        feedback.innerHTML = `
          <div class="text-sm px-4 py-3 rounded-xl border ${correcta ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
            <span class="font-bold">${correcta ? '✓ ¡Correcto!' : '✗ No es correcto.'}</span> ${escapeHTML_(pregunta.retroalimentacion)}
          </div>
        `;
        boton.classList.add('hidden');
      });
    });
  }

  repintar();
  return raiz;
}

// ============================================================
// Paneles de cada paso (usados por vistaPDA)
// ============================================================
function overline_(texto, iconoNombre, tema) {
  return `
    <p class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide ${tema.texto} font-bold mb-2 px-2.5 py-1 rounded-full ${tema.chip}">
      ${icono_(iconoNombre, 'w-3.5 h-3.5')} ${texto}
    </p>
  `;
}

function botonPrimario_(texto, dataAccion) {
  return `
    <button data-accion="${dataAccion}"
            class="mn-elevar bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-heading font-bold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition">
      ${texto}
    </button>
  `;
}

function panelProblematizacion_(pda, tema) {
  return `
    ${overline_('Problematización', 'foco', tema)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${escapeHTML_(pda.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-4">${escapeHTML_(pda.problematizacion.contexto)}</p>
    <p class="text-slate-800 font-semibold mb-6 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">${escapeHTML_(pda.problematizacion.pregunta)}</p>
    ${botonPrimario_('Comenzar el tema →', 'continuar')}
  `;
}

function panelSubtema_(subtema, indice, total, tema) {
  return `
    ${overline_(`Tema · Parte ${indice + 1} de ${total}`, 'libro', tema)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${escapeHTML_(subtema.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-3">${escapeHTML_(subtema.explicacion)}</p>
    ${subtema.formula ? `<p class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-slate-800 mb-3">${escapeHTML_(subtema.formula)}</p>` : ''}
    <div class="space-y-1.5 mb-6">
      ${subtema.ejemplos.map((ejemplo) => `<p class="text-slate-600 text-sm bg-indigo-50/60 rounded-lg px-3 py-2"><strong class="text-indigo-700">Ejemplo:</strong> ${escapeHTML_(ejemplo)}</p>`).join('')}
    </div>
    ${botonPrimario_('Continuar →', 'continuar')}
  `;
}

function panelCheck_(subtema, prefijo, tema) {
  const pregunta = subtema.check;
  return `
    ${overline_('Repaso rápido', 'lupa', tema)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${escapeHTML_(subtema.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-3">${escapeHTML_(subtema.explicacion)}</p>
    ${subtema.formula ? `<p class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-slate-800 mb-4">${escapeHTML_(subtema.formula)}</p>` : ''}
    <div class="border-t border-dashed border-slate-200 pt-4">
      ${renderizarPregunta_(pregunta, prefijo)}
    </div>
    <div data-check-feedback class="mt-3 hidden"></div>
    <div class="mt-4 flex gap-2">
      <button data-accion="verificar-check" class="mn-elevar bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700 text-white font-heading font-bold px-6 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition">
        Verificar
      </button>
      <button data-accion="continuar" class="hidden bg-slate-700 hover:bg-slate-800 text-white font-heading font-bold px-6 py-2.5 rounded-xl transition">
        Continuar →
      </button>
    </div>
  `;
}

function panelReto_(pda, tema) {
  const reto = pda.reto;
  return `
    ${overline_('Reto', 'trofeo', tema)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${escapeHTML_(pda.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">${escapeHTML_(reto.sintesis)}</p>
    <div class="space-y-6">
      ${reto.reactivos.map((reactivo, i) => `
        <div class="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
          <p class="text-slate-400 text-xs font-bold mb-1">REACTIVO ${i + 1} DE ${reto.reactivos.length}</p>
          ${renderizarPregunta_(reactivo, `reto-${i}`)}
        </div>
      `).join('')}
    </div>
    <div class="mt-6">
      ${botonPrimario_('Enviar respuestas', 'enviar-reto')}
    </div>
  `;
}

function panelResultado_(pda, estado, tema) {
  const r = estado.resultado;
  const estrellasMax = pda.reto.estrellasMax || 3;
  const perfecto = r.estrellas >= estrellasMax;

  return `
    ${overline_('Resultado', 'medalla', tema)}
    <p class="font-heading text-2xl sm:text-3xl font-bold text-slate-800 mb-2">${r.correctas} / ${r.total} correctas</p>
    <div class="relative inline-block mb-1">
      ${perfecto ? `<div class="mn-resplandor absolute inset-0 -m-3 rounded-full bg-amber-300/50 blur-xl"></div>` : ''}
      <p class="relative text-amber-500 text-2xl">
        ${Array.from({ length: r.estrellas }).map((_, i) => `<span class="mn-estrella" ${retraso_(i, 120)}>★</span>`).join('')}${'☆'.repeat(Math.max(0, estrellasMax - r.estrellas))}
      </p>
    </div>
    <p class="text-slate-600 font-semibold mb-4">${r.puntaje} pts</p>

    <div class="space-y-2 mb-6">
      ${r.detalle.map((d) => `
        <div class="text-sm px-4 py-3 rounded-xl border ${d.esCorrecta ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
          <span class="font-bold">${d.esCorrecta ? '✓' : '✗'}</span> ${escapeHTML_(d.resumen)}
          ${d.retroalimentacion ? `<br><span class="text-xs opacity-80">${escapeHTML_(d.retroalimentacion)}</span>` : ''}
        </div>
      `).join('')}
    </div>

    ${!estado.codigoVerificacion ? '<p class="text-slate-400 text-sm">Guardando tu avance…</p>' : `
      ${botonPrimario_('Generar mi constancia', 'ver-constancia')}
      <button data-accion="descargar-pdf" class="hidden mn-elevar bg-slate-700 hover:bg-slate-800 text-white font-heading font-bold px-6 py-2.5 rounded-xl transition ml-2">
        Descargar PDF
      </button>
      <div id="contenedor-constancia" class="mt-6"></div>
    `}
  `;
}

function panelPracticaExtra_(pda, tema) {
  return `
    <div class="mn-panel mt-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 rounded-3xl p-6 sm:p-7">
      ${overline_('Práctica extra', 'chispas', tema)}
      <h3 class="font-heading text-xl font-bold text-slate-800 mb-1">¿Quieres seguir practicando?</h3>
      <p class="text-slate-600 text-sm mb-5">Estos reactivos son opcionales y no cambian tu calificación ni tus estrellas: son solo para reforzar lo que aprendiste.</p>
      <div class="space-y-5">
        ${pda.practicaExtra.map((pregunta, i) => `
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <p class="text-slate-400 text-xs font-bold mb-2">PRÁCTICA ${i + 1} DE ${pda.practicaExtra.length}</p>
            ${renderizarPregunta_(pregunta, `practica-${i}`)}
            <div data-practica-feedback="${i}" class="mt-3 hidden"></div>
            <button data-accion="verificar-practica" data-indice="${i}"
                    class="mt-4 mn-elevar bg-white border-2 border-violet-500 text-violet-700 hover:bg-violet-50 font-heading font-bold px-5 py-2 rounded-xl transition">
              Verificar
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ============================================================
// Renderizador genérico de preguntas (4 tipos) + lectura del DOM
// ============================================================

/** Devuelve el HTML de una pregunta según su tipo. `prefijo` identifica sus inputs en el DOM. */
function renderizarPregunta_(pregunta, prefijo) {
  switch (pregunta.tipo) {
    case 'opcion_multiple':
      return `
        <p class="text-slate-800 font-medium mb-2">${escapeHTML_(pregunta.pregunta)}</p>
        <div class="space-y-1.5">
          ${pregunta.opciones.map((opcion, j) => `
            <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-indigo-50 transition">
              <input type="radio" name="preg-${prefijo}" value="${j}" data-preg="${prefijo}" class="accent-indigo-600 w-4 h-4">
              ${escapeHTML_(opcion)}
            </label>
          `).join('')}
        </div>
      `;

    case 'verdadero_falso':
      return `
        <p class="text-slate-800 font-medium mb-2">${escapeHTML_(pregunta.enunciado)}</p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition">
            <input type="radio" name="preg-${prefijo}" value="true" data-preg="${prefijo}" class="accent-indigo-600 w-4 h-4"> Verdadero
          </label>
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition">
            <input type="radio" name="preg-${prefijo}" value="false" data-preg="${prefijo}" class="accent-indigo-600 w-4 h-4"> Falso
          </label>
        </div>
      `;

    case 'llenar_frase': {
      const [antes, despues] = pregunta.frase.split('___');
      return `
        <p class="text-slate-800 font-medium mb-2">
          ${escapeHTML_(antes || '')}<input type="text" data-preg="${prefijo}"
            class="inline-block border-b-2 border-indigo-500 focus:outline-none focus:border-fuchsia-500 px-1 mx-1 w-24 text-center bg-indigo-50/50 rounded-t">${escapeHTML_(despues || '')}
        </p>
      `;
    }

    case 'relacionar_columnas':
      return `
        <p class="text-slate-800 font-medium mb-3">${escapeHTML_(pregunta.instruccion || 'Relaciona cada elemento con su pareja correcta.')}</p>
        <div class="space-y-2">
          ${pregunta.columnaA.map((item) => `
            <div class="flex items-center gap-3">
              <span class="text-slate-700 flex-1">${escapeHTML_(item)}</span>
              <select data-preg="${prefijo}" class="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Selecciona…</option>
                ${pregunta.columnaB.map((opcion, j) => `<option value="${j}">${escapeHTML_(opcion)}</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
      `;

    default:
      return '';
  }
}

/** Lee del DOM la respuesta capturada para una pregunta, según su tipo. Devuelve null si falta algo. */
function leerRespuesta_(raiz, prefijo, tipo) {
  if (tipo === 'opcion_multiple' || tipo === 'verdadero_falso') {
    const marcado = raiz.querySelector(`input[data-preg="${prefijo}"]:checked`);
    if (!marcado) return null;
    return tipo === 'verdadero_falso' ? marcado.value === 'true' : Number(marcado.value);
  }

  if (tipo === 'llenar_frase') {
    const input = raiz.querySelector(`input[data-preg="${prefijo}"]`);
    const valor = input ? input.value.trim() : '';
    return valor === '' ? null : valor;
  }

  if (tipo === 'relacionar_columnas') {
    const selects = raiz.querySelectorAll(`select[data-preg="${prefijo}"]`);
    const valores = Array.from(selects).map((s) => (s.value === '' ? null : Number(s.value)));
    return valores.some((v) => v === null) ? null : valores;
  }

  return null;
}

function barraAvance_(pasoIndex, totalPasos, tema) {
  const porcentaje = Math.round((pasoIndex / (totalPasos - 1)) * 100);
  return `
    <div class="mt-3">
      <div class="flex justify-between text-xs text-slate-500 mb-1 font-medium">
        <span>Avance</span><span>${porcentaje}%</span>
      </div>
      <div class="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div class="mn-barra-avance h-2.5 rounded-full bg-gradient-to-r ${tema.grad}" style="width:${porcentaje}%"></div>
      </div>
    </div>
  `;
}

// ============================================================
// Vista: 404
// ============================================================
function vista404() {
  return `
    <div class="max-w-md mx-auto px-4 py-16 text-center">
      <p class="text-6xl mb-4">🤔</p>
      <p class="text-slate-600">No encontramos esa página.</p>
      <a href="#/" class="text-indigo-700 font-semibold hover:underline">Volver al inicio</a>
    </div>
  `;
}

// ============================================================
// Utilidades compartidas
// ============================================================
function encabezado_(sesion) {
  return `
    <header class="mn-puntos bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 px-4 py-3 flex items-center justify-between no-imprimir shadow-md">
      <a href="#/grados" class="flex items-center gap-2 font-heading font-extrabold text-white">
        <span class="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20">M</span>
        MATE-NEM
      </a>
      <div class="text-sm text-white/90 flex items-center gap-3">
        <span class="hidden sm:inline">${escapeHTML_(sesion.nombre)} · ${escapeHTML_(sesion.grado)} ${escapeHTML_(sesion.grupo)}</span>
        <button onclick="localStorage.removeItem('mateNemSesion'); location.hash='#/'; location.reload();"
                class="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg font-semibold transition">
          ${icono_('salida', 'w-4 h-4')} Salir
        </button>
      </div>
    </header>
  `;
}

function escapeHTML_(texto = '') {
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}

// ============================================================
// Registro de rutas e inicio de la app
// ============================================================
ruta('/', vistaRegistro);
ruta('/grados', vistaSeleccionGrado);
ruta('/pda-lista/:grado', vistaListaPDA);
ruta('/pda/:grado/:id', vistaPDA);
rutaPorDefecto(vista404);

document.addEventListener('DOMContentLoaded', () => {
  init('app');

  // Si en una sesión anterior no había internet o el webhook aún no estaba
  // desplegado, aquí se reintenta en silencio (no bloquea el uso de la app).
  reintentarPendientes().catch(() => {});
});
