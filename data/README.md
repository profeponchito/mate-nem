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
│   └── 1S-B1-PDA01-S1.json … 1S-B1-PDA07-S7.json   (49 tarjetas)
├── grado-2/
│   ├── index.json
│   └── 2S-B1-PDA01-S1.json … 2S-B1-PDA06-S7.json   (42 tarjetas)
├── grado-3/
│   ├── index.json
│   └── 3S-B1-PDA01-S1.json … 3S-B1-PDA04-S7.json   (28 tarjetas)
└── ejercitate/
    ├── index.json
    └── EJ-01.json … EJ-36.json               (36 temas)
```

Desde el Paso 15, cada carpeta `grado-N/` no contiene ya los 7/6/4 PDAs
"monolíticos" originales (uno por Contenido/PDA oficial, con sus 7
subtemas dentro), sino **una tarjeta de camino por cada subtema** de esos
PDAs — ver "Tarjetas divididas de camino" más abajo para el detalle
completo de por qué y cómo. `data/ejercitate/` no cambió: sigue con sus 36
temas de 4 subtemas cada uno.

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

Un PDA curricular de origen se identifica como
`<grado>S-B<bloque/trimestre>-PDA<consecutivo>`, por ejemplo `2S-B1-PDA03`
= 2° de secundaria, bloque/trimestre 1, PDA número 3. Ese id ya **no**
corresponde a un archivo: desde el Paso 15, cada uno de sus subtemas es su
propia tarjeta, con id `<id del PDA de origen>-S<consecutivo del subtema>`
— por ejemplo `2S-B1-PDA03-S5` es la tarjeta del 5.º subtema (el primero de
repaso) del PDA `2S-B1-PDA03`. Ese id compuesto es también el nombre de
archivo (`2S-B1-PDA03-S5.json`) y el campo `id` dentro del JSON.
`cargarPDAporId` (`pda-loader.js`) busca el archivo por coincidencia de
prefijo (`startsWith`), por eso el sufijo `-S<n>` (1-7, un solo dígito) no
genera ambigüedad entre tarjetas del mismo PDA de origen.

## Numeración de temas y subtemas

Cada tarjeta tiene un campo `numero` (entero) — el número de tema **dentro
de su grado**, en el orden en que aparece en `index.json`: 1 a 49 en 1°, 1
a 42 en 2°, 1 a 28 en 3° (recorriendo los PDAs de origen en orden y, dentro
de cada uno, sus 7 subtemas en orden). `app.js` lo muestra como "Tema N."
antes del título en la lista de tarjetas y en la problematización.

El único `subtema` dentro de cada tarjeta conserva su campo `numero`
(string) **del PDA de origen**, formato jerárquico `<numero del PDA de
origen>.<consecutivo>` — por ejemplo `3.2` es el subtema Intermedio del
PDA de origen número 3 (no de la tarjeta, que tiene su propio `numero`
global distinto). Se conserva a propósito: deja ver de un vistazo de qué
PDA/Contenido oficial de la NEM viene cada tarjeta, aunque ahora se
recorra como una parada independiente del camino. Si el subtema es de
repaso, su número sigue desde `.5` (`3.5`, `3.6`, `3.7`) como antes.

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

## Estructura de un PDA (v5)

Cada PDA sigue este flujo lineal, que es el que recorre `app.js` mostrando
una barra de avance (%) en todo momento:

- **problematizacion** → desafío o contexto real que engancha al alumno antes
  de explicar el tema (contexto + pregunta).
- **subtemas** (arreglo, mínimo 1, de menor a mayor dificultad) → el tema
  explicado a profundidad, dividido en niveles "núcleo": Introductorio,
  Intermedio, Avanzado y Síntesis (el 4.º subtema es una síntesis/aplicación
  de todo el tema, no un tema nuevo). Cada subtema tiene `titulo`,
  `explicacion`, `ejemplos` (uno o más resueltos) y, opcionalmente,
  `formula` — y es, a la vez, su propia **mini-actividad calificada**:
  `puntosPorReactivo`, `estrellasMax` y un arreglo `reactivos` de **5 o 10**
  preguntas (múltiplo de 5 — ver "Rondas de actividad" abajo). Cada subtema se califica de forma
  **independiente** (su propio resultado: correctas/total, puntaje,
  estrellas) y, al terminar todos, `app.js` calcula además un **resultado
  GLOBAL** (suma de todos los mini-resultados vía `combinarResultados()` en
  `gamification.js`), que es el que alimenta la constancia final. Un PDA
  curricular por grado trae 4-7 subtemas (ver "Subtemas de repaso" abajo);
  una tarjeta dividida de camino (Paso 15, ver sección dedicada) trae
  exactamente 1.

  **Subtemas de repaso (opcionales, Paso 14):** un PDA "completo" puede
  tener hasta 3 subtemas adicionales después de los 4 núcleo (`maxItems: 7`
  en el schema), numerados `<N>.5`, `<N>.6`, `<N>.7`. No introducen
  contenido nuevo — repasan lo ya visto en los 4 anteriores, con ejercicios
  usando números/escenarios distintos — pero se califican igual que
  cualquier otro subtema y cuentan para el resultado global. La app los
  distingue en la UI con la etiqueta "Repaso N de R" en vez de "Nivel N de
  4 · <dificultad>" (`nivelChip_` en `app.js`, ver `NIVEL_DIFICULTAD`). Los
  17 PDAs de Trimestre 1 tenían sus 3 subtemas de repaso (7 subtemas cada
  uno, 35 reactivos calificados en total) antes de dividirse en tarjetas
  (Paso 15) — ese contenido de 7 subtemas por PDA es justamente lo que se
  reparte, uno por tarjeta.

  **`nivelEtiqueta` (opcional, Paso 15):** en una tarjeta de un solo
  subtema, `nivelChip_` no puede deducir el nivel real por índice (el único
  subtema del arreglo está siempre en el índice 0, así que daría "Nivel 1
  de 1" sin importar si en realidad es Avanzado o un repaso). Por eso el
  subtema trae su propia `nivelEtiqueta` fija — el mismo texto que hubiera
  mostrado el PDA de origen para esa posición, ej. `"Nivel 3 de 4 ·
  Avanzado"` o `"Repaso 2 de 3"` — y `nivelChip_` la usa tal cual en vez de
  calcularla. Si el campo se omite, se calcula como siempre por
  índice/longitud (así siguen funcionando sin cambios los PDAs de 4-7
  subtemas y los 36 temas de Ejercítate).
- **practicaExtra** (opcional) → arreglo de reactivos adicionales, ungraded
  (no calificados), mostrados en una sección aparte después del resultado
  global del PDA, para quien quiera seguir practicando el mismo tema. No
  afectan el puntaje ni las estrellas de ningún subtema. Cada uno de los 17
  PDAs de origen tenía entre 3 y 4; desde el Paso 15 ese arreglo no se
  reparte ni se duplica entre las 7 tarjetas de un mismo PDA — se conserva
  completo solo en la última (la del subtema "Repaso integral", `.7`), que
  ya funciona como cierre/síntesis de las 7. Las otras 6 tarjetas de ese
  PDA simplemente no traen el campo.
- **Celebración final** (Paso 14, no es parte del JSON — puramente de la
  interfaz) → después de generar la constancia y, si el PDA la tiene, de
  la práctica extra, `app.js` muestra un panel de cierre estilo "nivel
  superado" de videojuego (`panelCelebracion_`): confeti animado, un
  trofeo y un botón para elegir otro tema. No requiere ningún campo nuevo
  en el JSON del PDA.

No existe ya un objeto `reto` a nivel de PDA — se eliminó al pasar de "3
subtemas + 1 reto de 20 preguntas paginado" a "4 subtemas, cada uno con su
propia mini-actividad de 5 preguntas".

En el navegador, cada intento de un subtema baraja el orden de sus
preguntas y el de las opciones dentro de cada pregunta (`variarReactivos_`/
`variarOpciones_` en `app.js`), así que rehacer un subtema no se ve idéntico
la segunda vez — el JSON fuente no necesita (ni debe) tener el orden
"correcto"; el que importa es el que arma `app.js` en cada intento. Este
barajado se repite cada vez que se entra a CUALQUIER ronda de un subtema
(ver "Rondas de actividad" abajo), no solo la primera.

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

Este es el flujo que renderiza `app.js`: problematización → (por cada
subtema: teoría → 5 preguntas → mini-resultado) → resultado GLOBAL (suma de
todos) → práctica extra (opcional, si la tarjeta la incluye) → constancia
(con fecha y hora de generación).

## Tarjetas divididas de camino (Paso 15)

El pedido original era simple: que el recorrido de cada grado se sintiera
más largo, "como si fueran más temarios", pero **sin inventar contenido
nuevo** — solo dividiendo lo que ya existía. La solución: cada uno de los
17 PDAs curriculares (7 subtemas cada uno desde el Paso 14) se partió en 7
tarjetas independientes del camino, una por subtema. El contenido
matemático de cada subtema (`explicacion`, `ejemplos`, `reactivos`) se
reutiliza **exactamente igual** que antes — nada de eso cambió una sola
palabra. Lo único nuevo por tarjeta es una `problematizacion` corta y
propia (1-3 oraciones de contexto real + una pregunta), porque ahora cada
tarjeta se recorre como su propia experiencia completa (problematización →
teoría → actividad → resultado), no como un paso intermedio de un PDA más
grande.

**Resultado:** el camino de cada grado pasó de 7/6/4 paradas a **49 en 1°,
42 en 2° y 28 en 3°** (119 tarjetas en total) — un recorrido mucho más
largo, con el mismo temario de siempre repartido en pasos más pequeños y
concretos, en vez de 4-7 subtemas empujados dentro de un solo PDA.

**Por qué fue posible sin tocar el motor:** desde el Paso 14, `vistaPDA` ya
recorre `pda.subtemas` con `.forEach()` y `combinarResultados()` sencillamente
suma con `.reduce()` — ninguno de los dos asume una cantidad fija de
subtemas, así que un arreglo de un solo elemento funciona sin cambios de
fondo. Solo hicieron falta tres ajustes:

1. **Esquema:** `subtemas.minItems` bajó de 4 a 1.
2. **`nivelEtiqueta`:** una tarjeta de 1 subtema no puede saber por su
   índice (siempre 0) si ese subtema era Introductorio, Avanzado o un
   repaso — así que el subtema trae su propia etiqueta fija (ver
   "Estructura de un PDA" arriba). `nivelChip_` en `app.js` la usa si está
   presente y, si no, calcula como siempre por índice/longitud (así los 36
   temas de Ejercítate y cualquier PDA de 4-7 subtemas futuro no necesitan
   tocarse).
3. **`practicaExtra`:** se conserva completo solo en la última tarjeta de
   cada PDA de origen (la de "Repaso integral", `.7`) en vez de repetirse
   o repartirse en las 7.

**Id, numeración y manifiesto:** el id de cada tarjeta es
`<id del PDA de origen>-S<consecutivo 1-7>` (ver "Convención de nombres e
IDs" arriba); su `numero` es la posición global dentro del camino de su
grado (1-49/42/28, no reinicia por PDA de origen); el `numero` del propio
subtema (`3.2`, `3.5`…) se conserva igual que en el PDA de origen, como
rastro de qué Contenido/PDA oficial de la NEM viene. Los 17 archivos
monolíticos originales (uno por PDA, con sus 7 subtemas adentro) ya no
existen — se reemplazaron por las 119 tarjetas, y cada `index.json` de
`grado-N/` lista únicamente esas 119 (repartidas 49/42/28), ordenadas por
`numero`.

**Autoría de las 119 problematizaciones:** se redactaron con 6 agentes en
paralelo (uno por lote de 2-4 PDAs de origen), cada uno con instrucciones
de variar el escenario real entre las 7 tarjetas de un mismo PDA (para que
no se sientan como el mismo problema repetido 7 veces) y enfocar el
contexto en la habilidad específica de cada subtema, no en el tema general
del PDA completo. Las 119 se validaron después de forma centralizada:
contra el esquema, sin duplicados exactos entre sí (ni de contexto ni de
pregunta, en las 119 completas, no solo dentro de cada lote), y con
verificación de que el contenido de cada subtema (explicación/ejemplos/
reactivos) coincide byte a byte con el del PDA de origen — es decir, que
la división no alteró por accidente ningún reactivo ya existente.

**QA de punta a punta:** las 119 tarjetas + los 36 temas de Ejercítate
(155 en total) están probados con Playwright (`qa-full-sweep-v6.mjs`), que
ahora también verifica que la `nivelEtiqueta` fija de una tarjeta de 1
subtema se muestre tal cual (en vez de la "Nivel 1 de 1" que daría el
cálculo por índice) y que el camino de un grado con hasta 49 nodos
renderice sus `Promise.all` de fetches completos antes de contar los
nodos (se cambió `waitForTimeout` fijo por una espera activa, igual que ya
se hacía para el camino de Ejercítate).

## Rondas de actividad (Paso 16)

El pedido: que cada una de las 119 tarjetas de camino (Paso 15) tuviera un
"paso 4" después del "paso 3" — una segunda pantalla de actividad con 5
reactivos más, distintos de los primeros 5, antes de seguir con el resto
del recorrido (mini-resultado → resultado global → constancia) — y que
tanto la primera como la segunda pantalla barajaran el orden de sus
preguntas (y el de las opciones, si son de opción múltiple) cada vez que
el alumno entra.

**Cómo se implementó:** en vez de tratar la segunda pantalla como un paso
nuevo y distinto, el arreglo `reactivos` de un subtema ahora puede traer
**10** elementos en vez de 5 (`reactivos.maxItems` subió de 5 a 10 en el
esquema). El motor (`vistaPDA` en `app.js`) calcula
`totalPartes = Math.ceil(subtema.reactivos.length / 5)` y genera esa
cantidad de pasos `actividad` consecutivos para el subtema — 1 si tiene 5
reactivos (como siempre), 2 si tiene 10 ("Ronda 1 de 2" / "Ronda 2 de 2",
con esa etiqueta visible junto al nivel). Las respuestas de cada ronda se
guardan en `estado.respuestasParciales` hasta terminar la última ronda del
subtema; ahí se combinan las 10 y se califican **juntas en un solo
mini-resultado** (no dos mini-resultados separados). El botón de envío
dice "Siguiente ronda →" en toda ronda que no sea la última, y "Enviar
respuestas" en la última — igual que antes.

**Por qué es compatible hacia atrás sin tocar Ejercítate:** un subtema de
exactamente 5 reactivos sigue dando `totalPartes = 1`, es decir, el mismo
comportamiento de siempre (una sola pantalla de actividad, sin etiqueta de
ronda visible). Los 36 temas de Ejercítate no se modificaron y siguen así.
Solo las 119 tarjetas de `data/grado-1/2/3/` (las que salieron de la
división del Paso 15, cada una con un único subtema) pasaron de 5 a 10
reactivos.

**Barajado en cada ronda:** el mecanismo de barajado ya existente
(`variarReactivos_`/`variarOpciones_`, ver arriba) no necesitó lógica
nueva — ya se ejecuta cada vez que se construye la vista de una actividad,
así que aplicarlo por ronda (sobre el sub-arreglo de 5 que le toca a esa
ronda, vía el helper `reactivosDeParte_`) cumplió el segundo requisito sin
cambios adicionales.

**Los 595 reactivos nuevos** (119 tarjetas × 5) se redactaron con 9 agentes
en paralelo (agrupados por pares de PDA de origen), cada uno editando
directamente el arreglo `reactivos` de sus archivos vía Python
(`extend()` + `json.dump`) para no arriesgar corromper el resto del JSON.
Se validaron de forma centralizada: 119/119 archivos con exactamente 10
reactivos, 0 errores contra el esquema, 0 duplicados reales (comparando la
firma completa de cada reactivo — tipo + todos sus campos de contenido —
no solo el texto inicial de la pregunta, que producía falsos positivos con
el patrón ya documentado de `relacionar_columnas` con `instruccion`
compartida pero `columnaA`/`columnaB` distintas). `qa-full-sweep-v6.mjs`
se actualizó para recorrer las rondas de cada subtema, verificar la
etiqueta "Ronda N de M" y el texto del botón en cada una, y calificar el
subtema completo contra su total real de reactivos (ya no fijo en 5); las
155 tarjetas/temas pasan de punta a punta (155/155).

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
