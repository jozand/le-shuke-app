// app/lib/utils/generateId.ts

/**
 * Genera un UUID v4 compatible con todos los navegadores,
 * incluyendo Safari iOS/iPadOS donde crypto.randomUUID()
 * NO está disponible.
 */
export function generateId(): string {
  // Si existe randomUUID nativo, usarlo
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }

  // Safari fallback
  const cryptoObj: Crypto = globalThis.crypto as Crypto;
  const bytes = cryptoObj.getRandomValues(new Uint8Array(16));

  // Ajustar versión y variante según UUID v4 RFC 4122
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte: number) =>
    byte.toString(16).padStart(2, '0')
  );

  return (
    hex[0] +
    hex[1] +
    hex[2] +
    hex[3] +
    '-' +
    hex[4] +
    hex[5] +
    '-' +
    hex[6] +
    hex[7] +
    '-' +
    hex[8] +
    hex[9] +
    '-' +
    hex[10] +
    hex[11] +
    hex[12] +
    hex[13] +
    hex[14] +
    hex[15]
  );
}
