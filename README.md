# MATE-NEM

Aplicación web pública y gamificada para la enseñanza de Matemáticas en
Educación Secundaria, alineada a la Nueva Escuela Mexicana (NEM). Acceso
libre por enlace (sin contraseñas), registro ligero del alumno, PDAs
divididos en 4 subtemas de menor a mayor dificultad (cada uno con su propia
mini-actividad gamificada de 5 preguntas, con puntos y estrellas), un
resultado global por PDA, y constancias descargables con fecha, hora y
código QR de verificación.

## Estado del proyecto

Este repositorio se construye por pasos. Ya está completo el flujo principal:
registro del alumno → selección de grado (con acceso, además, al apartado
"Ejercítate" de operaciones básicas) → PDA (problematización → 4 subtemas de
menor a mayor dificultad, cada uno con su propia mini-actividad calificada
de 5 reactivos y su propio mini-resultado → resultado GLOBAL del PDA, suma
de los 4 → práctica extra opcional) → envío a Sheets (uno por subtema y uno
por el resultado global) → constancia con fecha, hora y QR. Cada PDA muestra
una barra de avance (%) durante todo el recorrido. El Trimestre 1 completo
(17 PDAs: 7 en 1°, 6 en 2°, 4 en 3°) ya está cargado con este diseño: cada
PDA tiene exactamente **4 subtemas × 5 reactivos = 20 preguntas**, mezclando
los 4 tipos soportados (opción múltiple, verdadero/falso, llenar frase,
relacionar columnas); en cada intento, el orden de las preguntas y el de sus
opciones se mezcla aleatoriamente, así que repetir un subtema no se ve
idéntico la segunda vez. Cada PDA y cada subtema tiene su propio número
(`Tema N`, `N.1`…`N.4`) mostrado junto a su título. Una sección de práctica
extra opcional (3-4 reactivos más, sin calificar) aparece después del
resultado global para quien quiera seguir practicando.

La interfaz tiene un diseño visual propio e intuitivo: tipografía Baloo 2
para encabezados e Inter para texto, paleta índigo/violeta como marca con un
acento de color distinto por grado, y además **un color distinto por fase
del recorrido** (ámbar para la problematización, azul cielo para los
subtemas, rosa para las mini-actividades/mini-resultados, ámbar para el
resultado global y verde azulado para la práctica extra y para "Ejercítate")
para que sea más fácil distinguir en qué parte del PDA está el alumno de un
vistazo. Incluye íconos dibujados a mano por tipo de pantalla (sin librería
externa de íconos), animaciones de entrada suaves y estrellas con efecto
"pop" en los resultados, y una constancia con fecha y hora de generación,
código QR y descarga en PDF. Falta la página de verificación de folios, el
contenido interactivo de "Ejercítate" (por ahora solo un acceso visible con
aviso de "en construcción"), el trazado en "serpiente" del camino de
PDAs/actividades y el despliegue real del backend.

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
│       ├── pda-loader.js          ✅ incluido — lee data/grado-X + index.json
│       ├── gamification.js        ✅ incluido — cálculo de puntaje y estrellas
│       ├── webhook.js             ✅ incluido — POST al backend + reintento automático
│       └── constancia.js          ✅ incluido — diploma dinámico + QR + PDF
├── components/
│   └── constancia.html            ✅ incluido — demo aislado de la constancia
├── data/
│   ├── README.md                  ✅ incluido — cómo agregar PDAs + fuente curricular
│   ├── schema/
│   │   └── pda.schema.json        ✅ incluido — esquema formal de un PDA
│   ├── grado-1/                   ✅ 7 PDAs — Trimestre 1 completo (1S-B1-PDA01…07)
│   ├── grado-2/                   ✅ 6 PDAs — Trimestre 1 completo (2S-B1-PDA01…06)
│   └── grado-3/                   ✅ 4 PDAs — Trimestre 1 completo (3S-B1-PDA01…04)
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
   grado — los 3 ya tienen el Trimestre 1 completo — resuelve cualquier PDA
   y genera tu constancia. Sin el Web Endpoint desplegado, el envío a Sheets
   fallará silenciosamente y el folio dirá `PENDIENTE-...`: es el
   comportamiento esperado hasta que sigas el paso 2.
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
12. ⏳ Camino de PDAs en forma de "serpiente" (visual estilo Duolingo) y paleta de colores propia, distinta a la de Duolingo.
13. ⏳ Contenido interactivo del apartado "Ejercítate" (operaciones básicas: suma, resta, multiplicación, división).
14. ⏳ Página de verificación de folios (`verificar.html`) enlazada desde el QR.
15. ⏳ Trimestres 2 y 3 (ejes "Forma, espacio y medida" y "Análisis de datos y probabilidad").
16. ⏳ Desplegar el Web Endpoint real, configurar `WEBHOOK_URL` y subir a GitHub Pages.
17. ⏳ Pruebas en dispositivos móviles reales.
