/*
  Armazenamento local de fotografias enviadas pelo usuário (IndexedDB).
  Metadados ficam no store (localStorage); os bytes ficam aqui.
  Em produção: storage de objetos privado com URLs assinadas (docs/03-arquitetura.md).
*/
import { get, set, del } from 'idb-keyval';
import type { Photo } from '../data/types';

export async function savePhotoBytes(key: string, blob: Blob): Promise<void> {
  await set(key, blob);
}

export async function deletePhotoBytes(key: string): Promise<void> {
  await del(key);
}

const urlCache = new Map<string, string>();

/** Resolve a URL exibível de uma foto (asset público demo ou blob do IndexedDB). */
export async function resolvePhotoUrl(photo: Photo): Promise<string | null> {
  if (photo.origem === 'demo' && photo.src) return photo.src;
  if (!photo.storageKey) return null;
  const cached = urlCache.get(photo.storageKey);
  if (cached) return cached;
  const blob = await get<Blob>(photo.storageKey);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(photo.storageKey, url);
  return url;
}

/** Bytes para embutir no PDF. */
export async function resolvePhotoBytes(photo: Photo): Promise<ArrayBuffer | null> {
  try {
    if (photo.origem === 'demo' && photo.src) {
      const res = await fetch(photo.src);
      if (!res.ok) return null;
      return await res.arrayBuffer();
    }
    if (photo.storageKey) {
      const blob = await get<Blob>(photo.storageKey);
      return blob ? await blob.arrayBuffer() : null;
    }
  } catch {
    return null;
  }
  return null;
}

export const MAX_PHOTO_MB = 8;
export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Validação de upload: tipo declarado + assinatura mágica + tamanho. */
export async function validateImageFile(file: File): Promise<{ ok: boolean; erro?: string; mime?: string }> {
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    return { ok: false, erro: `Arquivo excede o limite de ${MAX_PHOTO_MB} MB.` };
  }
  if (!ACCEPTED_MIME.includes(file.type)) {
    return { ok: false, erro: 'Formato não aceito. Envie JPEG, PNG ou WebP.' };
  }
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  const isWebp = head[8] === 0x57 && head[9] === 0x45 && head[10] === 0x42 && head[11] === 0x50;
  if (!isJpeg && !isPng && !isWebp) {
    return { ok: false, erro: 'O conteúdo do arquivo não corresponde a uma imagem válida.' };
  }
  const mime = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : 'image/webp';
  return { ok: true, mime };
}
