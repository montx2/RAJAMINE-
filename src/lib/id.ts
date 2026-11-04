export function uid(prefix = ''): string {
  const core = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${core}` : core;
}

/** Hash simples (djb2) para código de verificação de documentos — NÃO é medida criptográfica. */
export function verifyCode(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).toUpperCase().padStart(8, '0');
}
