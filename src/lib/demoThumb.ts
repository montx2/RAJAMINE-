/**
 * Miniatura (360 px, WebP) de uma foto demonstrativa em `/demo/`. As listas e
 * grades mostram a imagem em 64–192 px; baixar o JPEG de ~300 KB para isso é
 * desperdício, principalmente em rede móvel. O original continua sendo usado
 * pelo OCR, pelo PDF e pela visualização ampliada.
 */
export function demoThumb(src: string): string {
  const m = /^\/demo\/([^/]+)\.jpe?g$/i.exec(src);
  return m ? `/demo/thumb/${m[1]}.webp` : src;
}
