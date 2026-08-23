import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'fs';

const BASE = 'http://localhost:8123';
const gradoDir = { '1°': 'grado-1', '2°': 'grado-2', '3°': 'grado-3' };
const resultados = [];

function respuestaCorrecta(p) {
  switch (p.tipo) {
    case 'opcion_multiple': return { tipo: p.tipo, valor: p.respuestaCorrecta };
    case 'verdadero_falso': return { tipo: p.tipo, valor: p.respuestaCorrecta };
    case 'llenar_frase': return { tipo: p.tipo, valor: p.respuestaCorrecta };
    case 'relacionar_columnas': return { tipo: p.tipo, valor: p.parejasCorrectas };
    default: throw new Error('tipo desconocido ' + p.tipo);
  }
}

/** El motor de variación (variarReactivos_ en app.js) mezcla el ORDEN de las
 * opciones de cada opcion_multiple para cada intento, así que el índice
 * "respuestaCorrecta" del JSON fuente ya no coincide con el atributo
 * value="N" mostrado en el DOM. Se localiza la opción correcta por su TEXTO
 * (invariante al orden) en vez de por índice. */
async function elegirOpcionPorTexto(page, prefijo, textoCorrecto) {
  const normalizado = textoCorrecto.trim().replace(/\s+/g, ' ');
  const valor = await page.evaluate(({ prefijo, normalizado }) => {
    const inputs = Array.from(document.querySelectorAll(`input[data-preg="${prefijo}"]`));
    for (const input of inputs) {
      const label = input.closest('label');
      const texto = label ? label.textContent.trim().replace(/\s+/g, ' ') : '';
      if (texto === normalizado) return input.value;
    }
    return null;
  }, { prefijo, normalizado });
  if (valor === null) {
    throw new Error(`no se encontró la opción "${textoCorrecto}" entre las opciones barajadas de ${prefijo}`);
  }
  await page.click(`input[type="radio"][data-preg="${prefijo}"][value="${valor}"]`);
}

async function responder(page, prefijo, pregunta) {
  const r = respuestaCorrecta(pregunta);
  if (r.tipo === 'opcion_multiple') {
    await elegirOpcionPorTexto(page, prefijo, pregunta.opciones[r.valor]);
  } else if (r.tipo === 'verdadero_falso') {
    await page.click(`input[type="radio"][data-preg="${prefijo}"][value="${r.valor}"]`);
  } else if (r.tipo === 'llenar_frase') {
    await page.fill(`input[data-preg="${prefijo}"]`, String(r.valor));
  } else if (r.tipo === 'relacionar_columnas') {
    const selects = await page.locator(`select[data-preg="${prefijo}"]`).all();
    for (let j = 0; j < selects.length; j++) {
      await selects[j].selectOption({ label: pregunta.columnaB[r.valor[j]] });
    }
  }
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const [grado, dir] of Object.entries(gradoDir)) {
    const archivos = readdirSync(`data/${dir}`).filter((f) => f.endsWith('.json') && f !== 'index.json');
    for (const archivo of archivos) {
      const pda = JSON.parse(readFileSync(`data/${dir}/${archivo}`, 'utf8'));
      const page = await browser.newPage();
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const t = msg.text();
          if (/404|ERR_TUNNEL_CONNECTION_FAILED|Failed to fetch|net::ERR/i.test(t)) return;
          consoleErrors.push(t);
        }
      });
      page.on('pageerror', (err) => {
        // En este entorno de pruebas no hay internet real: los CDN de Tailwind,
        // Google Fonts, qrcode.js y html2pdf.js no cargan (ERR_TUNNEL_CONNECTION_FAILED),
        // lo que deja "tailwind"/"QRCode"/"html2pdf" indefinidos. Es una limitación
        // del sandbox de pruebas, no un bug de la app (en GitHub Pages sí hay internet).
        if (/tailwind is not defined|QRCode is not defined|html2pdf is not defined/i.test(err.message)) return;
        consoleErrors.push('[pageerror] ' + err.message);
      });

      try {
        await page.goto(`${BASE}/#/`, { waitUntil: 'load' });
        await page.fill('input[name="nombre"]', 'QA Sweep');
        await page.selectOption('select[name="grado"]', { label: `${grado} de secundaria` });
        await page.fill('input[name="grupo"]', 'X');
        await page.click('button[type="submit"]');
        await page.waitForURL('**/#/grados');

        // La tarjeta "Ejercítate" debe estar visible en la pantalla de selección
        // de grado (sin importar el grado elegido) y su enlace debe apuntar a
        // una ruta registrada (no 404). Se verifica una sola vez, en el primer PDA.
        if (resultados.length === 0) {
          const bodyGrados = await page.innerText('body');
          if (!bodyGrados.includes('Ejercítate')) {
            throw new Error('la pantalla de selección de grado no muestra la tarjeta "Ejercítate"');
          }
          await page.click('a[href="#/ejercitate"]');
          await page.waitForURL('**/#/ejercitate');
          const bodyEjercitate = await page.innerText('body');
          if (!bodyEjercitate.includes('operaciones básicas') && !bodyEjercitate.includes('Ejercítate')) {
            throw new Error('la ruta /ejercitate no renderizó el contenido esperado (posible 404)');
          }
          if (bodyEjercitate.includes('No encontramos esa página')) {
            throw new Error('la ruta /ejercitate cayó en el 404 (falta registrar la ruta)');
          }
          await page.goto(`${BASE}/#/grados`, { waitUntil: 'load' });
        }

        await page.goto(`${BASE}/#/pda/${encodeURIComponent(grado)}/${encodeURIComponent(pda.id)}`, { waitUntil: 'load' });
        await page.waitForTimeout(200);

        if (pda.subtemas.length !== 4) {
          throw new Error(`se esperaban 4 subtemas, hay ${pda.subtemas.length}`);
        }
        const totalReactivos = pda.subtemas.reduce((acc, s) => acc + s.reactivos.length, 0);
        if (totalReactivos !== 20) {
          throw new Error(`se esperaban 20 reactivos en total (4×5), hay ${totalReactivos}`);
        }

        // problematización: debe verse el título (pda.titulo)
        let bodyText = await page.innerText('body');
        if (!bodyText.includes(pda.titulo)) throw new Error('problematización no muestra el título del PDA');
        await page.click('[data-accion="continuar"]');
        await page.waitForTimeout(100);

        const nivelesEsperados = ['Introductorio', 'Intermedio', 'Avanzado', 'Síntesis'];

        for (let si = 0; si < pda.subtemas.length; si++) {
          const subtema = pda.subtemas[si];
          if (subtema.reactivos.length !== 5) {
            throw new Error(`subtema[${si}] debe tener exactamente 5 reactivos, tiene ${subtema.reactivos.length}`);
          }

          // Panel de teoría del subtema: título, explicación y nivel de dificultad correcto.
          bodyText = await page.innerText('body');
          if (!bodyText.includes(subtema.titulo)) throw new Error(`subtema[${si}] no muestra su título`);
          if (!bodyText.includes(subtema.explicacion)) throw new Error(`subtema[${si}] no muestra su explicación teórica`);
          if (!bodyText.includes(`Nivel ${si + 1} de 4`) || !bodyText.includes(nivelesEsperados[si])) {
            throw new Error(`subtema[${si}] no muestra el nivel de dificultad esperado "Nivel ${si + 1} de 4 · ${nivelesEsperados[si]}"`);
          }
          await page.click('[data-accion="continuar"]');
          await page.waitForTimeout(100);

          // Panel de actividad: exactamente 5 reactivos, prefijo act-{si}-{i}.
          bodyText = await page.innerText('body');
          if (!bodyText.includes(subtema.titulo)) throw new Error(`actividad[${si}] no muestra el título del subtema`);
          if (!bodyText.includes(`DE 5`)) throw new Error(`actividad[${si}] no muestra el conteo "REACTIVO N DE 5"`);

          // No se puede saber de antemano el orden barajado de los reactivos —
          // se identifica cada bloque (contenedor "REACTIVO N DE 5") por su
          // posición renderizada, comparando el texto EXACTO de su enunciado
          // (el primer <p>, sin las opciones/labels) contra los 5 reactivos
          // originales del subtema, para saber a cuál corresponde cada uno.
          const bloques = page.locator('div.border-t.border-slate-100');
          await bloques.first().waitFor({ state: 'attached' });
          const totalBloques = await bloques.count();
          if (totalBloques !== 5) {
            throw new Error(`actividad[${si}] esperaba 5 bloques de reactivo, hay ${totalBloques}`);
          }
          const yaIdentificados = new Set();
          for (let i = 0; i < 5; i++) {
            const prefijo = `act-${si}-${i}`;
            const bloque = bloques.nth(i);
            // El primer <p> del bloque es la etiqueta "REACTIVO N DE 5"; el
            // enunciado real es el segundo <p> (nth(1)).
            const textoPregunta = (await bloque.locator('p').nth(1).innerText()).trim().replace(/\s+/g, ' ');
            let candidatos = subtema.reactivos.filter((r) => {
              if (yaIdentificados.has(r)) return false;
              let texto;
              if (r.tipo === 'llenar_frase') {
                // El <input> es un elemento reemplazado (sin texto propio), así que
                // el innerText del <p> es "antes"+"después" pegados, sin el hueco.
                const [antes, despues] = r.frase.split('___');
                texto = `${antes || ''}${despues || ''}`;
              } else {
                texto = r.pregunta || r.enunciado || r.instruccion || '';
              }
              return texto && texto.trim().replace(/\s+/g, ' ') === textoPregunta;
            });
            if (candidatos.length > 1) {
              // Varios reactivos (típicamente relacionar_columnas, o preguntas con
              // un mismo enunciado "plantilla" pero distintos números/opciones) pueden
              // compartir el mismo texto visible — se desambigua con contenido que
              // NUNCA se baraja: las etiquetas de columnaA (columna izquierda) para
              // relacionar_columnas, o el CONJUNTO de opciones (como conjunto, no en
              // orden, porque sí se barajan) para opcion_multiple.
              const etiquetas = (await bloque.locator('span.flex-1').allInnerTexts()).map((t) => t.trim());
              if (etiquetas.length > 0) {
                candidatos = candidatos.filter((r) => Array.isArray(r.columnaA) && JSON.stringify(r.columnaA) === JSON.stringify(etiquetas));
              } else {
                const opcionesRenderizadas = (await bloque.locator('label').allInnerTexts()).map((t) => t.trim()).sort();
                if (opcionesRenderizadas.length > 0) {
                  candidatos = candidatos.filter((r) => {
                    if (!Array.isArray(r.opciones)) return false;
                    const propias = r.opciones.map((o) => String(o).trim()).sort();
                    return JSON.stringify(propias) === JSON.stringify(opcionesRenderizadas);
                  });
                }
              }
            }
            if (candidatos.length !== 1) {
              throw new Error(`actividad[${si}] no se pudo identificar sin ambigüedad el reactivo en la posición ${i} (barajado): "${textoPregunta.slice(0, 120)}" — ${candidatos.length} candidatos`);
            }
            const reactivoOriginal = candidatos[0];
            yaIdentificados.add(reactivoOriginal);
            await responder(page, prefijo, reactivoOriginal);
          }

          await page.click('[data-accion="enviar-actividad"]');
          await page.waitForTimeout(150);

          // Mini-resultado del subtema: 5/5 correctas, 5 de 5 estrellas máx (3
          // por defecto), puntaje "50 de 50 pts" (10 pts × 5).
          bodyText = await page.innerText('body');
          if (!bodyText.includes('5 / 5 correctas')) {
            throw new Error(`mini-resultado[${si}] esperaba "5 / 5 correctas", vio: ${bodyText.slice(0, 300)}`);
          }
          const puntosPorReactivo = subtema.puntosPorReactivo;
          const puntajeMaxSubtema = puntosPorReactivo * 5;
          if (!bodyText.includes(`de ${puntajeMaxSubtema} pts`)) {
            throw new Error(`mini-resultado[${si}] no muestra "de ${puntajeMaxSubtema} pts"`);
          }
          const estrellasMaxSubtema = subtema.estrellasMax || 3;
          if (!bodyText.includes('★'.repeat(estrellasMaxSubtema))) {
            throw new Error(`mini-resultado[${si}] no muestra las ${estrellasMaxSubtema} estrellas máximas (100% correcto)`);
          }

          const esUltimo = si === pda.subtemas.length - 1;
          if (!bodyText.includes(esUltimo ? 'Ver resultado global' : 'Siguiente subtema')) {
            throw new Error(`mini-resultado[${si}] no muestra el botón esperado ("${esUltimo ? 'Ver resultado global' : 'Siguiente subtema'}")`);
          }
          await page.click('[data-accion="continuar"]');
          await page.waitForTimeout(esUltimo ? 400 : 150); // el último dispara el webhook de pda_completo
        }

        // Resultado GLOBAL: suma de los 4 subtemas → 20/20 correctas,
        // puntaje/estrellas máximos también sumados.
        bodyText = await page.innerText('body');
        if (!bodyText.includes('Resultado global del PDA')) {
          throw new Error('no se llegó al panel de resultado global tras el 4.º subtema');
        }
        if (!bodyText.includes('20 / 20 correctas')) {
          throw new Error(`resultado global esperaba "20 / 20 correctas", vio: ${bodyText.slice(0, 300)}`);
        }
        const puntajeMaxGlobal = pda.subtemas.reduce((acc, s) => acc + s.puntosPorReactivo * 5, 0);
        if (!bodyText.includes(`de ${puntajeMaxGlobal} pts`)) {
          throw new Error(`resultado global no muestra "de ${puntajeMaxGlobal} pts"`);
        }
        const estrellasMaxGlobal = pda.subtemas.reduce((acc, s) => acc + (s.estrellasMax || 3), 0);
        if (!bodyText.includes('★'.repeat(estrellasMaxGlobal))) {
          throw new Error(`resultado global no muestra las ${estrellasMaxGlobal} estrellas máximas combinadas`);
        }

        // constancia: debe generarse con fecha Y hora, formato "obtenido de máximo",
        // y el botón de descargar PDF debe aparecer (visible, ya no oculto).
        // Sin internet real en el sandbox, el webhook tarda en fallar antes de
        // asignar el folio "PENDIENTE-...", así que se espera activamente al
        // botón (en vez de un timeout fijo) para no depender de la latencia
        // variable de la conexión bloqueada.
        const botonGenerar = page.locator('[data-accion="ver-constancia"]');
        await botonGenerar.waitFor({ state: 'visible', timeout: 8000 }).catch(() => {});
        if (await botonGenerar.count() > 0 && await botonGenerar.isVisible()) {
          await botonGenerar.click();
          await page.waitForTimeout(150);
          bodyText = await page.innerText('body');
          const etiquetaConstancia = `de ${puntajeMaxGlobal}`;
          if (!bodyText.includes(etiquetaConstancia)) {
            throw new Error(`la constancia no muestra "${etiquetaConstancia}" en: ${bodyText.slice(0, 400)}`);
          }
          // Fecha y hora: se verifica que aparezca "h" (sufijo de la hora,
          // "10:32 h") junto a un separador "·", como agrega constancia.js.
          const fechaHoraOk = /\d{1,2}:\d{2}\s*h/.test(bodyText) && bodyText.includes('·');
          if (!fechaHoraOk) {
            throw new Error(`la constancia no muestra fecha y hora en el formato esperado ("... · HH:MM h") en: ${bodyText.slice(0, 400)}`);
          }
          const botonPDF = page.locator('[data-accion="descargar-pdf"]');
          if (await botonPDF.count() === 0) {
            throw new Error('no existe el botón de descargar PDF tras generar la constancia');
          }
          if (!(await botonPDF.isVisible())) {
            throw new Error('el botón de descargar PDF sigue oculto tras generar la constancia');
          }
        } else {
          throw new Error('no se encontró (o no es visible) el botón "Generar mi constancia"');
        }

        // práctica extra: sección opcional, no calificada, debajo del resultado
        if (Array.isArray(pda.practicaExtra) && pda.practicaExtra.length > 0) {
          if (!bodyText.includes('¿Quieres seguir practicando?')) {
            throw new Error('no aparece la sección de práctica extra a pesar de existir pda.practicaExtra');
          }
          for (let i = 0; i < pda.practicaExtra.length; i++) {
            const pregunta = pda.practicaExtra[i];
            const prefijo = `practica-${i}`;
            await responder(page, prefijo, pregunta);
            await page.click(`[data-accion="verificar-practica"][data-indice="${i}"]`);
            await page.waitForTimeout(80);
            const feedbackTxt = await page.locator(`[data-practica-feedback="${i}"]`).innerText();
            if (!feedbackTxt.includes('¡Correcto!')) {
              throw new Error(`practicaExtra[${i}] no marcó correcto: "${feedbackTxt}"`);
            }
          }
        }

        if (consoleErrors.length > 0) {
          throw new Error('errores de consola: ' + consoleErrors.join(' | '));
        }

        resultados.push({ grado, id: pda.id, ok: true });
        console.log(`OK   ${grado} ${pda.id} — ${pda.titulo}`);
      } catch (e) {
        resultados.push({ grado, id: pda.id, ok: false, error: e.message });
        console.log(`FAIL ${grado} ${pda.id} — ${e.message}`);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();

  const fallidos = resultados.filter((r) => !r.ok);
  console.log(`\n--- RESUMEN: ${resultados.length} PDAs probados, ${fallidos.length} fallidos ---`);
  if (fallidos.length > 0) {
    process.exit(1);
  }
})();
