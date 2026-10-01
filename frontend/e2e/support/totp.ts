import { createHmac } from 'node:crypto';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** Converte um segredo Base32 em bytes. */
function decodeBase32(secret: string): Buffer {
  const normalized = secret.trim().replace(/=+$/, '').toUpperCase();
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (const character of normalized) {
    const index = alphabet.indexOf(character);

    if (index < 0) {
      throw new Error('Segredo Base32 inválido.');
    }

    buffer = (buffer << 5) | index;
    bitsLeft += 5;

    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Gera o código TOTP (SHA-1, 30 s, 6 dígitos) de um segredo, conforme a RFC 6238.
 * É a mesma regra implementada no backend, usada aqui para exercitar o fluxo real de MFA.
 */
export function generateTotp(secret: string, moment: Date = new Date()): string {
  const counter = Math.floor(moment.getTime() / 1000 / 30);
  const buffer = Buffer.alloc(8);

  buffer.writeBigUInt64BE(BigInt(counter));

  const digest = createHmac('sha1', decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  return (binary % 1_000_000).toString().padStart(6, '0');
}
