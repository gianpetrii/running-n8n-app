/**
 * Estrategia de imagen (sin borrar marcas de terceros ni inpainting).
 *
 * 1. Por defecto se prefiere `og:image` de la página del evento (suele ser
 *    imagen amplia tipo RRSS, distinta del thumb 150×150 del listado).
 * 2. Si no hay OG, se usa la del listado y se intenta quitar el sufijo
 *    WordPress `-150x150` para obtener el JPEG base (más píxeles; no quita overlay).
 * 3. Quitar logos con crop/IA queda fuera de alcance (riesgo legal / ToS).
 */
export type ImageSource = "og" | "listing";

export function upsizeWordPressThumb(url: string): string {
  return url.replace(/-\d+x\d+(\.(jpe?g|png|webp|gif))$/i, "$1");
}

export function pickFinalImageUrl(options: {
  ogImageUrl: string | null;
  listingImageUrl: string | null;
  preferOg: boolean;
}): { url: string; source: ImageSource } {
  const { ogImageUrl, listingImageUrl, preferOg } = options;
  if (preferOg && ogImageUrl) {
    return { url: ogImageUrl, source: "og" };
  }
  if (listingImageUrl) {
    return { url: upsizeWordPressThumb(listingImageUrl), source: "listing" };
  }
  if (ogImageUrl) {
    return { url: ogImageUrl, source: "og" };
  }
  return { url: "", source: "listing" };
}
