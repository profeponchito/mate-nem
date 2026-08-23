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

async function responder(page, prefijo, pregunta) {
  const r = respuestaCorrecta(pregunta);
  if (r.tipo === 'opcion_multiple' || r.tipo === 'verdadero_falso') {
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

        await page.goto(`${BASE}/#/pda/${encodeURIComponent(grado)}/${encodeURIComponent(pda.id)}`, { waitUntil: 'load' });
        await page.waitForTimeout(200);

        // problematización: debe verse el título (pda.titulo)
        let bodyText = await page.innerText('body');
        if (!bodyText.includes(pda.titulo)) throw new Error('problematización no muestra el título del PDA');
        await page.click('[data-accion="continuar"]');
        await page.waitForTimeout(100);

        for (let si = 0; si < pda.subtemas.length; si++) {
          const subtema = pda.subtemas[si];
          bodyText = await page.innerText('body');
          if (!bodyText.includes(subtema.titulo)) throw new Error(`subtema[${si}] no muestra su título`);
          await page.click('[data-accion="continuar"]');
          await page.waitForTimeout(100);
          if (subtema.check) {
            bodyText = await page.innerText('body');
            if (!bodyText.includes(subtema.titulo)) throw new Error(`check[${si}] no muestra el título del subtema`);
            if (!bodyText.includes(subtema.explicacion)) throw new Error(`check[${si}] no muestra la explicación teórica del subtema`);
            const prefijo = `check-${si}`;
            await responder(page, prefijo, subtema.check);
            await page.click('[data-accion="verificar-check"]');
            await page.waitForTimeout(100);
            const feedbackTxt = await page.locator('[data-check-feedback]').innerText();
            if (!feedbackTxt.includes('¡Correcto!')) {
              throw new Error(`check subtema[${si}] no marcó correcto: "${feedbackTxt}"`);
            }
            await page.click('[data-accion="continuar"]');
            await page.waitForTimeout(100);
          }
        }

        // reto: debe verse el título del pda, la síntesis teórica, y los 5 reactivos
        bodyText = await page.innerText('body');
        if (!bodyText.includes(pda.titulo)) throw new Error('reto no muestra el título del PDA');
        if (!bodyText.includes(pda.reto.sintesis)) throw new Error('reto no muestra reto.sintesis');

        const reactivos = pda.reto.reactivos;
        if (reactivos.length !== 5) throw new Error(`se esperaban 5 reactivos en el reto, hay ${reactivos.length}`);
        for (let i = 0; i < reactivos.length; i++) {
          await responder(page, `reto-${i}`, reactivos[i]);
        }
        await page.click('[data-accion="enviar-reto"]');
        await page.waitForTimeout(300);

        bodyText = await page.innerText('body');
        const esperado = `${reactivos.length} / ${reactivos.length} correctas`;
        if (!bodyText.includes(esperado)) {
          throw new Error(`resultado inesperado, se esperaba "${esperado}" en: ${bodyText.slice(0, 300)}`);
        }
        const estrellasMax = pda.reto.estrellasMax || 3;
        if (!bodyText.includes('★'.repeat(estrellasMax))) {
          throw new Error(`no se ven las ${estrellasMax} estrellas máximas`);
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
