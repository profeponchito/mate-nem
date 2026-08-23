/**
 * MATE-NEM · Motor de gamificación
 * ----------------------------------------------------
 * Calcula puntaje, estrellas y retroalimentación del "reto" final de un PDA,
 * y evalúa preguntas individuales (usado también por los checks formativos
 * entre subtemas). Soporta 4 tipos de reactivo:
 *   - opcion_multiple    : respuesta = índice de la opción elegida
 *   - verdadero_falso    : respuesta = boolean
 *   - llenar_frase       : respuesta = string (se compara sin mayúsculas/acentos)
 *   - relacionar_columnas: respuesta = array de índices (uno por fila de columnaA)
 */

/**
 * @param {Object} pda - el PDA completo (usa pda.reto)
 * @param {Array} respuestas - una respuesta por reactivo de pda.reto.reactivos, mismo orden
 * @returns {{correctas:number, total:number, porcentaje:number, puntaje:number, puntajeMax:number, estrellas:number, detalle:Array}}
 */
export function calcularResultado(pda, respuestas) {
  const { reactivos, puntosPorReactivo, estrellasMax = 3 } = pda.reto;

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

  return { correctas, total, porcentaje, puntaje, puntajeMax, estrellas, detalle };
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

    default:
      return false;
  }
}

function resumenPregunta_(reactivo) {
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
