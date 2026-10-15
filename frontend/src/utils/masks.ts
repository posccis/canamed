/**
 * Utilitários padronizados de máscara para CPF e Telefone Celular Brasileiro.
 * QF-01: Máscaras consistentes, amigáveis a digitação, edição, deleção e colagem.
 */

/**
 * Formata CPF como 000.000.000-00 progressivamente.
 */
export function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formata Telefone / Celular Brasileiro como (00) 00000-0000 (ou fixo com 8 dígitos).
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/**
 * Normaliza removendo todos os caracteres não numéricos.
 */
export function unmaskDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Validação de CPF (algoritmo dos dígitos verificadores).
 */
export function isValidCpf(value: string): boolean {
  const digits = unmaskDigits(value);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i], 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i], 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(digits[10], 10)) return false;

  return true;
}

/**
 * Validação de celular brasileiro (10 ou 11 dígitos, DDD válido).
 */
export function isValidPhone(value: string): boolean {
  const digits = unmaskDigits(value);
  return digits.length === 10 || digits.length === 11;
}
