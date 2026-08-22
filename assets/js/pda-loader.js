/**
 * MATE-NEM · Carga de PDAs
 * ----------------------------------------------------
 * Lee el manifiesto data/grado-X/index.json y los archivos de PDA
 * individuales vía fetch(). GitHub Pages es hosting estático: no se puede
 * "listar" una carpeta, por eso el manifiesto es la única fuente de verdad
 * de qué PDAs existen en cada grado. Ver data/README.md.
 *
 * Nota: las rutas de fetch() son relativas a la URL del documento
 * (index.html), no al archivo de este módulo — por eso RUTA_DATOS asume
 * que index.html vive en la raíz del repositorio, junto a data/.
 */

const RUTA_DATOS = 'data';

function numeroDeGrado_(grado) {
  return grado.replace('°', '');
}

export async function cargarManifiesto(grado) {
  const respuesta = await fetch(`${RUTA_DATOS}/grado-${numeroDeGrado_(grado)}/index.json`);
  if (!respuesta.ok) throw new Error(`No se encontró el manifiesto de ${grado}`);
  return respuesta.json();
}

export async function cargarPDA(grado, archivo) {
  const respuesta = await fetch(`${RUTA_DATOS}/grado-${numeroDeGrado_(grado)}/${archivo}`);
  if (!respuesta.ok) throw new Error(`No se encontró el PDA ${archivo}`);
  return respuesta.json();
}

/** Devuelve la lista completa de PDAs (ya parseados) de un grado. */
export async function cargarListaPDAs(grado) {
  const manifiesto = await cargarManifiesto(grado);
  return Promise.all(manifiesto.archivos.map((archivo) => cargarPDA(grado, archivo)));
}

/** Busca y carga un PDA específico por su id dentro de un grado. */
export async function cargarPDAporId(grado, id) {
  const manifiesto = await cargarManifiesto(grado);
  const archivo = manifiesto.archivos.find((nombreArchivo) => nombreArchivo.startsWith(id));
  if (!archivo) throw new Error(`El PDA "${id}" no está en el manifiesto de ${grado}`);
  return cargarPDA(grado, archivo);
}
