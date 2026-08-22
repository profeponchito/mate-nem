/**
 * MATE-NEM · Bootstrap de la aplicación
 * ----------------------------------------------------
 * Define las vistas de la SPA y las conecta con el router. Cada vista es
 * una función que recibe los parámetros de la ruta y devuelve HTML (string)
 * o un HTMLElement ya armado (cuando necesita mantener estado interno,
 * como la vista de un PDA con sus fases).
 */

import { ruta, rutaPorDefecto, navegar, init } from './router.js';
import { guardarSesion, obtenerSesion, haySesion } from './session.js';
import { cargarListaPDAs, cargarPDAporId } from './pda-loader.js';
import { calcularResultado, esRespuestaCorrecta } from './gamification.js';
import { enviarRegistroPDA, reintentarPendientes } from './webhook.js';
import { generarConstancia, descargarComoPDF } from './constancia.js';

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
    <div class="max-w-md mx-auto px-4 py-10">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-800">MATE-NEM</h1>
        <p class="text-slate-500 mt-1">Matemáticas · Nueva Escuela Mexicana</p>
      </div>
      <form id="form-registro" class="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Nombre completo</label>
          <input name="nombre" type="text" required autocomplete="name"
                 class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                 placeholder="Ej. María López Hernández">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Grado</label>
          <select name="grado" required
                  class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none">
            <option value="" disabled selected>Selecciona tu grado</option>
            <option value="1°">1° de secundaria</option>
            <option value="2°">2° de secundaria</option>
            <option value="3°">3° de secundaria</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">Grupo</label>
          <input name="grupo" type="text" required
                 class="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                 placeholder="Ej. A">
        </div>
        <button type="submit"
                class="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-lg transition">
          Comenzar
        </button>
      </form>
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
      <h2 class="text-xl font-semibold text-slate-800 mb-1">Hola, ${escapeHTML_(sesion.nombre.split(' ')[0])} 👋</h2>
      <p class="text-slate-500 mb-6">Elige tu grado para ver los PDAs disponibles.</p>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${grados.map((grado) => `
          <a href="#/pda-lista/${encodeURIComponent(grado)}"
             class="block bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition">
            <span class="text-3xl font-bold text-amber-600">${grado}</span>
            <p class="text-slate-500 mt-1">Secundaria</p>
          </a>
        `).join('')}
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
      <a href="#/grados" class="text-sm text-amber-700 hover:underline">← Cambiar de grado</a>
      <h2 class="text-xl font-semibold text-slate-800 mt-2 mb-6">PDAs de ${escapeHTML_(grado)} de secundaria</h2>
      ${error ? `<p class="text-red-600">No se pudieron cargar los PDAs: ${escapeHTML_(error)}</p>` : ''}
      ${(!error && pdas.length === 0) ? `<p class="text-slate-500">Todavía no hay PDAs cargados para este grado. Vuelve pronto.</p>` : ''}
      <div class="space-y-3">
        ${pdas.map((pda) => `
          <a href="#/pda/${encodeURIComponent(grado)}/${encodeURIComponent(pda.id)}"
             class="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
            <p class="text-xs uppercase tracking-wide text-amber-600 font-medium">${escapeHTML_(pda.eje)}</p>
            <p class="text-slate-800 font-semibold">${escapeHTML_(pda.titulo)}</p>
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

  let pda;
  try {
    pda = await cargarPDAporId(grado, id);
  } catch (e) {
    const contenedorError = document.createElement('div');
    contenedorError.innerHTML = `
      ${encabezado_(sesion)}
      <div class="max-w-2xl mx-auto px-4 py-8">
        <p class="text-red-600">No se pudo cargar el PDA: ${escapeHTML_(e.message)}</p>
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="text-amber-700 hover:underline">← Volver</a>
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
    raiz.innerHTML = `
      ${encabezado_(sesion)}
      <div class="max-w-2xl mx-auto px-4 py-8">
        <a href="#/pda-lista/${encodeURIComponent(grado)}" class="text-sm text-amber-700 hover:underline">← ${escapeHTML_(grado)} secundaria</a>
        ${barraAvance_(estado.pasoIndex, pasos.length)}
        <div class="bg-white rounded-2xl shadow-md p-6 mt-4">
          ${paso.tipo === 'problematizacion' ? panelProblematizacion_(pda) : ''}
          ${paso.tipo === 'subtema' ? panelSubtema_(pda.subtemas[paso.subtemaIndex], paso.subtemaIndex, pda.subtemas.length) : ''}
          ${paso.tipo === 'check' ? panelCheck_(pda.subtemas[paso.subtemaIndex], `check-${paso.subtemaIndex}`) : ''}
          ${paso.tipo === 'reto' ? panelReto_(pda) : ''}
          ${paso.tipo === 'resultado' ? panelResultado_(pda, estado) : ''}
        </div>
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
        <div class="text-sm px-3 py-2 rounded-lg ${correcta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
          ${correcta ? '✓ ¡Correcto!' : '✗ No es correcto.'} ${escapeHTML_(pregunta.retroalimentacion)}
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
        codigoVerificacion: estado.codigoVerificacion
      });
      raiz.querySelector('[data-accion="ver-constancia"]')?.classList.add('hidden');
      raiz.querySelector('[data-accion="descargar-pdf"]')?.classList.remove('hidden');
    });

    raiz.querySelector('[data-accion="descargar-pdf"]')?.addEventListener('click', () => {
      descargarComoPDF('constancia', `constancia-${sesion.nombre.replace(/\s+/g, '_')}.pdf`);
    });
  }

  repintar();
  return raiz;
}

// ============================================================
// Paneles de cada paso (usados por vistaPDA)
// ============================================================
function panelProblematizacion_(pda) {
  return `
    <p class="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">Problematización</p>
    <h3 class="text-lg font-semibold text-slate-800 mb-3">${escapeHTML_(pda.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-4">${escapeHTML_(pda.problematizacion.contexto)}</p>
    <p class="text-slate-800 font-medium mb-6">${escapeHTML_(pda.problematizacion.pregunta)}</p>
    <button data-accion="continuar" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition">
      Comenzar el tema →
    </button>
  `;
}

function panelSubtema_(subtema, indice, total) {
  return `
    <p class="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">Tema · Parte ${indice + 1} de ${total}</p>
    <h3 class="text-lg font-semibold text-slate-800 mb-3">${escapeHTML_(subtema.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-3">${escapeHTML_(subtema.explicacion)}</p>
    ${subtema.formula ? `<p class="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-mono text-slate-800 mb-3">${escapeHTML_(subtema.formula)}</p>` : ''}
    <div class="space-y-1 mb-6">
      ${subtema.ejemplos.map((ejemplo) => `<p class="text-slate-600 text-sm"><strong>Ejemplo:</strong> ${escapeHTML_(ejemplo)}</p>`).join('')}
    </div>
    <button data-accion="continuar" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition">
      Continuar →
    </button>
  `;
}

function panelCheck_(subtema, prefijo) {
  const pregunta = subtema.check;
  return `
    <p class="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">Repaso rápido</p>
    <h3 class="text-lg font-semibold text-slate-800 mb-3">${escapeHTML_(subtema.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-3">${escapeHTML_(subtema.explicacion)}</p>
    ${subtema.formula ? `<p class="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-mono text-slate-800 mb-4">${escapeHTML_(subtema.formula)}</p>` : ''}
    <div class="border-t border-slate-100 pt-4">
      ${renderizarPregunta_(pregunta, prefijo)}
    </div>
    <div data-check-feedback class="mt-3 hidden"></div>
    <div class="mt-4 flex gap-2">
      <button data-accion="verificar-check" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition">
        Verificar
      </button>
      <button data-accion="continuar" class="hidden bg-slate-700 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-lg transition">
        Continuar →
      </button>
    </div>
  `;
}

function panelReto_(pda) {
  const reto = pda.reto;
  return `
    <p class="text-xs uppercase tracking-wide text-amber-600 font-medium mb-1">Reto</p>
    <h3 class="text-lg font-semibold text-slate-800 mb-3">${escapeHTML_(pda.titulo)}</h3>
    <p class="text-slate-700 leading-relaxed mb-4">${escapeHTML_(reto.sintesis)}</p>
    <div class="space-y-6">
      ${reto.reactivos.map((reactivo, i) => `
        <div class="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
          <p class="text-slate-400 text-xs mb-1">Reactivo ${i + 1}</p>
          ${renderizarPregunta_(reactivo, `reto-${i}`)}
        </div>
      `).join('')}
    </div>
    <button data-accion="enviar-reto" class="mt-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition">
      Enviar respuestas
    </button>
  `;
}

function panelResultado_(pda, estado) {
  const r = estado.resultado;
  const estrellasMax = pda.reto.estrellasMax || 3;

  return `
    <p class="text-xs uppercase tracking-wide text-amber-600 font-medium mb-2">Resultado</p>
    <p class="text-2xl font-bold text-slate-800 mb-1">${r.correctas} / ${r.total} correctas</p>
    <p class="text-amber-600 text-xl mb-4">${'★'.repeat(r.estrellas)}${'☆'.repeat(Math.max(0, estrellasMax - r.estrellas))} · ${r.puntaje} pts</p>

    <div class="space-y-2 mb-6">
      ${r.detalle.map((d) => `
        <div class="text-sm px-3 py-2 rounded-lg ${d.esCorrecta ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}">
          ${d.esCorrecta ? '✓' : '✗'} ${escapeHTML_(d.resumen)}
          ${d.retroalimentacion ? `<br><span class="text-xs opacity-80">${escapeHTML_(d.retroalimentacion)}</span>` : ''}
        </div>
      `).join('')}
    </div>

    ${!estado.codigoVerificacion ? '<p class="text-slate-400 text-sm">Guardando tu avance…</p>' : `
      <button data-accion="ver-constancia" class="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-5 py-2 rounded-lg transition">
        Generar mi constancia
      </button>
      <button data-accion="descargar-pdf" class="hidden bg-slate-700 hover:bg-slate-800 text-white font-semibold px-5 py-2 rounded-lg transition ml-2">
        Descargar PDF
      </button>
      <div id="contenedor-constancia" class="mt-6"></div>
    `}
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
        <div class="space-y-1">
          ${pregunta.opciones.map((opcion, j) => `
            <label class="flex items-center gap-2 text-slate-700 cursor-pointer">
              <input type="radio" name="preg-${prefijo}" value="${j}" data-preg="${prefijo}" class="accent-amber-600">
              ${escapeHTML_(opcion)}
            </label>
          `).join('')}
        </div>
      `;

    case 'verdadero_falso':
      return `
        <p class="text-slate-800 font-medium mb-2">${escapeHTML_(pregunta.enunciado)}</p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input type="radio" name="preg-${prefijo}" value="true" data-preg="${prefijo}" class="accent-amber-600"> Verdadero
          </label>
          <label class="flex items-center gap-2 text-slate-700 cursor-pointer">
            <input type="radio" name="preg-${prefijo}" value="false" data-preg="${prefijo}" class="accent-amber-600"> Falso
          </label>
        </div>
      `;

    case 'llenar_frase': {
      const [antes, despues] = pregunta.frase.split('___');
      return `
        <p class="text-slate-800 font-medium mb-2">
          ${escapeHTML_(antes || '')}<input type="text" data-preg="${prefijo}"
            class="inline-block border-b-2 border-amber-500 focus:outline-none px-1 mx-1 w-24 text-center">${escapeHTML_(despues || '')}
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
              <select data-preg="${prefijo}" class="border border-slate-300 rounded-lg px-2 py-1 text-sm bg-white">
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

function barraAvance_(pasoIndex, totalPasos) {
  const porcentaje = Math.round((pasoIndex / (totalPasos - 1)) * 100);
  return `
    <div class="mt-3">
      <div class="flex justify-between text-xs text-slate-500 mb-1">
        <span>Avance</span><span>${porcentaje}%</span>
      </div>
      <div class="w-full bg-slate-200 rounded-full h-2">
        <div class="bg-amber-600 h-2 rounded-full transition-all" style="width:${porcentaje}%"></div>
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
      <a href="#/" class="text-amber-700 hover:underline">Volver al inicio</a>
    </div>
  `;
}

// ============================================================
// Utilidades compartidas
// ============================================================
function encabezado_(sesion) {
  return `
    <header class="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between no-imprimir">
      <a href="#/grados" class="font-bold text-slate-800">MATE-NEM</a>
      <div class="text-sm text-slate-500 flex items-center gap-3">
        <span>${escapeHTML_(sesion.nombre)} · ${escapeHTML_(sesion.grado)} ${escapeHTML_(sesion.grupo)}</span>
        <button onclick="localStorage.removeItem('mateNemSesion'); location.hash='#/'; location.reload();"
                class="text-amber-700 hover:underline">Salir</button>
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
