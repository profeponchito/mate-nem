/**
 * MATE-NEM · Motor de gamificación
 * ----------------------------------------------------
 * Calcula puntaje, estrellas y retroalimentación a partir de las
 * respuestas del alumno a los reactivos de la fase "actividad" de un PDA.
 */

/**
 * @param {Object} pda - el PDA completo (usa pda.actividad)
 * @param {number[]} respuestas - índice de opción elegida por reactivo, mismo orden que pda.actividad.reactivos
 * @returns {{correctas:number, total:number, porcentaje:number, puntaje:number, estrellas:number, detalle:Array}}
 */
export function calcularResultado(pda, respuestas) {
  const { reactivos, puntosPorReactivo, estrellasMax = 3 } = pda.actividad;

  const detalle = reactivos.map((reactivo, i) => ({
    pregunta: reactivo.pregunta,
    esCorrecta: respuestas[i] === reactivo.respuestaCorrecta,
    retroalimentacion: reactivo.retroalimentacion || ''
  }));

  const correctas = detalle.filter((d) => d.esCorrecta).length;
  const total = reactivos.length;
  const porcentaje = total > 0 ? correctas / total : 0;
  const puntaje = correctas * puntosPorReactivo;
  const estrellas = calcularEstrellas_(porcentaje, estrellasMax);

  return { correctas, total, porcentaje, puntaje, estrellas, detalle };
}

function calcularEstrellas_(porcentaje, estrellasMax) {
  if (porcentaje >= 1) return estrellasMax;
  if (porcentaje >= 0.7) return Math.max(1, estrellasMax - 1);
  if (porcentaje >= 0.4) return Math.max(1, estrellasMax - 2);
  return 0;
}
