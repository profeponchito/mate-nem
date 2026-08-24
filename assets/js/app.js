/**
 * MATE-NEM · Bootstrap de la aplicación
 * ----------------------------------------------------
 * Define las vistas de la SPA y las conecta con el router. Cada vista es
 * una función que recibe los parámetros de la ruta y devuelve HTML (string)
 * o un HTMLElement ya armado (cuando necesita mantener estado interno,
 * como la vista de un PDA con sus fases).
 *
 * Diseño: cada FASE del recorrido de un PDA tiene su propio color de acento
 * (problematización=ámbar, tema=azul, repaso=violeta, reto=rosa,
 * resultado=oro, práctica extra=verde azulado), para que de un vistazo se
 * note en qué parte del recorrido estás — además de la marca general
 * índigo/violeta y el acento por grado (distinto en cada uno de los 3
 * grados) en las pantallas de navegación. Los íconos son SVG dibujados a
 * mano (sin librería externa) y las animaciones vienen de las clases
 * `mn-*` de styles.css.
 */

import { ruta, rutaPorDefecto, navegar, init } from './router.js';
import { guardarSesion, obtenerSesion, haySesion } from './session.js';
import { cargarListaPDAs, cargarPDAporId } from './pda-loader.js';
import { calcularResultado, combinarResultados, esRespuestaCorrecta } from './gamification.js';
import { enviarRegistroPDA, reintentarPendientes } from './webhook.js';
import { generarConstancia, descargarComoPDF } from './constancia.js';

// ============================================================
// Sistema visual: acento por grado (navegación) + acento por fase (PDA)
// ----------------------------------------------------------------
// Paleta "Aula NEM": original y deliberadamente distinta a la de Duolingo
// (evita su verde #58CC02, azul #1CB0F6, dorado #FFC800 y rojo #FF4B4B) —
// tonos más profundos y terrosos (azul pizarrón, cobre, verde bosque,
// grafito, vino, ocre) para una sensación "de estudio", no infantil.
// `pista` es el color (hex, para el trazo SVG del camino) de cada grado.
// ============================================================
const TEMAS_GRADO = {
  '1°': {
    grad: 'from-blue-700 to-blue-900',
    texto: 'text-blue-700',
    chip: 'bg-blue-50 text-blue-800',
    borde: 'border-blue-200',
    pista: '#1d4ed8'
  },
  '2°': {
    grad: 'from-orange-700 to-amber-900',
    texto: 'text-orange-700',
    chip: 'bg-orange-50 text-orange-800',
    borde: 'border-orange-200',
    pista: '#c2410c'
  },
  '3°': {
    grad: 'from-emerald-800 to-teal-900',
    texto: 'text-emerald-800',
    chip: 'bg-emerald-50 text-emerald-800',
    borde: 'border-emerald-200',
    pista: '#065f46'
  }
};

/** Acento propio de "Ejercítate" (grafito) — deliberadamente distinto del
 * de los 3 grados y del de `practicaExtra`, para que se distinga como su
 * propia sección, sin pertenecer a la ruta curricular de ningún grado. */
const COLOR_EJERCITATE = {
  grad: 'from-slate-600 to-slate-800',
  texto: 'text-slate-700',
  chip: 'bg-slate-100 text-slate-700',
  borde: 'border-slate-300',
  pista: '#334155'
};

/** "ejercitate" es un pseudo-grado: reutiliza todo el flujo de vistaPDA/
 * vistaListaPDA (camino, gamificación, webhook, constancia) sin pertenecer
 * a la ruta curricular de ningún grado — solo cambia el acento de color. */
function temaGrado_(grado) {
  if (grado === 'ejercitate') return COLOR_EJERCITATE;
  return TEMAS_GRADO[grado] || TEMAS_GRADO['1°'];
}

/** Texto legible para el encabezado/breadcrumb de un (pseudo-)grado. */
function etiquetaGrado_(grado) {
  return grado === 'ejercitate' ? 'Ejercítate' : `${grado} de secundaria`;
}

// Un color distinto por FASE del recorrido de un PDA: además de vistoso,
// ayuda a ubicarse ("¿en qué parte voy?") de un vistazo, sin leer texto.
const PASO_COLOR = {
  problematizacion: {
    chip: 'bg-amber-50 text-amber-800', texto: 'text-amber-700',
    grad: 'from-amber-700 to-orange-800', suave: 'bg-amber-50 border-amber-200',
    accent: 'accent-amber-700', hover: 'hover:bg-amber-50',
    inputBorder: 'border-amber-600', inputFocus: 'focus:border-orange-700 bg-amber-50/50',
    ring: 'focus:ring-amber-600'
  },
  subtema: {
    chip: 'bg-blue-50 text-blue-800', texto: 'text-blue-700',
    grad: 'from-blue-700 to-indigo-900', suave: 'bg-blue-50 border-blue-200',
    accent: 'accent-blue-700', hover: 'hover:bg-blue-50',
    inputBorder: 'border-blue-600', inputFocus: 'focus:border-indigo-800 bg-blue-50/50',
    ring: 'focus:ring-blue-600'
  },
  check: {
    chip: 'bg-violet-50 text-violet-800', texto: 'text-violet-700',
    grad: 'from-violet-700 to-purple-900', suave: 'bg-violet-50 border-violet-200',
    accent: 'accent-violet-700', hover: 'hover:bg-violet-50',
    inputBorder: 'border-violet-600', inputFocus: 'focus:border-purple-800 bg-violet-50/50',
    ring: 'focus:ring-violet-600'
  },
  reto: {
    chip: 'bg-rose-50 text-rose-800', texto: 'text-rose-700',
    grad: 'from-rose-800 to-red-900', suave: 'bg-rose-50 border-rose-200',
    accent: 'accent-rose-800', hover: 'hover:bg-rose-50',
    inputBorder: 'border-rose-700', inputFocus: 'focus:border-red-900 bg-rose-50/50',
    ring: 'focus:ring-rose-700'
  },
  resultado: {
    chip: 'bg-amber-50 text-amber-800', texto: 'text-amber-700',
    grad: 'from-amber-600 to-yellow-800', suave: 'bg-amber-50 border-amber-200',
    accent: 'accent-amber-600', hover: 'hover:bg-amber-50',
    inputBorder: 'border-amber-600', inputFocus: 'focus:border-yellow-700 bg-amber-50/50',
    ring: 'focus:ring-amber-600'
  },
  practicaExtra: {
    chip: 'bg-teal-50 text-teal-800', texto: 'text-teal-700',
    grad: 'from-teal-700 to-emerald-900', suave: 'bg-teal-50 border-teal-200',
    accent: 'accent-teal-700', hover: 'hover:bg-teal-50',
    inputBorder: 'border-teal-600', inputFocus: 'focus:border-emerald-800 bg-teal-50/50',
    ring: 'focus:ring-teal-600'
  }
};

/** Etiqueta de dificultad de cada uno de los 4 subtemas "núcleo" de un PDA
 * (de menor a mayor), mostrada junto a su número para que se note la
 * progresión. Los subtemas de repaso opcionales que se agregan después
 * (índice 4 en adelante) usan su propia etiqueta "Repaso" — ver nivelChip_. */
const NIVEL_DIFICULTAD = ['Introductorio', 'Intermedio', 'Avanzado', 'Síntesis'];

/** Paleta de colores del confeti de la celebración final (toma un color de
 * cada tono de la paleta "Aula NEM", como un pequeño resumen de todas las
 * fases del recorrido). */
const CONFETI_COLORES = ['#1d4ed8', '#c2410c', '#065f46', '#b45309', '#9f1239', '#475569'];

/** Devuelve una copia de `arr` con sus elementos en orden aleatorio (Fisher–Yates). */
function barajar_(arr) {
  const copia = arr.slice();
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/** Devuelve una copia de un reactivo con sus opciones (opcion_multiple) o
 * columnaB (relacionar_columnas) en orden aleatorio, ajustando los índices
 * de respuesta correcta para que sigan apuntando al lugar correcto. Los
 * demás tipos (verdadero_falso, llenar_frase) no tienen opciones que mezclar. */
function variarOpciones_(reactivo) {
  if (reactivo.tipo === 'opcion_multiple') {
    const indices = barajar_(reactivo.opciones.map((_, i) => i));
    return {
      ...reactivo,
      opciones: indices.map((i) => reactivo.opciones[i]),
      respuestaCorrecta: indices.indexOf(reactivo.respuestaCorrecta)
    };
  }
  if (reactivo.tipo === 'relacionar_columnas') {
    const indices = barajar_(reactivo.columnaB.map((_, i) => i));
    return {
      ...reactivo,
      columnaB: indices.map((i) => reactivo.columnaB[i]),
      parejasCorrectas: reactivo.parejasCorrectas.map((idxOriginal) => indices.indexOf(idxOriginal))
    };
  }
  return reactivo;
}

/** Prepara los 5 reactivos de la mini-actividad de un subtema para un
 * intento: orden de las preguntas y de sus opciones mezclado, así rehacer
 * un subtema no se ve idéntico la segunda vez. */
function variarReactivos_(reactivos) {
  return barajar_(reactivos).map(variarOpciones_);
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
    flecha: `<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>`,
    descarga: `<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 19.5h16"/>`,
    operaciones: `<path d="M6 4v6M3 7h6"/><path d="M4 17h6M4 20h6"/><path d="M15 8h6"/><circle cx="18" cy="4.5" r="0.7" fill="currentColor"/><circle cx="18" cy="11.5" r="0.7" fill="currentColor"/><path d="M15 15l6 6M21 15l-6 6"/>`
  };
  return `<svg viewBox="0 0 24 24" class="${clase}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconos[nombre] || ''}</svg>`;
}

/** Genera `style="animation-delay:...ms"` para escalonar animaciones de listas. */
function retraso_(indice, pasoMs = 70) {
  return `style="animation-delay:${indice * pasoMs}ms"`;
}

// ============================================================
// Camino serpenteante estilo Duolingo (sin bloqueo de nodos: el docente
// puede pedir cualquier PDA/nivel en cualquier momento, así que TODOS los
// nodos se ven y son clickeables siempre — nunca hay candados).
// ============================================================

/** Calcula las posiciones (x,y) de `n` nodos en un sendero vertical
 * ondulante (onda seno, periodo de 4 filas: centro → derecha → centro →
 * izquierda → …), en el sistema de coordenadas `anchoBase`×(altoFila×n). */
function posicionesCamino_(n, anchoBase, altoFila, amplitud) {
  const centroX = anchoBase / 2;
  const puntos = [];
  for (let i = 0; i < n; i++) {
    const angulo = (i * Math.PI) / 2;
    puntos.push({
      x: centroX + Math.sin(angulo) * amplitud,
      y: altoFila * i + altoFila / 2
    });
  }
  return puntos;
}

/** Traza una curva SVG suave (tipo Catmull-Rom → Bézier cúbica) que pasa
 * por cada uno de los puntos dados, para dibujar el sendero como una línea
 * fluida en vez de un zigzag de segmentos rectos. */
function trazoSuave_(puntos) {
  if (puntos.length < 2) return '';
  let d = `M ${puntos[0].x},${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] || puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

/** Renderiza la lista de PDAs de un grado como un camino serpenteante:
 * un trazo curvo (SVG) de fondo con un nodo circular numerado por PDA
 * (ninguno bloqueado) y su título como etiqueta. Las coordenadas de los
 * nodos se expresan en % (no en px) para que el camino sea responsive,
 * mientras que la proporción del contenedor se fija con `aspect-ratio`
 * para que esos % siempre coincidan con el trazo del SVG. */
function caminoPDAs_(pdas, grado, tema) {
  const ANCHO = 320;
  const ALTO_FILA = 136;
  const AMPLITUD = 92;
  const puntos = posicionesCamino_(pdas.length, ANCHO, ALTO_FILA, AMPLITUD);
  const alturaTotal = ALTO_FILA * pdas.length;
  const trazo = trazoSuave_(puntos);

  const nodos = pdas.map((pda, i) => {
    const xPct = (puntos[i].x / ANCHO) * 100;
    const yPct = (puntos[i].y / alturaTotal) * 100;
    return `
      <a href="#/pda/${encodeURIComponent(grado)}/${encodeURIComponent(pda.id)}"
         class="group absolute flex flex-col items-center"
         style="left:${xPct}%; top:${yPct}%; transform:translate(-50%,-50%);">
        <span class="mn-tarjeta w-16 h-16 rounded-full bg-gradient-to-br ${tema.grad} shadow-lg flex items-center justify-center font-heading font-extrabold text-white text-xl border-4 border-white group-hover:scale-105 group-active:scale-95 transition-transform"
              style="animation-delay:${i * 90}ms">
          ${pda.numero ?? (i + 1)}
        </span>
        <span class="mt-2 w-28 text-center text-xs font-semibold ${tema.texto} bg-white/95 backdrop-blur px-2 py-1 rounded-full shadow-sm border ${tema.borde} mn-clamp-2">
          ${escapeHTML_(pda.titulo)}
        </span>
      </a>
    `;
  }).join('');

  return `
    <p class="text-center text-xs text-slate-400 mb-3">Elige cualquier tema del camino — nada está bloqueado.</p>
    <div class="relative mx-auto" style="max-width:${ANCHO}px; aspect-ratio:${ANCHO}/${alturaTotal};">
      <svg viewBox="0 0 ${ANCHO} ${alturaTotal}" class="absolute inset-0 w-full h-full" aria-hidden="true">
        <path d="${trazo}" fill="none" stroke="${tema.pista}" stroke-width="6" stroke-linecap="round" stroke-dasharray="2 16" opacity="0.35"/>
      </svg>
      ${nodos}
    </div>
  `;
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
  const ej = COLOR_EJERCITATE;

  return `
    ${encabezado_(sesion)}
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h2 class="font-heading text-2xl font-bold text-slate-800 mb-1">Hola, ${escapeHTML_(sesion.nombre.split(' ')[0])} 👋</h2>
      <p class="text-slate-500 mb-6">Elige tu grado para ver los PDAs disponibles, o practica cualquier tema de matemáticas de secundaria sin importar tu grado.</p>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <a href="#/pda-lista/ejercitate" ${retraso_(3, 90)}
           class="mn-tarjeta mn-elevar group block rounded-3xl p-[2px] bg-gradient-to-br ${ej.grad} shadow-lg">
          <div class="bg-white rounded-[calc(1.5rem-2px)] px-6 py-8 text-center h-full flex flex-col items-center justify-center">
            <span class="inline-flex items-center justify-center w-12 h-12 rounded-2xl ${ej.chip} mb-2">${icono_('operaciones', 'w-6 h-6')}</span>
            <span class="font-heading text-xl font-extrabold bg-gradient-to-br ${ej.grad} bg-clip-text text-transparent">Ejercítate</span>
            <p class="text-slate-500 mt-1 font-medium text-sm">36 temas, todos los grados</p>
            <p class="mt-3 inline-flex items-center gap-1 text-sm font-semibold ${ej.texto}">
              Practicar ${icono_('flecha', 'w-4 h-4 group-hover:translate-x-1 transition-transform')}
            </p>
          </div>
        </a>
      </div>
    </div>
  `;
}

// ============================================================
// Vista: Lista de PDAs de un grado
// ============================================================
/** Las 4 categorías de "Ejercítate" (pseudo-grado), en el orden fijo del
 * usuario — cada una se dibuja como su propio mini-camino serpenteante,
 * con un encabezado, en vez de un solo camino de 36 nodos sin distinción. */
const CATEGORIAS_EJERCITATE = [
  { clave: 'basico', etiqueta: 'Temas básicos · 1°' },
  { clave: 'intermedio', etiqueta: 'Temas intermedios · 2°' },
  { clave: 'avanzado', etiqueta: 'Temas avanzados · 3°' },
  { clave: 'estadistica', etiqueta: 'Estadística y probabilidad' }
];

function caminoEjercitateAgrupado_(pdas, grado, tema) {
  return CATEGORIAS_EJERCITATE.map((cat) => {
    const items = pdas.filter((p) => p.categoria === cat.clave);
    if (items.length === 0) return '';
    return `
      <div class="mb-10">
        <h3 class="font-heading text-lg font-bold ${tema.texto} text-center mb-1">${escapeHTML_(cat.etiqueta)}</h3>
        ${caminoPDAs_(items, grado, tema)}
      </div>
    `;
  }).join('');
}

async function vistaListaPDA({ grado }) {
  const sesion = obtenerSesion();
  if (!sesion) { navegar('/'); return ''; }

  const tema = temaGrado_(grado);
  const esEjercitate = grado === 'ejercitate';
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
        ${icono_('flecha', 'w-4 h-4 rotate-180')} ${esEjercitate ? 'Volver' : 'Cambiar de grado'}
      </a>
      <h2 class="font-heading text-2xl font-bold text-slate-800 mt-3 mb-1">${esEjercitate ? 'Ejercítate' : `PDAs de ${etiquetaGrado_(grado)}`}</h2>
      ${esEjercitate ? `<p class="text-slate-500 mb-6">36 temas de matemáticas de secundaria, disponibles para cualquier grado.</p>` : `<div class="mb-6"></div>`}
      ${error ? `<p class="text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">No se pudieron cargar los PDAs: ${escapeHTML_(error)}</p>` : ''}
      ${(!error && pdas.length === 0) ? `<p class="text-slate-500">Todavía no hay PDAs cargados para este grado. Vuelve pronto.</p>` : ''}
      ${!error && pdas.length > 0 ? (esEjercitate ? caminoEjercitateAgrupado_(pdas, grado, tema) : caminoPDAs_(pdas, grado, tema)) : ''}
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

  // Aplana el PDA en una secuencia lineal de pasos: problematización, y por
  // cada uno de los 4 subtemas (de menor a mayor dificultad) su teoría, su
  // mini-actividad calificada (5 reactivos) y su mini-resultado propio; al
  // final, el resultado GLOBAL del PDA (suma de los 4 mini-resultados).
  const pasos = [{ tipo: 'problematizacion' }];
  pda.subtemas.forEach((subtema, si) => {
    pasos.push({ tipo: 'subtema', subtemaIndex: si });
    pasos.push({ tipo: 'actividad', subtemaIndex: si });
    pasos.push({ tipo: 'miniResultado', subtemaIndex: si });
  });
  pasos.push({ tipo: 'resultado' });

  const raiz = document.createElement('div');
  const estado = {
    pasoIndex: 0,
    resultadosSubtemas: new Array(pda.subtemas.length).fill(null),
    resultado: null, // resultado global, se calcula al terminar el subtema 4
    codigoVerificacion: null,
    reactivosVariados: {} // { [subtemaIndex]: reactivos de esa mini-actividad, ya barajados para este intento }
  };

  /** Reactivos (orden + opciones mezclados) de la mini-actividad de un
   * subtema para el intento actual — se calculan una sola vez por intento
   * y se reutilizan en repintados posteriores del mismo paso. */
  function reactivosDeActividad_(subtemaIndex) {
    if (!estado.reactivosVariados[subtemaIndex]) {
      estado.reactivosVariados[subtemaIndex] = variarReactivos_(pda.subtemas[subtemaIndex].reactivos);
    }
    return estado.reactivosVariados[subtemaIndex];
  }

  function repintar() {
    const paso = pasos[estado.pasoIndex];
    const esResultado = paso.tipo === 'resultado';
    raiz.innerHTML = `
      ${encabezado_(sesion)}
      <div class="max-w-2xl mx-auto px-4 py-8">
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="inline-flex items-center gap-1 text-sm font-semibold ${tema.texto} hover:underline">
          ${icono_('flecha', 'w-4 h-4 rotate-180')} ${escapeHTML_(etiquetaGrado_(grado))}
        </a>
        ${caminoPasos_(estado.pasoIndex, pasos.length, tema)}
        <div class="mn-panel bg-white rounded-3xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 sm:p-7 mt-4">
          ${paso.tipo === 'problematizacion' ? panelProblematizacion_(pda, PASO_COLOR.problematizacion) : ''}
          ${paso.tipo === 'subtema' ? panelSubtema_(pda.subtemas[paso.subtemaIndex], paso.subtemaIndex, pda.subtemas.length, PASO_COLOR.subtema) : ''}
          ${paso.tipo === 'actividad' ? panelActividad_(pda.subtemas[paso.subtemaIndex], paso.subtemaIndex, pda.subtemas.length, reactivosDeActividad_(paso.subtemaIndex), PASO_COLOR.reto) : ''}
          ${paso.tipo === 'miniResultado' ? panelMiniResultado_(pda.subtemas[paso.subtemaIndex], estado.resultadosSubtemas[paso.subtemaIndex], paso.subtemaIndex === pda.subtemas.length - 1, PASO_COLOR.reto) : ''}
          ${esResultado ? panelResultado_(pda, estado, PASO_COLOR.resultado) : ''}
        </div>
        ${esResultado && Array.isArray(pda.practicaExtra) && pda.practicaExtra.length > 0 ? panelPracticaExtra_(pda, PASO_COLOR.practicaExtra) : ''}
        ${esResultado && estado.codigoVerificacion ? panelCelebracion_(pda, estado.resultado, grado, PASO_COLOR.resultado) : ''}
      </div>
    `;
    conectarEventos_();
  }

  function conectarEventos_() {
    // Avanza al siguiente paso (problematización → subtema, subtema → actividad,
    // y mini-resultado → siguiente subtema). Caso especial: al salir del
    // mini-resultado del ÚLTIMO subtema, primero calcula el resultado GLOBAL
    // del PDA (suma de los 4) y envía ese registro final antes de avanzar.
    raiz.querySelector('[data-accion="continuar"]')?.addEventListener('click', async () => {
      const paso = pasos[estado.pasoIndex];
      const esUltimoSubtema = paso.subtemaIndex === pda.subtemas.length - 1;

      if (paso.tipo === 'miniResultado' && esUltimoSubtema) {
        estado.resultado = combinarResultados(estado.resultadosSubtemas);
        estado.pasoIndex++; // avanza al paso 'resultado' (global)
        repintar();

        try {
          const respuestaServidor = await enviarRegistroPDA({
            nombre: sesion.nombre,
            grado: sesion.grado,
            grupo: sesion.grupo,
            pdaId: pda.id,
            pdaNombre: pda.titulo,
            eje: pda.eje,
            tipo: 'pda_completo',
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
        return;
      }

      estado.pasoIndex++;
      repintar();
    });

    // Envía las 5 respuestas de la mini-actividad de un subtema: la califica,
    // guarda su mini-resultado, avanza al panel de "mini-resultado" y registra
    // ese subtema en Sheets en segundo plano (no bloquea la navegación).
    raiz.querySelector('[data-accion="enviar-actividad"]')?.addEventListener('click', () => {
      const paso = pasos[estado.pasoIndex];
      const subtema = pda.subtemas[paso.subtemaIndex];
      const reactivos = reactivosDeActividad_(paso.subtemaIndex);
      const respuestas = reactivos.map((reactivo, i) => leerRespuesta_(raiz, `act-${paso.subtemaIndex}-${i}`, reactivo.tipo));

      if (respuestas.some((r) => r === null)) {
        alert('Responde los 5 reactivos antes de continuar.');
        return;
      }

      const resultado = calcularResultado(
        { reactivos, puntosPorReactivo: subtema.puntosPorReactivo, estrellasMax: subtema.estrellasMax },
        respuestas
      );
      estado.resultadosSubtemas[paso.subtemaIndex] = resultado;
      estado.pasoIndex++; // avanza a 'miniResultado'
      repintar();

      enviarRegistroPDA({
        nombre: sesion.nombre,
        grado: sesion.grado,
        grupo: sesion.grupo,
        pdaId: pda.id,
        pdaNombre: pda.titulo,
        eje: pda.eje,
        tipo: 'subtema',
        subtema: subtema.numero,
        puntaje: resultado.puntaje,
        estrellas: resultado.estrellas
      }).catch(() => {}); // si falla, webhook.js ya lo dejó pendiente en localStorage
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
        puntajeMax: estado.resultado.puntajeMax,
        estrellas: estado.resultado.estrellas,
        estrellasMax: estado.resultado.estrellasMax,
        codigoVerificacion: estado.codigoVerificacion
      });
      raiz.querySelector('[data-accion="ver-constancia"]')?.classList.add('hidden');
      raiz.querySelector('[data-accion-contenedor="descargar-pdf"]')?.classList.remove('hidden');
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
function overline_(texto, iconoNombre, color) {
  return `
    <p class="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide ${color.texto} font-bold mb-2 px-2.5 py-1 rounded-full ${color.chip}">
      ${icono_(iconoNombre, 'w-3.5 h-3.5')} ${texto}
    </p>
  `;
}

function botonPrimario_(texto, dataAccion, color) {
  return `
    <button data-accion="${dataAccion}"
            class="mn-elevar bg-gradient-to-r ${color.grad} text-white font-heading font-bold px-6 py-2.5 rounded-xl shadow-md transition">
      ${texto}
    </button>
  `;
}

function botonSecundario_(texto, dataAccion) {
  return `
    <button data-accion="${dataAccion}"
            class="mn-elevar bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50 font-heading font-bold px-5 py-2.5 rounded-xl transition">
      ${texto}
    </button>
  `;
}

/** Prefijo numerado ("Tema 3" / "3.2") mostrado antes de un título; vacío si no hay número. */
function numeroChip_(numero, etiqueta = 'Tema') {
  if (numero === undefined || numero === null) return '';
  return `<span class="inline-block">${etiqueta ? `${etiqueta} ${numero}.` : `${numero}`}</span> `;
}

function panelProblematizacion_(pda, color) {
  return `
    ${overline_('Problematización', 'foco', color)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${numeroChip_(pda.numero)}${escapeHTML_(pda.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-4">${escapeHTML_(pda.problematizacion.contexto)}</p>
    <p class="text-slate-800 font-semibold mb-6 ${color.suave} border rounded-xl px-4 py-3">${escapeHTML_(pda.problematizacion.pregunta)}</p>
    ${botonPrimario_('Comenzar el tema →', 'continuar', color)}
  `;
}

/** Chip "Nivel N de 4 · <etiqueta>" que marca la dificultad creciente de los
 * 4 subtemas núcleo de un PDA. Si el PDA tiene subtemas de repaso extra
 * después de esos 4 (índice ≥ 4 — ver Paso 13), se muestran como
 * "Repaso N de R" en vez de continuar la escala de dificultad, ya que no
 * introducen contenido nuevo sino que repasan lo ya visto. Si el propio
 * subtema trae `nivelEtiqueta` (Paso 15: "tarjeta dividida" de un solo
 * subtema, donde el índice dentro del arreglo — siempre 0 — no revela su
 * posición real en el PDA de origen), esa etiqueta fija se usa tal cual en
 * vez de calcularla por índice/longitud. */
function nivelChip_(subtema, indice, total) {
  if (subtema && subtema.nivelEtiqueta) return subtema.nivelEtiqueta;
  if (indice < NIVEL_DIFICULTAD.length) {
    return `Nivel ${indice + 1} de ${Math.min(total, NIVEL_DIFICULTAD.length)} · ${NIVEL_DIFICULTAD[indice]}`;
  }
  const totalRepasos = total - NIVEL_DIFICULTAD.length;
  const indiceRepaso = indice - NIVEL_DIFICULTAD.length;
  return `Repaso ${indiceRepaso + 1} de ${totalRepasos}`;
}

function panelSubtema_(subtema, indice, total, color) {
  return `
    ${overline_(nivelChip_(subtema, indice, total), 'libro', color)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${numeroChip_(subtema.numero, '')}${escapeHTML_(subtema.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-3">${escapeHTML_(subtema.explicacion)}</p>
    ${subtema.formula ? `<p class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-mono text-slate-800 mb-3">${escapeHTML_(subtema.formula)}</p>` : ''}
    <div class="space-y-1.5 mb-6">
      ${subtema.ejemplos.map((ejemplo) => `<p class="text-slate-600 text-sm ${color.suave.split(' ')[0]} rounded-lg px-3 py-2"><strong class="${color.texto}">Ejemplo:</strong> ${escapeHTML_(ejemplo)}</p>`).join('')}
    </div>
    ${botonPrimario_('Empezar las 5 preguntas →', 'continuar', color)}
  `;
}

/** Mini-actividad calificada de un subtema: sus 5 reactivos (ya barajados
 * para este intento), calificados de forma independiente al resto del PDA. */
function panelActividad_(subtema, indice, total, reactivos, color) {
  return `
    ${overline_(nivelChip_(subtema, indice, total), 'trofeo', color)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-4">${numeroChip_(subtema.numero, '')}${escapeHTML_(subtema.titulo)}</h3>
    <div class="space-y-6">
      ${reactivos.map((reactivo, i) => `
        <div class="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
          <p class="text-slate-400 text-xs font-bold mb-1">REACTIVO ${i + 1} DE ${reactivos.length}</p>
          ${renderizarPregunta_(reactivo, `act-${indice}-${i}`, color)}
        </div>
      `).join('')}
    </div>
    <div class="mt-6">
      ${botonPrimario_('Enviar respuestas', 'enviar-actividad', color)}
    </div>
  `;
}

/** Mini-resultado de un subtema recién concluido: sus propios puntos y
 * estrellas, independiente de los otros 3 subtemas del PDA. */
function panelMiniResultado_(subtema, resultado, esUltimo, color) {
  const perfecto = resultado.estrellas >= resultado.estrellasMax;
  return `
    ${overline_('¡Actividad concluida!', 'medalla', color)}
    <h3 class="font-heading text-xl sm:text-2xl font-bold text-slate-800 mb-3">${numeroChip_(subtema.numero, '')}${escapeHTML_(subtema.titulo)}</h3>
    <p class="font-heading text-2xl font-bold text-slate-800 mb-2">${resultado.correctas} / ${resultado.total} correctas</p>
    <div class="relative inline-block mb-1">
      ${perfecto ? `<div class="mn-resplandor absolute inset-0 -m-3 rounded-full bg-amber-400/40 blur-xl"></div>` : ''}
      <p class="relative text-amber-600 text-xl">
        ${Array.from({ length: resultado.estrellas }).map((_, i) => `<span class="mn-estrella" ${retraso_(i, 120)}>★</span>`).join('')}${'☆'.repeat(Math.max(0, resultado.estrellasMax - resultado.estrellas))}
      </p>
    </div>
    <p class="text-slate-600 font-semibold mb-6">${resultado.puntaje} de ${resultado.puntajeMax} pts</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
      ${resultado.detalle.map((d) => `
        <div class="text-sm px-4 py-3 rounded-xl border ${d.esCorrecta ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
          <span class="font-bold">${d.esCorrecta ? '✓' : '✗'}</span> ${escapeHTML_(d.resumen)}
          ${d.retroalimentacion ? `<br><span class="text-xs opacity-80">${escapeHTML_(d.retroalimentacion)}</span>` : ''}
        </div>
      `).join('')}
    </div>
    ${botonPrimario_(esUltimo ? 'Ver resultado global →' : 'Siguiente subtema →', 'continuar', color)}
  `;
}

function panelResultado_(pda, estado, color) {
  const r = estado.resultado;
  const perfecto = r.estrellas >= r.estrellasMax;

  return `
    ${overline_('Resultado global del PDA', 'medalla', color)}
    <p class="font-heading text-2xl sm:text-3xl font-bold text-slate-800 mb-2">${r.correctas} / ${r.total} correctas</p>
    <div class="relative inline-block mb-1">
      ${perfecto ? `<div class="mn-resplandor absolute inset-0 -m-3 rounded-full bg-amber-400/40 blur-xl"></div>` : ''}
      <p class="relative text-amber-600 text-2xl">
        ${Array.from({ length: r.estrellas }).map((_, i) => `<span class="mn-estrella" ${retraso_(i, 120)}>★</span>`).join('')}${'☆'.repeat(Math.max(0, r.estrellasMax - r.estrellas))}
      </p>
    </div>
    <p class="text-slate-600 font-semibold mb-4">${r.puntaje} de ${r.puntajeMax} pts</p>
    <p class="text-slate-400 text-xs mb-4">${pda.subtemas.length === 1 ? 'Resultado de este tema (5 preguntas).' : `Suma de los ${pda.subtemas.length} subtemas (5 preguntas cada uno).`}</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
      ${r.detalle.map((d) => `
        <div class="text-sm px-4 py-3 rounded-xl border ${d.esCorrecta ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}">
          <span class="font-bold">${d.esCorrecta ? '✓' : '✗'}</span> ${escapeHTML_(d.resumen)}
          ${d.retroalimentacion ? `<br><span class="text-xs opacity-80">${escapeHTML_(d.retroalimentacion)}</span>` : ''}
        </div>
      `).join('')}
    </div>

    ${!estado.codigoVerificacion ? '<p class="text-slate-400 text-sm">Guardando tu avance…</p>' : `
      ${botonPrimario_('Generar mi constancia', 'ver-constancia', color)}
      <div id="contenedor-constancia" class="mt-6"></div>
      <div data-accion-contenedor="descargar-pdf" class="hidden mt-4">
        <button data-accion="descargar-pdf" class="mn-elevar inline-flex items-center gap-2 bg-gradient-to-r ${color.grad} text-white font-heading font-bold px-6 py-3 rounded-xl transition shadow-lg">
          ${icono_('descarga', 'w-5 h-5')} Descargar constancia en PDF
        </button>
      </div>
    `}
  `;
}

function panelPracticaExtra_(pda, color) {
  return `
    <div class="mn-panel mt-4 bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl p-6 sm:p-7">
      ${overline_('Práctica extra', 'chispas', color)}
      <h3 class="font-heading text-xl font-bold text-slate-800 mb-1">¿Quieres seguir practicando?</h3>
      <p class="text-slate-600 text-sm mb-5">Estos reactivos son opcionales y no cambian tu calificación ni tus estrellas: son solo para reforzar lo que aprendiste.</p>
      <div class="space-y-5">
        ${pda.practicaExtra.map((pregunta, i) => `
          <div class="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
            <p class="text-slate-400 text-xs font-bold mb-2">PRÁCTICA ${i + 1} DE ${pda.practicaExtra.length}</p>
            ${renderizarPregunta_(pregunta, `practica-${i}`, color)}
            <div data-practica-feedback="${i}" class="mt-3 hidden"></div>
            <button data-accion="verificar-practica" data-indice="${i}"
                    class="mt-4 mn-elevar bg-white border-2 border-teal-500 text-teal-700 hover:bg-teal-50 font-heading font-bold px-5 py-2 rounded-xl transition">
              Verificar
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/** Explosión de "confeti" decorativa (solo CSS, sin imágenes externas ni
 * dependencias): una fila de piezas de colores que caen con distinto
 * retraso y posición horizontal, en bucle. Posiciones/retrasos son
 * pseudo-aleatorios pero deterministas (mismo resultado en cada render). */
function confeti_(cantidad = 16) {
  return Array.from({ length: cantidad }).map((_, i) => {
    const color = CONFETI_COLORES[i % CONFETI_COLORES.length];
    const izquierda = (i * 61.8) % 96; // distribución dispersa (proporción áurea) en 0-96%
    const retraso = (i * 110) % 1800;
    const redondo = i % 2 === 0;
    return `<span class="mn-confeti" style="left:${izquierda}%; background:${color}; animation-delay:${retraso}ms; ${redondo ? 'border-radius:50%;' : ''}"></span>`;
  }).join('');
}

/** Pantalla de celebración estilo "nivel superado" de videojuego: cierra la
 * experiencia de un PDA/tema completo (después de la constancia y, si el
 * PDA la tiene, de la práctica extra) con una nota festiva. Puramente
 * decorativa — no repite el detalle del puntaje, que ya se mostró en el
 * resultado global; solo confirma el cierre e invita a elegir otro tema. */
function panelCelebracion_(pda, resultado, grado, color) {
  const perfecto = resultado.estrellas >= resultado.estrellasMax;
  return `
    <div class="relative overflow-hidden mn-panel mt-4 bg-gradient-to-br ${color.grad} rounded-3xl p-8 sm:p-10 text-center shadow-xl">
      <div class="absolute inset-0 overflow-hidden pointer-events-none">${confeti_()}</div>
      <div class="relative">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-3">
          ${icono_('trofeo', 'w-11 h-11 text-white mn-trofeo')}
        </div>
        <p class="font-heading text-2xl sm:text-3xl font-extrabold text-white mb-1">${perfecto ? '¡Puntaje perfecto!' : '¡Nivel superado!'}</p>
        <p class="text-white/90 font-medium mb-6">Completaste «${escapeHTML_(pda.titulo)}» con ${resultado.puntaje} de ${resultado.puntajeMax} pts.</p>
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="mn-elevar inline-flex items-center gap-2 bg-white/95 hover:bg-white text-slate-800 font-heading font-bold px-6 py-3 rounded-xl transition shadow-lg">
          Elegir otro tema ${icono_('flecha', 'w-4 h-4')}
        </a>
      </div>
    </div>
  `;
}

// ============================================================
// Renderizador genérico de preguntas (4 tipos) + lectura del DOM
// ============================================================

/** Devuelve el HTML de una pregunta según su tipo, con el acento de color de
 * su fase. `prefijo` identifica sus inputs en el DOM. `valorPrevio` (opcional)
 * pre-llena la respuesta si el alumno ya la había capturado antes (por
 * ejemplo, al regresar a una página anterior del reto). */
function renderizarPregunta_(pregunta, prefijo, color, valorPrevio) {
  const c = color || PASO_COLOR.check;
  switch (pregunta.tipo) {
    case 'opcion_multiple':
      return `
        <p class="text-slate-800 font-medium mb-2">${escapeHTML_(pregunta.pregunta)}</p>
        <div class="space-y-1.5">
          ${pregunta.opciones.map((opcion, j) => `
            <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-2 py-1.5 ${c.hover} transition">
              <input type="radio" name="preg-${prefijo}" value="${j}" data-preg="${prefijo}" class="${c.accent} w-4 h-4" ${Number(valorPrevio) === j ? 'checked' : ''}>
              ${escapeHTML_(opcion)}
            </label>
          `).join('')}
        </div>
      `;

    case 'verdadero_falso':
      return `
        <p class="text-slate-800 font-medium mb-2">${escapeHTML_(pregunta.enunciado)}</p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-3 py-1.5 ${c.hover} transition">
            <input type="radio" name="preg-${prefijo}" value="true" data-preg="${prefijo}" class="${c.accent} w-4 h-4" ${valorPrevio === true ? 'checked' : ''}> Verdadero
          </label>
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer rounded-lg px-3 py-1.5 ${c.hover} transition">
            <input type="radio" name="preg-${prefijo}" value="false" data-preg="${prefijo}" class="${c.accent} w-4 h-4" ${valorPrevio === false ? 'checked' : ''}> Falso
          </label>
        </div>
      `;

    case 'llenar_frase': {
      const [antes, despues] = pregunta.frase.split('___');
      const valor = valorPrevio != null ? escapeHTML_(String(valorPrevio)) : '';
      return `
        <p class="text-slate-800 font-medium mb-2">
          ${escapeHTML_(antes || '')}<input type="text" data-preg="${prefijo}" value="${valor}"
            class="inline-block border-b-2 ${c.inputBorder} focus:outline-none ${c.inputFocus} px-1 mx-1 w-24 text-center rounded-t">${escapeHTML_(despues || '')}
        </p>
      `;
    }

    case 'relacionar_columnas':
      return `
        <p class="text-slate-800 font-medium mb-3">${escapeHTML_(pregunta.instruccion || 'Relaciona cada elemento con su pareja correcta.')}</p>
        <div class="space-y-2">
          ${pregunta.columnaA.map((item, idx) => `
            <div class="flex items-center gap-3">
              <span class="text-slate-700 flex-1">${escapeHTML_(item)}</span>
              <select data-preg="${prefijo}" class="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 ${c.ring}">
                <option value="">Selecciona…</option>
                ${pregunta.columnaB.map((opcion, j) => `<option value="${j}" ${Array.isArray(valorPrevio) && valorPrevio[idx] === j ? 'selected' : ''}>${escapeHTML_(opcion)}</option>`).join('')}
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

/** Indicador de avance "en serpiente": una fila de puntos que ondulan
 * suavemente arriba/abajo (eco compacto del camino de PDAs) mientras se
 * baja de actividad en actividad dentro de un PDA — completados llenos,
 * el actual más grande y resaltado, los que faltan solo con contorno. */
function caminoPasos_(pasoIndex, totalPasos, tema) {
  const puntos = Array.from({ length: totalPasos }, (_, i) => {
    const completado = i < pasoIndex;
    const actual = i === pasoIndex;
    const offset = i % 4 === 1 ? -5 : i % 4 === 3 ? 5 : 0;
    const clase = actual
      ? `w-4 h-4 border-2 border-white shadow-md bg-gradient-to-br ${tema.grad}`
      : completado
        ? `w-2.5 h-2.5 bg-gradient-to-br ${tema.grad} opacity-45`
        : `w-2.5 h-2.5 bg-white border-2 border-slate-300`;
    return `<span class="rounded-full shrink-0 transition-all duration-300 ${clase}" style="transform:translateY(${offset}px)"></span>`;
  }).join('');

  return `
    <div class="mt-3">
      <div class="flex justify-between text-xs text-slate-500 mb-1.5 font-medium">
        <span>Tu camino</span><span>Paso ${pasoIndex + 1} de ${totalPasos}</span>
      </div>
      <div class="flex items-center gap-2 flex-wrap">${puntos}</div>
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
