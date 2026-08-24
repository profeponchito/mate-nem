# Estructura de datos de los PDAs

Cada Proceso de Desarrollo de Aprendizaje (PDA) vive en su propio archivo
JSON, agrupado por grado escolar. El Trimestre 1 completo (eje "Sentido
numérico y pensamiento algebraico") ya está construido para los 3 grados, y
además hay un apartado independiente de práctica libre ("Ejercítate") con
36 temas — ver la sección dedicada más abajo:

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
├── grado-3/
│   ├── index.json
│   └── 3S-B1-PDA01.json … 3S-B1-PDA04.json   (4 PDAs)
└── ejercitate/
    ├── index.json
    └── EJ-01.json … EJ-36.json               (36 temas)
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
es el segundo subtema (nivel Intermedio) del Tema 3. Se muestra junto al
título del subtema, en su mini-actividad y en su mini-resultado. Si el PDA
tiene subtemas de repaso opcionales (ver más abajo), continúan la
numeración desde `.5` (`3.5`, `3.6`, `3.7`).

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

## Estructura de un PDA (v4)

Cada PDA sigue este flujo lineal, que es el que recorre `app.js` mostrando
una barra de avance (%) en todo momento:

- **problematizacion** → desafío o contexto real que engancha al alumno antes
  de explicar el tema (contexto + pregunta).
- **subtemas** (arreglo, mínimo 4, de menor a mayor dificultad) → el tema
  explicado a profundidad, dividido en 4 niveles "núcleo": Introductorio,
  Intermedio, Avanzado y Síntesis (el 4.º subtema es una síntesis/aplicación
  de todo el tema, no un tema nuevo). Cada subtema tiene `titulo`,
  `explicacion`, `ejemplos` (uno o más resueltos) y, opcionalmente,
  `formula` — y es, a la vez, su propia **mini-actividad calificada**:
  `puntosPorReactivo`, `estrellasMax` y un arreglo `reactivos` de
  **exactamente 5** preguntas. Cada subtema se califica de forma
  **independiente** (su propio resultado: correctas/total, puntaje,
  estrellas) y, al terminar todos, `app.js` calcula además un **resultado
  GLOBAL** (suma de todos los mini-resultados vía `combinarResultados()` en
  `gamification.js`), que es el que alimenta la constancia final.

  **Subtemas de repaso (opcionales, Paso 14):** un PDA puede tener hasta 3
  subtemas adicionales después de los 4 núcleo (`maxItems: 7` en el
  schema), numerados `<N>.5`, `<N>.6`, `<N>.7`. No introducen contenido
  nuevo — repasan lo ya visto en los 4 anteriores, con ejercicios usando
  números/escenarios distintos — pero se califican igual que cualquier otro
  subtema y cuentan para el resultado global. La app los distingue en la UI
  con la etiqueta "Repaso N de R" en vez de "Nivel N de 4 · <dificultad>"
  (`nivelChip_` en `app.js`, ver `NIVEL_DIFICULTAD`). Los 17 PDAs actuales
  de Trimestre 1 ya tienen sus 3 subtemas de repaso (7 subtemas cada uno,
  35 reactivos calificados en total por PDA).
- **practicaExtra** (opcional) → arreglo de reactivos adicionales, ungraded
  (no calificados), mostrados en una sección aparte después del resultado
  global del PDA, para quien quiera seguir practicando el mismo tema. No
  afectan el puntaje ni las estrellas de ningún subtema. Los 17 PDAs
  actuales incluyen entre 3 y 4 cada uno.
- **Celebración final** (Paso 14, no es parte del JSON — puramente de la
  interfaz) → después de generar la constancia y, si el PDA la tiene, de
  la práctica extra, `app.js` muestra un panel de cierre estilo "nivel
  superado" de videojuego (`panelCelebracion_`): confeti animado, un
  trofeo y un botón para elegir otro tema. No requiere ningún campo nuevo
  en el JSON del PDA.

No existe ya un objeto `reto` a nivel de PDA — se eliminó al pasar de "3
subtemas + 1 reto de 20 preguntas paginado" a "4 subtemas, cada uno con su
propia mini-actividad de 5 preguntas".

En el navegador, cada intento de un subtema baraja el orden de sus 5
preguntas y el de las opciones dentro de cada pregunta (`variarReactivos_`/
`variarOpciones_` en `app.js`), así que rehacer un subtema no se ve idéntico
la segunda vez — el JSON fuente no necesita (ni debe) tener el orden
"correcto"; el que importa es el que arma `app.js` en cada intento.

Cada pantalla del recorrido muestra un título claro y una explicación antes
de la parte interactiva: la problematización usa `pda.titulo` y su propio
`contexto` (redactado de forma sencilla, como gancho); cada subtema usa su
`titulo` y `explicacion` antes de sus 5 preguntas.

### Los 4 tipos de pregunta

Los `reactivos` de cada subtema (y los de `practicaExtra`) usan la misma
estructura de pregunta (`definitions.pregunta` en el schema), con `tipo`
igual a uno de estos 4 valores:

- `opcion_multiple` — `pregunta`, `opciones[]`, `respuestaCorrecta` (índice).
- `verdadero_falso` — `enunciado`, `respuestaCorrecta` (booleano).
- `llenar_frase` — `frase` (con un hueco marcado `___`), `respuestaCorrecta` (texto).
- `relacionar_columnas` — `instruccion`, `columnaA[]`, `columnaB[]`,
  `parejasCorrectas[]` (índice en `columnaB` de la pareja de cada fila de
  `columnaA`; usa valores únicos en `columnaB` para que no haya ambigüedad).

Todas requieren `retroalimentacion` (se muestra tras responder, sea correcta
o no).

**Importante al redactar los 5 reactivos de un mismo subtema:** aunque
varios reactivos compartan un enunciado "plantilla" (por ejemplo, cuatro
`relacionar_columnas` con la misma instrucción, o varios `opcion_multiple`
con la misma pregunta pero distintos números), cada uno debe representar
contenido genuinamente distinto — mismo texto de pregunta/instrucción está
bien, pero los datos concretos (números, opciones, pares correctos) deben
diferir. Dos reactivos idénticos en el mismo subtema hacen que el alumno
vea, en los hechos, la misma pregunta dos veces dentro de una actividad de
solo 5 preguntas.

Este es el flujo que renderiza `app.js`: problematización → (por cada uno
de los 4 subtemas: teoría → 5 preguntas → mini-resultado) → resultado
GLOBAL (suma de los 4) → práctica extra (opcional, si el PDA la incluye) →
constancia (con fecha y hora de generación).

## Apartado "Ejercítate" (36 temas de práctica libre) — completo

Independiente de los PDAs por grado, "Ejercítate" es un apartado de
práctica libre con **36 temas** de matemáticas de secundaria, agrupados en
4 categorías, disponible para cualquier alumno sin importar su grado. Cada
tema sigue exactamente la misma dinámica que un PDA (problematización → 4
subtemas de menor a mayor dificultad, cada uno con su propia mini-actividad
calificada de 5 reactivos → resultado global → práctica extra → constancia)
y no bloquea ni pertenece a la ruta curricular de ningún grado en
particular: el docente puede pedir cualquier tema, a cualquier alumno, en
cualquier momento.

### El "pseudo-grado" `ejercitate`

Técnicamente, Ejercítate reutiliza el 100% del motor de PDAs: en vez de
crear un sistema paralelo, `'ejercitate'` se trata como un **grado
sintético** que fluye por exactamente las mismas rutas, carga de datos y
vistas que un grado real (`#/pda-lista/:grado`, `#/pda/:grado/:id`,
`vistaListaPDA`, `vistaPDA`, gamificación, webhook, constancia). Solo
difiere en dos puntos, ambos ya resueltos en el código:

- **Carpeta de datos:** `pda-loader.js` resuelve `'ejercitate'` a la
  carpeta `data/ejercitate/` en vez de `data/grado-N/` (función
  `carpetaDeGrado_`).
- **Color y etiqueta:** `app.js` usa `COLOR_EJERCITATE` (paleta "Aula NEM",
  tono grafito) en vez del color del grado, y muestra la etiqueta
  "Ejercítate" en vez de "N° de secundaria" (`temaGrado_`/`etiquetaGrado_`).

El campo `grado` dentro del JSON de cada tema es literalmente el string
`"Ejercítate"` (con acento) — así lo exige `pda.schema.json` — y cada
archivo agrega además el campo `categoria` (uno de `basico`, `intermedio`,
`avanzado`, `estadistica`), que la pantalla de Ejercítate usa para agrupar
los 36 temas en **4 mini-caminos** (uno por categoría, cada uno con su
propio encabezado y su propio trazo serpenteante), en vez de un solo camino
plano de 36 nodos.

### Los 36 temas

Numerados 1-36 (`numero` en el JSON, también usado en el nombre de archivo
`EJ-01.json`…`EJ-36.json` y en el campo `id`), en el orden y con los textos
exactos que definió el docente:

**Básicos (1-10):** Números naturales y enteros · Operaciones básicas (suma,
resta, multiplicación y división) · Jerarquía de operaciones · Múltiplos y
divisores · Máximo Común Divisor (MCD) · Mínimo Común Múltiplo (MCM) ·
Fracciones: concepto y tipos · Fracciones equivalentes · Suma y resta de
fracciones · Decimales y su relación con fracciones.

**Intermedios (11-20):** Números racionales e irracionales · Potencias y
raíces · Leyes de los exponentes · Proporcionalidad directa ·
Proporcionalidad inversa · Razones y proporciones · Porcentajes y
aplicaciones en la vida diaria · Expresiones algebraicas · Monomios y
polinomios · Perímetro y área de figuras planas.

**Avanzados (21-30):** Ecuaciones de primer grado · Sistemas de ecuaciones ·
Plano cartesiano · Funciones lineales · Gráficas y su interpretación ·
Congruencia de triángulos · Semejanza de triángulos · Teorema de Tales ·
Teorema de Pitágoras · Volumen y área de cuerpos geométricos.

**Estadística y probabilidad (31-36):** Población y muestra · Tablas de
frecuencia · Gráficas (barras, circulares y lineales) · Media, mediana y
moda · Probabilidad simple · Experimentos aleatorios.

Los 36 archivos (864 reactivos en total: 720 calificados + 144 de práctica
extra) están validados contra `pda.schema.json`, revisados uno por uno con
el flujo completo en Playwright (`qa-full-sweep-v6.mjs`, que también
verifica el camino agrupado por categoría), y pasados por un escáner de
duplicados semánticos (mismo tipo + mismo contenido matemático real, no
solo texto) para evitar que dos reactivos del mismo subtema sean, en los
hechos, la misma pregunta repetida.
