# MATE-NEM

Aplicación web pública y gamificada para la enseñanza de Matemáticas en
Educación Secundaria, alineada a la Nueva Escuela Mexicana (NEM). Acceso
libre por enlace (sin contraseñas), registro ligero del alumno, PDAs
estructurados en tres fases, gamificación con puntos/estrellas, y
constancias descargables con código QR de verificación.

## Estado del proyecto

Este repositorio se construye por pasos. Este primer entregable incluye
la estructura completa de carpetas y los tres módulos que no dependen de
los demás: **backend**, **constancias** y **datos de PDAs**. El resto
(`index.html`, router, sesión, gamificación) se agrega en el siguiente paso.

## Árbol del repositorio

```
mate-nem/
├── README.md
├── index.html                     ⏳ próximo paso (registro + navegación SPA)
├── assets/
│   ├── css/
│   │   └── styles.css             ⏳ próximo paso
│   ├── img/                       ⏳ logos e íconos
│   └── js/
│       ├── app.js                 ⏳ próximo paso (bootstrap de la SPA)
│       ├── router.js              ⏳ próximo paso (navegación por hash)
│       ├── session.js             ⏳ próximo paso (datos del alumno, localStorage)
│       ├── pda-loader.js          ⏳ próximo paso (lee data/grado-X + index.json)
│       ├── gamification.js        ⏳ próximo paso (puntos/estrellas)
│       ├── webhook.js             ✅ incluido — POST al backend serverless
│       └── constancia.js          ✅ incluido — diploma dinámico + QR + PDF
├── components/
│   └── constancia.html            ✅ incluido — demo aislado de la constancia
├── data/
│   ├── README.md                  ✅ incluido — cómo agregar PDAs
│   ├── schema/
│   │   └── pda.schema.json        ✅ incluido — esquema formal de un PDA
│   ├── grado-1/
│   │   └── index.json             ✅ incluido (vacío, listo para llenar)
│   ├── grado-2/
│   │   ├── index.json             ✅ incluido
│   │   └── 2S-B1-PDA03.json       ✅ incluido — ejemplo funcional (proporcionalidad)
│   └── grado-3/
│       └── index.json             ✅ incluido (vacío, listo para llenar)
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

1. **Constancia:** `constancia.js` usa `import`/`export` (ES Modules), y los
   navegadores bloquean módulos cargados con doble clic (`file://`) por política
   CORS. Sírvelo con un servidor local — por ejemplo `python3 -m http.server`
   desde la raíz del repo, o la extensión "Live Server" de VS Code — y abre
   `http://localhost:8000/components/constancia.html`. En GitHub Pages esto no
   es un problema, porque el sitio ya se sirve por `https://`.
2. **Backend:** sigue `backend/google-apps-script/README.md` para desplegar
   el Web Endpoint y probarlo con la URL `.../exec` en el navegador.
3. **Datos:** revisa `data/grado-2/2S-B1-PDA03.json` como referencia para
   escribir nuevos PDAs; valida contra `data/schema/pda.schema.json`.

## Hoja de ruta (según se acordó en el proyecto)

1. ✅ Archivos de configuración y backend (Apps Script) + constancia + esquema de PDAs.
2. ⏳ Interfaz web: `index.html`, registro del alumno, navegación por grado.
3. ⏳ Router + carga dinámica de PDAs (`pda-loader.js`) y motor de gamificación.
4. ⏳ Integración final: flujo completo PDA → actividad → envío a Sheets → constancia.
5. ⏳ Página de verificación de folios (`verificar.html`) enlazada desde el QR.
6. ⏳ Despliegue en GitHub Pages y pruebas en dispositivos móviles.
