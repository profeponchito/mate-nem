# Estructura de datos de los PDAs

Cada Proceso de Desarrollo de Aprendizaje (PDA) vive en su propio archivo
JSON, agrupado por grado escolar. El Trimestre 1 completo (eje "Sentido
numérico y pensamiento algebraico") ya está construido para los 3 grados:

```
data/
├── schema/
│   └── pda.schema.json     # Esquema formal (JSON Schema draft-07)
├── grado-1/
│   ├── index.json
│   └── 1S-B1-PDA01.json … 1S-B1-PDA07.json   (7 PDAs)
├── grado-2/
│   ├── index.json
│   └── 2S-B1-PDA01.json … 2S-B1-PDA06.json   (6 PDAs)
└── grado-3/
    ├── index.json
    └── 3S-B1-PDA01.json … 3S-B1-PDA04.json   (4 PDAs)
```

Los contenidos y PDA se basan en el Programa Sintético de la Fase 6 (SEP,
2022) — ver la sección "Fuente curricular" más abajo para el detalle y las
limitaciones de esta transcripción.

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

## Numeración de temas y subtemas

Cada PDA tiene un campo `numero` (entero) — el número de tema **dentro de
su grado**, en el orden en que aparece en `index.json` (1, 2, 3… hasta 7 en
1°, 6 en 2°, 4 en 3°; no es un número global de 1 a 17). `app.js` lo muestra
como "Tema N." antes del título en la lista de PDAs, la problematización y
el reto.

Cada `subtema` dentro de un PDA tiene su propio campo `numero` (string),
con formato jerárquico `<numero del PDA>.<consecutivo>` — por ejemplo `3.2`
es el segundo subtema del Tema 3. Se muestra junto al título del subtema y
de su `check`.

## Fuente curricular

Los 17 PDAs incluidos (Trimestre 1, eje "Sentido numérico y pensamiento
algebraico") se transcribieron a partir de fuentes derivadas del **Programa
Sintético de la Fase 6** (SEP, 2022 — la Fase 6 cubre toda la secundaria).
Un hallazgo importante de la investigación: la SEP define los Contenidos y
PDA a nivel de toda la Fase 6, **no separados oficialmente por grado**; cada
escuela distribuye esos contenidos entre 1°, 2° y 3° en su propio Programa
Analítico. La distribución usada aquí (qué PDA va en qué grado y en qué
trimestre) sigue una dosificación común encontrada en materiales de varias
escuelas NEM — no es la única posible.

**Si tu escuela ya tiene su Programa Analítico** con una distribución
distinta por grado/trimestre, avísame para ajustar los archivos y que
coincidan exactamente con lo que se enseña en tu plantel.

Fuentes consultadas:
- [Programa Sintético de la Fase 6 (SEP)](https://educacionbasica.sep.gob.mx/wp-content/uploads/2024/06/Programa_Sintetico_Fase_6.pdf)
- [Avance del Programa Sintético Fase 6 — Matemáticas (SEP)](https://educacionbasica.sep.gob.mx/wp-content/uploads/2022/12/Avance-Programa-Sintetico-Fase-6.pdf)
- Dosificaciones derivadas (Studocu): 1er grado, y el documento combinado "Matemáticas 1er, 2do y 3er Grado"; 3er grado ("Álgebra y Geometría")

## Cómo agregar un PDA nuevo

1. Copia cualquier archivo existente, por ejemplo `grado-2/2S-B1-PDA03.json`, como plantilla.
2. Completa los campos siguiendo `schema/pda.schema.json`
   (puedes validar con cualquier validador de JSON Schema online).
3. Reemplaza `contenido` y `pda` con el enunciado oficial del fascículo
   NEM correspondiente — los textos de `problematizacion`, `subtemas` y
   `reto` son responsabilidad del docente y deben mantener el enfoque
   situacional/activo característico de la NEM.
4. Agrega el nombre del archivo al arreglo `archivos` en el `index.json`
   de esa carpeta de grado.

## Estructura de un PDA (v3)

Cada PDA sigue este flujo lineal, que es el que recorre `app.js` mostrando
una barra de avance (%) en todo momento:

- **problematizacion** → desafío o contexto real que engancha al alumno antes
  de explicar el tema (contexto + pregunta).
- **subtemas** (arreglo, normalmente 3) → el tema explicado a profundidad,
  seccionado en partes. Cada subtema tiene `titulo`, `explicacion` (más
  desarrollada que una síntesis breve), `ejemplos` (uno o más resueltos) y,
  opcionalmente, `formula`. Puede terminar en un `check`: una pregunta corta
  de repaso formativo (no se califica, solo da retroalimentación inmediata)
  antes de dejar avanzar al alumno.
- **reto** → la actividad final gamificada y calificada. Tiene `sintesis`
  (un recordatorio teórico, a modo de mini-síntesis, que recapitula las
  ideas clave de los subtemas y se muestra antes de los reactivos, solo en
  la primera página), `puntosPorReactivo`, `estrellasMax` y un arreglo
  `reactivos` (los 17 PDAs actuales usan 20, mezclando los 4 tipos de
  pregunta soportados). `app.js` los presenta paginados de 5 en 5 (4
  páginas), con botones "Atrás/Siguiente" que conservan las respuestas ya
  capturadas al navegar entre páginas; el envío y calificación final ocurre
  al terminar la última página.
- **practicaExtra** (opcional) → arreglo de reactivos adicionales, ungraded
  (no calificados), mostrados en una sección aparte después del panel de
  resultado, para quien quiera seguir practicando el mismo tema. No afectan
  el puntaje ni las estrellas del PDA. Los 17 PDAs actuales incluyen entre
  3 y 4 cada uno.

Cada pantalla del recorrido muestra un título claro y una explicación antes
de la parte interactiva: la problematización usa `pda.titulo` y su propio
`contexto` (redactado de forma sencilla, como gancho); cada subtema usa su
`titulo` y `explicacion`; el `check` de un subtema reutiliza el `titulo` y
la `explicacion` de ese mismo subtema como recordatorio antes de la
pregunta (no hace falta escribir nada aparte para eso); y el reto usa
`pda.titulo` y `reto.sintesis` como recordatorio antes de los reactivos.

### Los 4 tipos de pregunta

Tanto los `check` de los subtemas como los `reactivos` del `reto` usan la
misma estructura de pregunta (`definitions.pregunta` en el schema), con
`tipo` igual a uno de estos 4 valores:

- `opcion_multiple` — `pregunta`, `opciones[]`, `respuestaCorrecta` (índice).
- `verdadero_falso` — `enunciado`, `respuestaCorrecta` (booleano).
- `llenar_frase` — `frase` (con un hueco marcado `___`), `respuestaCorrecta` (texto).
- `relacionar_columnas` — `instruccion`, `columnaA[]`, `columnaB[]`,
  `parejasCorrectas[]` (índice en `columnaB` de la pareja de cada fila de
  `columnaA`; usa valores únicos en `columnaB` para que no haya ambigüedad).

Todas requieren `retroalimentacion` (se muestra tras responder, sea correcta
o no).

Este es el flujo que renderiza `app.js`: problematización → subtemas (con
sus checks) → reto → resultado (puntaje, estrellas) → práctica extra
(opcional, si el PDA la incluye) → constancia.

## Apartado "Ejercítate" (operaciones básicas) — en construcción

Independiente de los PDAs por grado, habrá un apartado de práctica libre de
operaciones básicas (suma, resta, multiplicación, división), calificado
igual que un PDA pero sin pertenecer a la ruta curricular de ningún grado
en particular ni bloquear nada. Su manifiesto ya existe en
`data/ejercitate/index.json`, con numeración propia (`E.1`…`E.4`, prefijo
"E" para no confundirse con el número de Tema de un PDA):

- `E.1` Suma
- `E.2` Resta
- `E.3` Multiplicación
- `E.4` División

Cada item apunta a un futuro `data/ejercitate/<id>.json` con la misma
estructura que un PDA (`problematizacion`/`subtemas`/`reto`), todavía por
construir — es parte del rediseño de la interfaz estilo Duolingo que sigue
en curso.
