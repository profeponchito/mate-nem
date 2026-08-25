# MATE-NEM

Aplicación web pública y gamificada para la enseñanza de Matemáticas en
Educación Secundaria, alineada a la Nueva Escuela Mexicana (NEM). Acceso
libre por enlace (sin contraseñas), registro ligero del alumno, PDAs
divididos en subtemas de menor a mayor dificultad (cada uno con su propia
mini-actividad gamificada de 5 o 10 preguntas —en una o dos rondas—, con
puntos y estrellas), un resultado global por PDA, y constancias
descargables con fecha, hora y código QR de verificación. Incluye además
"Ejercítate", un apartado de 40 temas de práctica libre disponible para
cualquier alumno de cualquier grado.

## Estado del proyecto

Este repositorio se construye por pasos. Ya está completo el flujo principal:
registro del alumno → selección de grado (con acceso, además, al apartado
"Ejercítate" de 40 temas de práctica libre) → PDA (problematización →
subtemas de menor a mayor dificultad, cada uno con su propia mini-actividad
calificada de 5 reactivos y su propio mini-resultado → resultado GLOBAL del
PDA, suma de todos los subtemas → práctica extra opcional) → envío a Sheets
(uno por subtema y uno por el resultado global) → constancia con fecha,
hora y QR → **pantalla de celebración final** estilo videojuego. El
Trimestre 1 completo (17 PDAs: 7 en 1°, 6 en 2°, 4 en 3°) y los 40 temas de
Ejercítate ya están cargados con este diseño, mezclando los 4 tipos de
reactivo soportados (opción múltiple, verdadero/falso, llenar frase,
relacionar columnas); en cada intento, el orden de las preguntas y el de
sus opciones se mezcla aleatoriamente, así que repetir un subtema no se ve
idéntico la segunda vez. Cada PDA/tema y cada subtema tiene su propio
número (`Tema N`, `N.1`…) mostrado junto a su título. Una sección de
práctica extra opcional (3-4 reactivos más, sin calificar) aparece después
del resultado global para quien quiera seguir practicando, y justo después
de ella (o del resultado, si el PDA no tiene práctica extra) aparece la
celebración final.

Cada uno de los PDAs curriculares del Trimestre 1 tenía, además de sus 4
subtemas núcleo (Introductorio/Intermedio/Avanzado/Síntesis, 20 reactivos),
**3 subtemas de repaso adicionales** (`N.5`-`N.7`, 15 reactivos más) que no
introducían contenido nuevo sino que reforzaban lo ya visto con ejercicios
distintos — 7 subtemas y 35 reactivos calificados por PDA. Desde el Paso 15,
esos 7 subtemas de cada uno de los 17 PDAs originales son **cada uno su
propia tarjeta independiente del camino** (mismo contenido matemático de
siempre, con una problematización propia y corta): el recorrido de cada
grado ya no tiene 7/6/4 paradas, sino **49 en 1°, 42 en 2° y 28 en 3°** —
un recorrido mucho más largo sin inventar temario nuevo, solo repartiendo
el que ya existía. Cada tarjeta trae su propia etiqueta de nivel fija
("Nivel N de 4 · Avanzado", "Repaso 2 de 3"…) para no perder de vista en
qué punto de dificultad del PDA original está. Los temas de Ejercítate
siguen con 4 subtemas (20 reactivos) cada uno, sin cambios. Desde el Paso
16, el único subtema de cada una de esas 119 tarjetas creció de 5 a **10
reactivos**, presentados como dos rondas consecutivas de 5 ("Ronda 1 de 2"
/ "Ronda 2 de 2") que se califican juntas en un solo mini-resultado; los
temas de Ejercítate no se tocaron y siguen en una sola ronda de 5. Desde
el Paso 17, Ejercítate tiene **40 temas** (36 originales + 4 nuevos de
"completar dígitos del algoritmo" y números con signo, ver más abajo). Al
terminar la constancia (y la práctica extra, si la tarjeta la tiene — ver más abajo),
aparece una pantalla de **celebración estilo "nivel superado" de
videojuego** — confeti animado, trofeo y un botón para elegir otro tema —
como cierre festivo de cada recorrido.

"Ejercítate" (40 temas, agrupados en básicos/intermedios/avanzados/
estadística y probabilidad) reutiliza el 100% del motor de PDAs: se trata
como un "grado" sintético que recorre exactamente las mismas rutas, vistas
y lógica de gamificación que un grado real, solo con su propia carpeta de
datos (`data/ejercitate/`) y su propio color de acento — ver `data/README.md`
para el detalle de esta arquitectura y el listado completo de los 40 temas.

La interfaz tiene un diseño visual propio e intuitivo: tipografía Baloo 2
para encabezados e Inter para texto, marca índigo/violeta en la navegación,
y una paleta propia **"Aula NEM"** — original y deliberadamente distinta a
la de Duolingo (azul pizarrón, cobre, verde bosque y grafito por grado/
Ejercítate; ámbar/ocre, azul, vino y verde azulado por fase del recorrido)
— para que sea más fácil distinguir en qué parte del PDA está el alumno de
un vistazo. La lista de PDAs de cada grado se muestra como un **camino
serpenteante** (curva SVG suave con un nodo numerado por PDA, ninguno
bloqueado — el docente puede pedir cualquier PDA en cualquier momento); en
Ejercítate ese mismo camino se repite una vez por categoría (4 mini-caminos
con su propio encabezado). Dentro de cada PDA/tema el avance también se ve
"en serpiente" al bajar de actividad en actividad. Incluye íconos dibujados
a mano por tipo de pantalla (sin librería externa de íconos), animaciones
de entrada suaves y estrellas con efecto "pop" en los resultados, y una
constancia con fecha y hora de generación, código QR y descarga en PDF.
Falta la página de verificación de folios y el despliegue real del backend.

## Árbol del repositorio

```
mate-nem/
├── README.md
├── index.html                     ✅ incluido — registro + arranque de la SPA + fuentes Baloo 2/Inter
├── assets/
│   ├── css/
│   │   └── styles.css             ✅ incluido — diseño visual, animaciones y estilos de la constancia
│   ├── img/                       (vacío — logos/íconos opcionales)
│   └── js/
│       ├── app.js                 ✅ incluido — vistas y flujo completo de la SPA
│       ├── router.js              ✅ incluido — router por hash, sin dependencias
│       ├── session.js             ✅ incluido — datos del alumno en localStorage
│       ├── pda-loader.js          ✅ incluido — lee data/grado-X (o data/ejercitate) + index.json
│       ├── gamification.js        ✅ incluido — cálculo de puntaje y estrellas
│       ├── webhook.js             ✅ incluido — POST al backend + reintento automático
│       └── constancia.js          ✅ incluido — diploma dinámico + QR + PDF
├── components/
│   └── constancia.html            ✅ incluido — demo aislado de la constancia
├── data/
│   ├── README.md                  ✅ incluido — cómo agregar PDAs + fuente curricular
│   ├── schema/
│   │   └── pda.schema.json        ✅ incluido — esquema formal de un PDA
│   ├── grado-1/                   ✅ 49 tarjetas — Trimestre 1 dividido en camino (7 PDAs × 7 subtemas)
│   ├── grado-2/                   ✅ 42 tarjetas — Trimestre 1 dividido en camino (6 PDAs × 7 subtemas)
│   ├── grado-3/                   ✅ 28 tarjetas — Trimestre 1 dividido en camino (4 PDAs × 7 subtemas)
│   └── ejercitate/                ✅ 40 temas — básicos/intermedios/avanzados/estadística (EJ-01…40)
└── backend/
    └── google-apps-script/
        ├── Code.gs                ✅ incluido — Web Endpoint (doPost/doGet)
        └── README.md              ✅ incluido — esquema de columnas y despliegue
```

## Stack técnico

- **Frontend:** HTML5, CSS3 (Tailwind CSS vía CDN), JavaScript Vanilla ES6+ modular (sin build step, compatible con GitHub Pages tal cual).
- **QR y PDF:** `qrcode.js` y `html2pdf.js`, cargados por CDN.
- **Backend / DB:** Google Apps Script (Web App) + Google Sheets.
- **Hosting:** GitHub Pages (repositorio público, rama `main` o carpeta `/docs`).

## Cómo probar lo ya construido

Toda la app usa `import`/`export` (ES Modules) y los navegadores bloquean
módulos cargados con doble clic (`file://`) por política CORS. Sírvela con
un servidor local:

```bash
cd mate-nem
python3 -m http.server 8000
```

Y abre `http://localhost:8000/`. En GitHub Pages esto no es problema, porque
el sitio ya se sirve por `https://`.

1. **Flujo completo:** regístrate con cualquier nombre/grado/grupo, elige tu
   grado — los 3 ya tienen el Trimestre 1 completo — o entra a "Ejercítate"
   para cualquiera de sus 40 temas; resuelve cualquier PDA/tema y genera tu
   constancia. Sin el Web Endpoint desplegado, el envío a Sheets fallará
   silenciosamente y el folio dirá `PENDIENTE-...`: es el comportamiento
   esperado hasta que sigas el paso 2.
2. **Backend:** sigue `backend/google-apps-script/README.md` para desplegar
   el Web Endpoint, prueba la URL `.../exec` en el navegador y pégala en
   `assets/js/webhook.js` (`WEBHOOK_URL`).
3. **Datos:** revisa `data/README.md` — incluye la fuente curricular usada
   y cómo agregar más PDAs; valida contra `data/schema/pda.schema.json`.

## Hoja de ruta (según se acordó en el proyecto)

1. ✅ Archivos de configuración y backend (Apps Script) + constancia + esquema de PDAs.
2. ✅ Interfaz web: `index.html`, registro del alumno, navegación por grado.
3. ✅ Router + carga dinámica de PDAs (`pda-loader.js`) y motor de gamificación.
4. ✅ Integración final: flujo completo PDA → actividad → envío a Sheets → constancia (probado de punta a punta).
5. ✅ Trimestre 1 completo en los 3 grados (17 PDAs, transcritos del Programa Sintético Fase 6 — ver `data/README.md` sobre la distribución por grado).
6. ✅ Rediseño de los PDA: tema explicado en subtemas (con ejemplos y checks formativos de 4 tipos de pregunta), barra de % de avance y reto final con reactivos mixtos — aplicado a los 17 PDAs existentes y probado de punta a punta.
7. ✅ Título y explicación teórica al inicio de cada pantalla del recorrido, problematización redactada en lenguaje sencillo.
8. ✅ Reto ampliado a 5 reactivos, sección de práctica extra opcional después del resultado, y diseño visual propio (tipografía, colores por grado, íconos, animaciones, constancia rediseñada) — aplicado a los 17 PDAs y probado de punta a punta.
9. ✅ Reto ampliado de 5 a **20 reactivos por PDA**, presentados en 4 páginas de 5 con navegación Atrás/Siguiente que conserva las respuestas, y un color distinto por fase del recorrido para hacer la interfaz más intuitiva — aplicado a los 17 PDAs y probado de punta a punta (incluida la restauración de respuestas al navegar hacia atrás).
10. ✅ Constancia con comparación de puntaje ("X de Y pts") y botón de descarga en PDF reubicado justo debajo del diploma; numeración de Temas y subtemas (`Tema N`, `N.1`…) en toda la app; manifiesto y numeración propia (`E.1`…`E.4`) para el futuro apartado "Ejercítate".
11. ✅ Rediseño Duolingo (primera etapa): cada PDA pasó de "3 subtemas + 1 reto de 20 preguntas paginado" a **4 subtemas de menor a mayor dificultad, cada uno con su propia mini-actividad calificada de 5 preguntas** (20 en total) con orden de preguntas/opciones aleatorio en cada intento, más un **resultado global** (suma de los 4 mini-resultados) que alimenta la constancia; constancia con fecha y hora; acceso a "Ejercítate" ya visible en la pantalla de selección de grado (contenido interactivo aún pendiente) — aplicado a los 17 PDAs y probado de punta a punta.
12. ✅ Camino de PDAs en forma de "serpiente" (curva SVG suave con nodos numerados, ninguno bloqueado — el docente puede pedir cualquier PDA en cualquier momento), un indicador de avance también "en serpiente" al bajar de actividad en actividad dentro de un PDA, y una paleta de colores propia ("Aula NEM": azul pizarrón, cobre, verde bosque, grafito, vino, ocre) deliberadamente distinta a la de Duolingo — aplicado a los 3 grados y probado de punta a punta.
13. ✅ Contenido interactivo completo del apartado "Ejercítate": 36 temas (10 básicos, 10 intermedios, 10 avanzados, 6 de estadística y probabilidad), con la misma dinámica que un PDA (problematización + 4 subtemas × 5 reactivos + práctica extra). Arquitectura de "pseudo-grado" (`'ejercitate'` reutiliza el 100% del motor de PDAs — rutas, carga de datos, gamificación, webhook, constancia — con su propia carpeta `data/ejercitate/` y su propio color de acento, ver `data/README.md`) y camino agrupado en 4 mini-caminos por categoría, cada uno con su propio encabezado. Los 36 temas (864 reactivos) están validados contra el esquema, sin duplicados semánticos, y probados de punta a punta con Playwright.
14. ✅ Subtemas de repaso y pantalla de celebración final. Los 17 PDAs del Trimestre 1 ganaron 3 subtemas de repaso cada uno (`N.5`-`N.7`, 15 reactivos más, sin contenido nuevo — refuerzan los 4 subtemas núcleo con ejercicios distintos), pasando de 4 a 7 subtemas y de 20 a 35 reactivos calificados por PDA; el motor de PDAs ya soportaba cualquier número de subtemas de forma dinámica, así que solo hizo falta generalizar la etiqueta de nivel (`nivelChip_`: "Repaso N de 3" para los subtemas extra) y el esquema (`maxItems` de 4 a 7). Además, al terminar la constancia (y la práctica extra, si la hay) aparece una pantalla de celebración estilo "nivel superado" de videojuego (`panelCelebracion_`: confeti animado, trofeo y botón para elegir otro tema). Los 255 reactivos nuevos (17 PDAs × 3 subtemas × 5) están validados contra el esquema, sin duplicados semánticos en todo el archivo de cada PDA (no solo por subtema — 663 reactivos revisados en total entre los 17 PDAs, sumando los ya existentes), y probados de punta a punta con Playwright junto con los 36 temas de Ejercítate (53/53 pruebas).
15. ✅ Cada PDA curricular del Trimestre 1 (17 en total) se dividió en tantas tarjetas de camino como subtemas tenía (7 cada uno): el recorrido de cada grado pasó de 7/6/4 paradas a **49/42/28**, sin escribir temario nuevo — reutiliza tal cual la explicación, ejemplos y los 5 reactivos de cada subtema, solo con una problematización nueva y breve por tarjeta (redactada por separado para cada una de las 119, con un contexto real distinto ligado específicamente a esa habilidad). El motor de PDAs ya soportaba cualquier número de subtemas (ver Paso 14), así que una tarjeta de 1 solo subtema funciona sin cambios de fondo; se agregó `nivelEtiqueta` (esquema y `nivelChip_` en `app.js`) para que cada tarjeta muestre su nivel de dificultad real ("Nivel 3 de 4 · Avanzado", "Repaso 2 de 3"…) en vez de recalcularlo por su posición (que en una tarjeta de 1 subtema siempre sería "1 de 1"). La práctica extra de cada PDA original se conserva en la última de sus 7 tarjetas (la de "Repaso integral"), sin duplicarla en las demás. Los 17 PDAs monolíticos originales se reemplazaron por las 119 tarjetas (`data/grado-N/index.json` reconstruido); las 119 problematizaciones nuevas están validadas contra el esquema, sin duplicados exactos entre sí, y las 119 tarjetas + los 36 temas de Ejercítate (155 en total) están probados de punta a punta con Playwright (155/155).
16. ✅ Segunda ronda de reactivos en las 119 tarjetas del camino (Paso 16): cada una de las 119 tarjetas de grado-1/2/3 pasó de 5 a **10 reactivos** en su único subtema, presentados como **dos rondas consecutivas de 5** ("Ronda 1 de 2" → "Ronda 2 de 2", equivalentes a un "paso 3" y un "paso 4" del recorrido) que se califican juntas en un solo mini-resultado al terminar la segunda ronda — el reto ya no termina en la primera pantalla de 5 preguntas. El motor deriva el número de rondas de `Math.ceil(reactivos.length / 5)`, así que sigue siendo 100% compatible con los 36 temas de Ejercítate (5 reactivos = 1 sola ronda, sin cambio visible). El orden de las preguntas y, si son de opción múltiple, el de sus opciones se vuelve a barajar cada vez que se entra tanto en la Ronda 1 como en la Ronda 2 (mecanismo ya existente, ahora extendido a las 10). Se agregaron 595 reactivos nuevos (119 tarjetas × 5), validados contra el esquema, sin duplicados reales (0 tras revisión por firma completa de contenido, no solo por texto inicial), y las 155 tarjetas/temas están probados de punta a punta con Playwright (155/155).
17. ✅ 4 temas nuevos en "Ejercítate" (Paso 17), categoría básico: **"Completar dígitos del algoritmo de la suma y resta"** (acarreo y préstamo, incluido préstamo a través de ceros), **"Suma y resta de números con signo"** (regla de signos, resta como suma del opuesto, dobles negativos, aplicaciones reales), **"Completar dígitos del algoritmo de la multiplicación y división"** (acarreos, productos parciales, bajar dígitos, residuos) y **"Completar dígitos del algoritmo de la multiplicación y división con decimales"** (conteo/colocación de cifras decimales, recorrer el punto decimal al dividir). A diferencia de los temas de "calcular el resultado final" que ya existían, estos ponen el foco en el *proceso* del algoritmo escrito: cada reactivo describe un paso concreto (en prosa, no en una cuadrícula vertical — el motor de reactivos solo soporta un hueco `___` por línea) y pide el dígito o número que falta en ese paso. Ejercítate pasó de 36 a **40 temas** (EJ-37…EJ-40); los 36 originales no se tocaron. Los 160 reactivos nuevos (4 temas × 4 subtemas × 5 + 4 de práctica extra cada uno) están validados contra el esquema, sin duplicados reales, y probados de punta a punta con Playwright junto con el resto del banco (159/159).
18. ⏳ Página de verificación de folios (`verificar.html`) enlazada desde el QR.
19. ⏳ Trimestres 2 y 3 (ejes "Forma, espacio y medida" y "Análisis de datos y probabilidad") para los PDAs por grado.
20. ⏳ Desplegar el Web Endpoint real, configurar `WEBHOOK_URL` y subir a GitHub Pages.
21. ⏳ Pruebas en dispositivos móviles reales.
