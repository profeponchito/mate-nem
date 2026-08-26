/**
 * MATE-NEM · Motor de gamificación
 * ----------------------------------------------------
 * Calcula puntaje, estrellas y retroalimentación de una mini-actividad
 * calificada (los 5 reactivos de un subtema, o cualquier lote de
 * reactivos), y evalúa preguntas individuales. Soporta 5 tipos de reactivo:
 *   - opcion_multiple    : respuesta = índice de la opción elegida
 *   - verdadero_falso    : respuesta = boolean
 *   - llenar_frase       : respuesta = string (se compara sin mayúsculas/acentos)
 *   - relacionar_columnas: respuesta = array de índices (uno por fila de columnaA)
 *   - algoritmo_columnas : respuesta = array paralelo a `filas`, cada elemento
 *     un array disperso indexado por columna con el dígito que escribió el
 *     alumno en cada casilla oculta de esa fila (Paso 18)
 *
 * Cada PDA tiene 4 subtemas, cada uno con su propia mini-actividad
 * calificada (5 reactivos, resultado independiente). `calcularResultado()`
 * se usa una vez por subtema; `combinarResultados()` suma esos 4
 * mini-resultados en el resultado GLOBAL del PDA (mostrado al terminar el
 * subtema 4, y el que dispara constancia/webhook de PDA completo).
 */

/**
 * @param {Object} actividad - objeto con {reactivos, puntosPorReactivo, estrellasMax} —
 *   normalmente un subtema (mini-actividad de 5 reactivos), pero sirve para cualquier lote.
 * @param {Array} respuestas - una respuesta por reactivo de actividad.reactivos, mismo orden
 * @returns {{correctas:number, total:number, porcentaje:number, puntaje:number, puntajeMax:number, estrellas:number, estrellasMax:number, detalle:Array}}
 */
export function calcularResultado(actividad, respuestas) {
  const { reactivos, puntosPorReactivo, estrellasMax = 3 } = actividad;

  const detalle = reactivos.map((reactivo, i) => ({
    resumen: resumenPregunta_(reactivo),
    esCorrecta: esRespuestaCorrecta(reactivo, respuestas[i]),
    retroalimentacion: reactivo.retroalimentacion || ''
  }));

  const correctas = detalle.filter((d) => d.esCorrecta).length;
  const total = reactivos.length;
  const porcentaje = total > 0 ? correctas / total : 0;
  const puntaje = correctas * puntosPorReactivo;
  // Puntaje máximo posible (todas las respuestas correctas), para mostrar
  // "puntaje obtenido de puntaje total" (ej. "170 de 200") junto al resultado.
  const puntajeMax = total * puntosPorReactivo;
  const estrellas = calcularEstrellas_(porcentaje, estrellasMax);

  return { correctas, total, porcentaje, puntaje, puntajeMax, estrellas, estrellasMax, detalle };
}

/**
 * Suma los 4 mini-resultados (uno por subtema) en el resultado GLOBAL del
 * PDA: correctas/total/puntaje/puntajeMax/estrellas/estrellasMax se suman,
 * y `detalle` concatena los 20 reactivos en orden de subtema. Es una suma
 * directa de resultados ya calculados — no vuelve a calificar nada.
 * @param {Array} resultados - resultados de `calcularResultado()`, uno por subtema (en orden).
 */
export function combinarResultados(resultados) {
  return resultados.reduce((acc, r) => ({
    correctas: acc.correctas + r.correctas,
    total: acc.total + r.total,
    porcentaje: (acc.total + r.total) > 0 ? (acc.correctas + r.correctas) / (acc.total + r.total) : 0,
    puntaje: acc.puntaje + r.puntaje,
    puntajeMax: acc.puntajeMax + r.puntajeMax,
    estrellas: acc.estrellas + r.estrellas,
    estrellasMax: acc.estrellasMax + r.estrellasMax,
    detalle: acc.detalle.concat(r.detalle)
  }), { correctas: 0, total: 0, porcentaje: 0, puntaje: 0, puntajeMax: 0, estrellas: 0, estrellasMax: 0, detalle: [] });
}

/** Evalúa una sola pregunta (de cualquier tipo) contra la respuesta capturada del DOM. */
export function esRespuestaCorrecta(reactivo, respuesta) {
  if (respuesta === null || respuesta === undefined) return false;

  switch (reactivo.tipo) {
    case 'opcion_multiple':
      return Number(respuesta) === reactivo.respuestaCorrecta;

    case 'verdadero_falso':
      return Boolean(respuesta) === Boolean(reactivo.respuestaCorrecta);

    case 'llenar_frase':
      return normalizarTexto_(respuesta) === normalizarTexto_(reactivo.respuestaCorrecta);

    case 'relacionar_columnas':
      if (!Array.isArray(respuesta) || respuesta.length !== reactivo.parejasCorrectas.length) return false;
      return respuesta.every((valor, i) => Number(valor) === reactivo.parejasCorrectas[i]);

    case 'algoritmo_columnas':
      if (!Array.isArray(respuesta)) return false;
      return reactivo.filas.every((fila, fi) => {
        const ocultosFila = (reactivo.ocultos && reactivo.ocultos[fi]) || [];
        if (ocultosFila.length === 0) return true;
        const filaRespuesta = respuesta[fi];
        if (!Array.isArray(filaRespuesta)) return false;
        return ocultosFila.every((ci) => String(filaRespuesta[ci]) === fila.valor[ci]);
      });

    default:
      return false;
  }
}

function resumenPregunta_(reactivo) {
  if (reactivo.tipo === 'algoritmo_columnas') {
    const resultado = (reactivo.filas || []).find((f) => f.esResultado);
    return `Algoritmo vertical (${reactivo.operacion || 'suma'})${resultado ? ` — resultado ${resultado.valor}` : ''}`;
  }
  return reactivo.pregunta || reactivo.enunciado || reactivo.frase || reactivo.instruccion || '';
}

function normalizarTexto_(texto = '') {
  return String(texto)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // quita acentos para comparar "area" con "área"
}

function calcularEstrellas_(porcentaje, estrellasMax) {
  if (porcentaje >= 1) return estrellasMax;
  if (porcentaje >= 0.7) return Math.max(1, estrellasMax - 1);
  if (porcentaje >= 0.4) return Math.max(1, estrellasMax - 2);
  return 0;
}
