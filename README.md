# MATE-NEM

Aplicación web pública y gamificada para la enseñanza de Matemáticas en
Educación Secundaria, alineada a la Nueva Escuela Mexicana (NEM). Acceso
libre por enlace (sin contraseñas), registro ligero del alumno, PDAs con el
tema explicado en subtemas, preguntas de repaso y un reto final gamificado
con puntos/estrellas, y constancias descargables con código QR de verificación.

## Estado del proyecto

Este repositorio se construye por pasos. Ya está completo el flujo principal:
registro del alumno → selección de grado → PDA (problematización → subtemas
con checks formativos → reto final con reactivos mixtos) → resultado con
puntos/estrellas → envío a Sheets → constancia con QR. Cada PDA muestra una
barra de avance (%) durante todo el recorrido. El Trimestre 1 completo (17
PDAs: 7 en 1°, 6 en 2°, 4 en 3°) ya está cargado con el diseño ampliado:
tema explicado en subtemas con ejemplos, preguntas de repaso entre subtemas
y un reto final que mezcla los 4 tipos de reactivo soportados (opción
múltiple, verdadero/falso, llenar frase, relacionar columnas). Falta la
página de verificación de folios y el despliegue real del backend.

## Árbol del repositorio

```
mate-nem/
├── README.md
├── index.html                     ✅ incluido — registro + arranque de la SPA
├── assets/
│   ├── css/
│   │   └── styles.css             ✅ incluido — estilos globales complementarios a Tailwind
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
7. ⏳ Página de verificación de folios (`verificar.html`) enlazada desde el QR.
8. ⏳ Trimestres 2 y 3 (ejes "Forma, espacio y medida" y "Análisis de datos y probabilidad").
9. ⏳ Desplegar el Web Endpoint real, configurar `WEBHOOK_URL` y subir a GitHub Pages.
10. ⏳ Pruebas en dispositivos móviles reales.
