# Estructura de datos de los PDAs

Cada Proceso de Desarrollo de Aprendizaje (PDA) vive en su propio archivo
JSON, agrupado por grado escolar. El Trimestre 1 completo (eje "Sentido
numérico y pensamiento algebraico") ya está construido para los 3 grados, y
además hay un apartado independiente de práctica libre ("Ejercítate") con
40 temas — ver la sección dedicada más abajo:

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
    └── EJ-01.json … EJ-40.json               (40 temas)
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

## Apartado "Ejercítate" (40 temas de práctica libre) — completo

Independiente de los PDAs por grado, "Ejercítate" es un apartado de
práctica libre con **40 temas** de matemáticas de secundaria, agrupados en
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
`avanzado`, `estadistica` — es un enum cerrado en el esquema, no admite
categorías nuevas), que la pantalla de Ejercítate usa para agrupar los 40
temas en **4 mini-caminos** (uno por categoría, cada uno con su propio
encabezado y su propio trazo serpenteante), en vez de un solo camino plano
de 40 nodos.

### Los 36 temas originales del docente + 4 temas de algoritmos (Paso 17) — numeración actual (Paso 18)

Los 36 temas que definió el docente originalmente y los 4 temas de
algoritmos agregados después (Paso 17) están numerados de forma
**contigua por categoría** desde el Paso 18 — ver "Por qué se renumeraron"
más abajo si buscas la numeración anterior (37-40) usada solo entre el
Paso 17 y el Paso 18:

**Básicos (1-14):** Números naturales y enteros · Operaciones básicas (suma,
resta, multiplicación y división) · Jerarquía de operaciones · Múltiplos y
divisores · Máximo Común Divisor (MCD) · Mínimo Común Múltiplo (MCM) ·
Fracciones: concepto y tipos · Fracciones equivalentes · Suma y resta de
fracciones · Decimales y su relación con fracciones · **Completar dígitos
del algoritmo de la suma y resta** (EJ-11) · **Suma y resta de números con
signo** (EJ-12) · **Completar dígitos del algoritmo de la multiplicación y
división** (EJ-13) · **Completar dígitos del algoritmo de la
multiplicación y división con decimales** (EJ-14).

**Intermedios (15-24):** Números racionales e irracionales · Potencias y
raíces · Leyes de los exponentes · Proporcionalidad directa ·
Proporcionalidad inversa · Razones y proporciones · Porcentajes y
aplicaciones en la vida diaria · Expresiones algebraicas · Monomios y
polinomios · Perímetro y área de figuras planas.

**Avanzados (25-34):** Ecuaciones de primer grado · Sistemas de ecuaciones ·
Plano cartesiano · Funciones lineales · Gráficas y su interpretación ·
Congruencia de triángulos · Semejanza de triángulos · Teorema de Tales ·
Teorema de Pitágoras · Volumen y área de cuerpos geométricos.

**Estadística y probabilidad (35-40):** Población y muestra · Tablas de
frecuencia · Gráficas (barras, circulares y lineales) · Media, mediana y
moda · Probabilidad simple · Experimentos aleatorios.

Los 36 temas originales (864 reactivos: 720 calificados + 144 de práctica
extra) están validados contra `pda.schema.json`, revisados uno por uno con
el flujo completo en Playwright (`qa-full-sweep-v6.mjs`), y pasados por un
escáner de duplicados semánticos. Los 4 temas de algoritmos (EJ-11 a
EJ-14) se describen en la sección "Paso 18" más abajo, junto con el nuevo
formato de reactivo que usan.

### Por qué se renumeraron (Paso 18)

Al agregar los 4 temas de algoritmos en el Paso 17, se les dio `numero`
37-40 (para no reordenar nada) — pero como los 4 son de categoría
`basico`, dentro del mini-camino "Temas básicos" quedaban pegados después
del 10 con un salto directo a 37, mientras las demás categorías seguían
en 11-20/21-30/31-36. El docente pidió que la numeración fuera contigua.
Se corrigió así: los 4 temas de algoritmos pasaron a `numero` 11-14
(justo después de los 10 básicos originales), y los demás 26 temas
recorrieron su `numero` original **+4** para dejarles el espacio:
intermedios 11-20 → 15-24, avanzados 21-30 → 25-34, estadística 31-36 →
35-40. El resultado: los 40 temas quedan numerados 1-40 sin huecos ni
saltos, con cada categoría en un bloque contiguo.

**Qué cambió exactamente:** en cada uno de los 40 archivos, el campo
`numero` de nivel superior y el prefijo del campo `numero` de cada
subtema (ej. `"37.1"` → `"11.1"`) se recalcularon con la tabla de arriba;
el archivo se renombró (`EJ-37.json` → `EJ-11.json`, etc., desplazando los
demás) y el campo `id` se actualizó para que siga coincidiendo con el
nombre de archivo (`cargarPDAporId` busca por `startsWith` del `id`). El
contenido matemático de cada tema (título, problematización, subtemas,
reactivos) **no cambió** por la renumeración — es un reordenamiento puro.
`data/ejercitate/index.json` se reconstruyó para listar los 40 archivos en
el nuevo orden numérico.

## Paso 18: nuevo tipo de reactivo `algoritmo_columnas` y rediseño visual de los 3 temas de algoritmos

El docente compartió imágenes de hojas de ejercicios de cuaderno
("Resuelve las sumas y completa los espacios en blanco", "Encuentra las
cifras a colocar en los casilleros para que las sustracciones sean
correctas") y pidió que las actividades de evaluación de los 4 temas de
algoritmos usaran ese mismo diseño: el algoritmo vertical dibujado con
casillas vacías para los dígitos que faltan, en vez de una frase de texto
describiendo el paso.

### El nuevo tipo de reactivo

Se agregó un 5.º tipo de reactivo al esquema (`data/schema/pda.schema.json`,
`definitions.pregunta`), `algoritmo_columnas`:

```json
{
  "tipo": "algoritmo_columnas",
  "operacion": "suma",
  "filas": [
    { "valor": "267", "signo": "+" },
    { "valor": "158", "signo": "+" },
    { "valor": "425", "esResultado": true }
  ],
  "ocultos": [[1], [0, 2], [0]],
  "retroalimentacion": "267 + 158 = 425: en las unidades 7+8=15..."
}
```

- `filas`: cada fila del algoritmo vertical, de arriba hacia abajo (los
  operandos, y en una multiplicación con multiplicador de 2+ cifras
  también sus productos parciales, seguidos de la fila `esResultado`).
  Todas se alinean a la derecha automáticamente.
- `valor`: el número COMPLETO y correcto de esa fila (puede llevar un
  punto decimal). De ahí se derivan tanto los dígitos ya dados como los
  correctos de las casillas vacías — no hay un campo `respuestaCorrecta`
  separado en este tipo.
- `ocultos`: mismo largo que `filas`; para cada fila, la lista de
  posiciones (índice de carácter en `valor`, 0 = el dígito más a la
  izquierda) que se muestran como casilla `<input>` vacía en vez de texto
  ya escrito. El punto decimal nunca se marca como oculto.
- `operacion`: `suma` | `resta` | `multiplicacion` — solo determina el
  texto de apoyo mostrado ("Completa las casillas para que la X sea
  correcta."); la calificación siempre compara dígito por dígito contra
  `valor`, columna por columna, sin importar qué dice `operacion`.

**Motor (`app.js`):** `renderizarAlgoritmoColumnas_` dibuja las filas
alineadas a la derecha (dígitos dados como texto, ocultos como
`<input maxlength="1">`, línea horizontal arriba de la fila `esResultado`);
`leerRespuesta_` junta lo escrito en cada casilla (por fila/columna) y
devuelve `null` si falta alguna; `esRespuestaCorrecta` (`gamification.js`)
compara cada casilla oculta contra el dígito real de `valor` en esa
posición — todas deben coincidir para que el reactivo cuente como
correcto. El barajado de posición del reactivo dentro del subtema (Paso
11) sigue aplicando igual que a cualquier otro tipo; el contenido interno
del reactivo (qué casillas están ocultas) no se baraja, es fijo por
diseño (igual que `llenar_frase` o `verdadero_falso`).

**QA (`qa-full-sweep-v6.mjs`):** como el texto de apoyo genérico
("Completa las casillas para que la suma sea correcta.") se repite entre
varios reactivos de la misma operación dentro de un subtema, la
identificación del reactivo barajado se desambigua con la **firma de las
cifras ya dadas** (las que nunca se ocultan ni se barajan) — mismo
principio que ya se usaba para `relacionar_columnas` (columnaA) y
`opcion_multiple` (conjunto de opciones).

### División representada como verificación por multiplicación

El esquema de `algoritmo_columnas` no incluye una operación `division`
porque el algoritmo de la división larga no tiene la misma relación
directa "columna por columna" entre operandos y resultado que sí tienen
suma, resta y multiplicación (los dígitos del cociente no se alinean con
los del dividendo de forma posicional simple) — intentar forzarlo hubiera
significado un widget genuinamente distinto, no una variación del mismo.

En vez de eso, los reactivos "de división" de EJ-13 y EJ-14 muestran la
**multiplicación que verifica la división** (cociente × divisor =
dividendo), con `operacion: "multiplicacion"` y la aclaración explícita
en `retroalimentacion` (ej. *"Esto verifica que 156 ÷ 4 = 39, porque 39 ×
4 = 156."*). Es una simplificación deliberada, no un intento fallido de
dibujar la división — comprobar una división multiplicando el cociente
por el divisor es una técnica válida y común en la escuela.

### Los 3 temas rediseñados (EJ-11, EJ-13, EJ-14) — EJ-12 se queda en prosa

**EJ-11 (suma y resta)** y **EJ-13/EJ-14 (multiplicación y división,
entero y decimal)** se reescribieron por completo: sus 20 reactivos
calificados + 4 de práctica extra (24 por tema, 72 en total) ahora son
`algoritmo_columnas`. **EJ-12 (números con signo) se dejó tal como estaba
en el Paso 17**, en el formato de prosa (`llenar_frase`/`opcion_multiple`/
etc.) — no tiene un "algoritmo vertical" que dibujar (no hay acarreos ni
préstamos en la regla de signos), así que el nuevo widget no le
correspondía; forzarlo ahí no habría representado nada real.

Progresión de dificultad conservada en los 3 temas rediseñados
(Introductorio/Intermedio/Avanzado/Síntesis, ver los propios archivos para
el detalle exacto de cada subtema):
- **EJ-11**: de sumas/restas de 2 cifras con 1 acarreo/préstamo, hasta
  restas de 5-6 cifras con préstamo encadenado a través de varios ceros.
- **EJ-13**: de multiplicación por 1 dígito (y su verificación de división
  correspondiente), hasta multiplicador/divisor de 2 cifras con productos
  parciales.
- **EJ-14**: igual que EJ-13 pero con decimales — los productos parciales
  se escriben como enteros sin punto (el corrimiento de posición ya
  incluido en el valor) y el punto decimal se coloca solo en la fila
  final, contando las cifras decimales de los factores originales — así
  es como se hace el algoritmo en papel.

**Autoría:** 3 agentes en paralelo, uno por archivo, cada uno con el
formato exacto documentado arriba, 2 ejemplos completos ya resueltos
(incluido el caso de productos parciales con corrimiento), y la
instrucción de verificar la aritmética de cada reactivo con
`decimal.Decimal` de Python (nunca `float`, para evitar errores de
redondeo en los decimales) antes de fijar las posiciones ocultas.

**Validación centralizada** (independiente de la de cada agente): 72/72
reactivos con aritmética correcta (suma/resta/multiplicación, y en los de
5 filas también que los productos parciales sumen exactamente al
resultado), 0 errores de esquema, ninguna fila con el 100% de sus dígitos
ocultos, entre 2 y 7 casillas ocultas por reactivo, el punto decimal
nunca marcado como oculto, y 0 duplicados reales introducidos al
comparar contra el resto del banco (159 archivos) por firma completa de
contenido. Probado de punta a punta con Playwright junto con el resto del
banco: **159/159**.

## Paso 19: corrección de `algoritmo_columnas` — casillas únicamente resolubles ("criptogramas")

El docente compartió 5 hojas de trabajo reales de la web (liveworksheets.com)
tituladas explícitamente "Criptograma de suma/resta/multiplicación" y pidió
que los 3 temas de algoritmos (`EJ-11`, `EJ-13`, `EJ-14`) del Paso 18 se
corrigieran con ese mismo diseño. Analizando las imágenes se confirmó que
un "criptograma numérico" (término usado en material escolar de habla
hispana, sobre todo en Perú) **es exactamente el mismo mecanismo que
`algoritmo_columnas`** — el algoritmo vertical con casillas vacías — así
que no hizo falta ningún tipo de reactivo nuevo ni cambio de motor
(`app.js`/`gamification.js` no se tocaron en este paso).

### El bug real que las imágenes dejaron ver

Comparando el diseño de las imágenes de referencia contra el contenido ya
generado en el Paso 18, se detectó un problema de fondo: en varios
reactivos, **dos celdas de la misma columna** del algoritmo estaban
ocultas a la vez (por ejemplo, la cifra de las decenas de un sumando Y la
cifra de las decenas del resultado, ambas ocultas en el mismo reactivo).
Aritméticamente, una columna con dos incógnitas y una sola ecuación
(`cifra_A + cifra_B + acarreo = cifra_resultado`) no tiene una solución
única — un alumno podía completar las casillas con una combinación
distinta a la registrada como correcta y aun así ser matemáticamente
consistente con lo que se veía en pantalla, pero el motor lo habría
calificado como error. Se confirmó el mismo problema en las
multiplicaciones (`EJ-13`/`EJ-14`): columnas con la cifra del
multiplicando Y la cifra correspondiente del resultado ocultas a la vez.
En las imágenes de referencia, en cambio, **cada columna del algoritmo
tiene como máximo una casilla vacía** — es lo que garantiza que el
alumno pueda deducir cada cifra con aritmética pura, sin adivinar.

### La corrección

Se escribió un script de verificación/corrección que, para cada reactivo
de `EJ-11`/`EJ-13`/`EJ-14` (calificados y de práctica extra — 84 en
total), reconstruye las "columnas" del algoritmo según el tipo de
operación:
- **Suma/resta**: una sola ecuación por columna entre los 2 operandos y
  el resultado.
- **Multiplicación de 1 cifra**: una ecuación por columna entre el
  multiplicando y el resultado (el multiplicador, al ser un solo dígito
  reutilizado en todas las columnas, nunca se oculta — igual que en las
  imágenes de referencia, donde el operador siempre está dado).
- **Multiplicación de 2 cifras (productos parciales)**: tres ecuaciones
  encadenadas — multiplicando×unidades del multiplicador = producto
  parcial 1; multiplicando×decenas del multiplicador = producto parcial 2
  (con su corrimiento); producto parcial 1 + producto parcial 2 =
  resultado. El multiplicador tampoco se oculta nunca.

Donde una columna tenía más de una celda oculta, el script conservó solo
una (revelando las demás) siguiendo un orden de prioridad fijo, sin tocar
los números originales del reactivo (`filas`) ni su `retroalimentacion` —
es una corrección quirúrgica de **qué** se oculta, no de la aritmética ni
de la narrativa pedagógica. También se detectó y corrigió que algunos
reactivos de multiplicación de 2 cifras tenían el propio multiplicador
parcialmente oculto (rompiendo la regla anterior); en esos casos se
revelaron sus cifras.

**Resultado de la corrección**: 75 celdas en conflicto resueltas en total
(16 en `EJ-11`, 29 en `EJ-13`, 30 en `EJ-14`). Tras la corrección, 5
reactivos de `EJ-14` quedaron con muy pocas casillas (algunos con solo 1,
por ser verificaciones de división con decimales donde el resultado
simplifica ceros finales — p. ej. `15 × 0.4 = 6` en vez de `= 6.0` — un
caso donde el modelo de "columnas" no aplica igual porque el resultado
tiene menos dígitos que el multiplicando). Se enriquecieron esos 5 casos
agregando casillas en columnas que habían quedado sin ninguna oculta,
verificando en cada caso que la solución seguía siendo única (en los 2
casos de "resultado con ceros simplificados", ocultando el multiplicando
completo en vez de un solo dígito, porque ahí la ecuación es una división
directa con solución real única, no una cadena de columnas modulares).

Se verificó el resultado final con un script independiente: **0
columnas con más de una casilla oculta** en los 72 reactivos de los 3
temas (228 casillas ocultas en total, entre 1 y 6 por reactivo), 0
errores de esquema, y el mismo resultado de siempre en el resto del
contenido (numeros y `retroalimentacion` sin cambios). Probado de punta a
punta con Playwright junto con el resto del banco: **159/159**.

### Extensión a otro tema ("si es posible en otras actividades")

El pedido incluía, de forma condicional, extender el estilo de
criptograma a otras actividades donde aplicara. Ningún otro tema de
Ejercítate tiene una estructura de "algoritmo escrito verticalmente"
como para justificar un rediseño completo, pero **`EJ-02` (Operaciones
básicas)** sí encaja de forma natural como bonus: se agregaron 2
reactivos `algoritmo_columnas` (una suma de 3 cifras, una multiplicación
por 1 dígito) a su `practicaExtra` — contenido opcional y no calificado,
sin tocar los 20 reactivos calificados existentes de ese tema. Ambos
verificados con el mismo criterio de "una sola casilla oculta por
columna".
