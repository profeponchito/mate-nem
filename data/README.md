# Estructura de datos de los PDAs

Cada Proceso de Desarrollo de Aprendizaje (PDA) vive en su propio archivo
JSON, agrupado por grado escolar:

```
data/
├── schema/
│   └── pda.schema.json     # Esquema formal (JSON Schema draft-07)
├── grado-1/
│   └── index.json          # Manifiesto: qué archivos .json existen en esta carpeta
├── grado-2/
│   ├── index.json
│   └── 2S-B1-PDA03.json     # Ejemplo funcional ya incluido
└── grado-3/
    └── index.json
```

## ¿Por qué un `index.json` por grado?

GitHub Pages sirve archivos estáticos: no hay backend que pueda "listar"
el contenido de una carpeta. Por eso cada carpeta `grado-X/` incluye un
`index.json` con la lista de archivos PDA disponibles. `pda-loader.js`
(próximo paso del frontend) leerá primero ese manifiesto y después hará
`fetch` de cada PDA individual.

## Convención de nombres e IDs

`<grado>S-B<bloque/trimestre>-PDA<consecutivo>`, por ejemplo `2S-B1-PDA03`
= 2° de secundaria, bloque/trimestre 1, PDA número 3. El mismo valor se
usa como nombre de archivo y como campo `id` dentro del JSON.

## Cómo agregar un PDA nuevo

1. Copia `grado-2/2S-B1-PDA03.json` como plantilla.
2. Completa los campos siguiendo `schema/pda.schema.json`
   (puedes validar con cualquier validador de JSON Schema online).
3. Reemplaza `contenido` y `pda` con el enunciado oficial del fascículo
   NEM correspondiente — los textos de `problematizacion`, `sintesis` y
   `actividad` son responsabilidad del docente y deben mantener el
   enfoque situacional/activo característico de la NEM.
4. Agrega el nombre del archivo al arreglo `archivos` en el `index.json`
   de esa carpeta de grado.

## Las tres fases obligatorias

- **problematizacion** → desafío o contexto real (fase A).
- **sintesis** → explicación teórica breve, con fórmula y ejemplo resuelto (fase B).
- **actividad** → reto gamificado con reactivos, puntaje y estrellas (fase C).

Este orden es el que renderizará `pda-loader.js` en el siguiente paso del
proyecto (navegación PDA → problematización → síntesis → actividad → constancia).
