# MATE-NEM

Aplicación web pública y gamificada para la enseñanza de Matemáticas en
Educación Secundaria, alineada a la Nueva Escuela Mexicana (NEM). Acceso
libre por enlace (sin contraseñas), registro ligero del alumno, PDAs
estructurados en tres fases, gamificación con puntos/estrellas, y
constancias descargables con código QR de verificación.

## Estado del proyecto

Este repositorio se construye por pasos. Ya está completo el flujo principal:
registro del alumno → selección de grado → PDA (problematización → síntesis →
actividad) → resultado con puntos/estrellas → envío a Sheets → constancia
con QR. Falta la página de verificación de folios y el despliegue real.

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

Toda la app usa `import`/`export` (ES Modules) y los navegadores bloquean
módulos cargados con doble clic (`file://`) por política CORS. Sírvela con
un servidor local:

```bash
cd mate-nem
python3 -m http.server 8000
```

Y abre `http://localhost:8000/`. En GitHub Pages esto no es problema, porque
el sitio ya se sirve por `https://`.

1. **Flujo completo:** regístrate con cualquier nombre/grado/grupo, entra a
   2° de secundaria (es el único grado con un PDA de ejemplo cargado),
   resuelve "Proporcionalidad directa en la vida cotidiana" y genera tu
   constancia. Sin el Web Endpoint desplegado, el envío a Sheets fallará
   silenciosamente y el folio dirá `PENDIENTE-...`: es el comportamiento
   esperado hasta que sigas el paso 2.
2. **Backend:** sigue `backend/google-apps-script/README.md` para desplegar
   el Web Endpoint, prueba la URL `.../exec` en el navegador y pégala en
   `assets/js/webhook.js` (`WEBHOOK_URL`).
3. **Datos:** revisa `data/grado-2/2S-B1-PDA03.json` como referencia para
   escribir nuevos PDAs; valida contra `data/schema/pda.schema.json`. Añade
   el nombre del archivo al `index.json` de la carpeta del grado correspondiente.

## Hoja de ruta (según se acordó en el proyecto)

1. ✅ Archivos de configuración y backend (Apps Script) + constancia + esquema de PDAs.
2. ✅ Interfaz web: `index.html`, registro del alumno, navegación por grado.
3. ✅ Router + carga dinámica de PDAs (`pda-loader.js`) y motor de gamificación.
4. ✅ Integración final: flujo completo PDA → actividad → envío a Sheets → constancia (probado de punta a punta).
5. ⏳ Página de verificación de folios (`verificar.html`) enlazada desde el QR.
6. ⏳ Completar los PDAs oficiales de la NEM para 1°, 2° y 3° (hoy solo hay 1 de ejemplo).
7. ⏳ Desplegar el Web Endpoint real, configurar `WEBHOOK_URL` y subir a GitHub Pages.
8. ⏳ Pruebas en dispositivos móviles reales.
