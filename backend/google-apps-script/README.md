# Backend · Google Apps Script

Este directorio contiene el único archivo de backend del proyecto: `Code.gs`.
No hay servidor propio ni base de datos de pago — Google Apps Script actúa
como Web Endpoint gratuito y Google Sheets como base de datos.

## Esquema de la hoja "Registros"

Cada vez que un alumno concluye un PDA, el frontend hace un `POST` con el
resultado y `Code.gs` agrega una fila con estas columnas exactas:

| # | Columna | Tipo | Descripción |
|---|---|---|---|
| A | Timestamp | Fecha/hora | Generado por el servidor al recibir la solicitud (no confiar en la hora del cliente) |
| B | Nombre Completo | Texto | Nombre capturado al iniciar sesión |
| C | Grado | Texto | `1°`, `2°` o `3°` |
| D | Grupo | Texto | Ej. `A`, `B`, `301` |
| E | PDA ID | Texto | Identificador del PDA, ej. `2S-B1-PDA03` |
| F | PDA Concluido | Texto | Título/nombre legible del PDA |
| G | Eje / Contenido | Texto | Eje articulador o contenido curricular NEM asociado |
| H | Puntaje | Número | Calificación obtenida en la actividad gamificada |
| I | Estrellas | Número | 0–3, usado para la mecánica de gamificación |
| J | Codigo Verificacion | Texto (UUID) | Folio único de la constancia; se genera en el backend con `Utilities.getUuid()` si el frontend no envía uno |
| K | User Agent | Texto | Referencia técnica del dispositivo, útil para depurar incidencias |

La fila 1 (encabezados) se crea automáticamente la primera vez que se
recibe un registro, así que la hoja puede empezar completamente vacía.

## Despliegue rápido

1. Crea una hoja de cálculo nueva en Google Drive (ej. "MATE-NEM Registros").
2. `Extensiones > Apps Script`, borra el contenido por defecto y pega `Code.gs`.
3. `Implementar > Nueva implementación > Aplicación web`.
   - Ejecutar como: **tu cuenta**.
   - Acceso: **Cualquier usuario** (el frontend es público y no autentica).
4. Copia la URL `.../exec` resultante en `assets/js/webhook.js` → `WEBHOOK_URL`.
5. Verifica visitando esa URL en el navegador: debe responder un JSON con
   `"status": "ok"` (esto ejecuta `doGet`, no crea filas).

## Notas de seguridad

- Al no requerir login, cualquier persona con la URL de la Web App podría
  enviar datos directamente (sin pasar por el frontend). Para un proyecto
  escolar esto suele ser un riesgo aceptable, pero si se requiere más
  control se puede añadir una clave compartida simple (`payload.token`)
  validada en `validatePayload_`.
- Apps Script no soporta encabezados CORS personalizados con preflight;
  por eso el frontend envía `Content-Type: text/plain` (ver `webhook.js`).
