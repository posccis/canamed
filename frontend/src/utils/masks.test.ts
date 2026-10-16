import { describe, expect, it } from 'vitest';
import { formatCpf, formatPhone, isValidCpf, isValidPhone, unmaskDigits } from './masks';

describe('masks utility (QF-01)', () => {
  describe('formatCpf', () => {
    it('formata CPF progressivamente', () => {
      expect(formatCpf('1')).toBe('1');
      expect(formatCpf('123')).toBe('123');
      expect(formatCpf('1234')).toBe('123.4');
      expect(formatCpf('123456')).toBe('123.456');
      expect(formatCpf('1234567')).toBe('123.456.7');
      expect(formatCpf('12345678901')).toBe('123.456.789-01');
    });

    it('ignora caracteres não numéricos e limita a 11 dígitos', () => {
      expect(formatCpf('123.456.789-01999')).toBe('123.456.789-01');
      expect(formatCpf('abc123def456ghi78901')).toBe('123.456.789-01');
    });
  });

  describe('formatPhone', () => {
    it('formata celular brasileiro progressivamente com DDD', () => {
      expect(formatPhone('8')).toBe('(8');
      expect(formatPhone('81')).toBe('(81');
      expect(formatPhone('819')).toBe('(81) 9');
      expect(formatPhone('81987654321')).toBe('(81) 98765-4321');
    });

    it('formata telefone fixo com 10 dígitos', () => {
      expect(formatPhone('8133334444')).toBe('(81) 3333-4444');
    });

    it('ignora caracteres não numéricos e limita a 11 dígitos', () => {
      expect(formatPhone('(81) 98765-4321000')).toBe('(81) 98765-4321');
    });
  });

  describe('unmaskDigits', () => {
    it('remove caracteres não numéricos', () => {
      expect(unmaskDigits('123.456.789-01')).toBe('12345678901');
      expect(unmaskDigits('(81) 98765-4321')).toBe('81987654321');
    });
  });

  describe('validation', () => {
    it('valida CPF correto e rejeita inválido ou sequencial', () => {
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('12345678900')).toBe(false);
      // CPF matematicamente válido conhecido: 52998224725
      expect(isValidCpf('52998224725')).toBe(true);
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('valida celular por quantidade de dígitos', () => {
      expect(isValidPhone('(81) 98765-4321')).toBe(true);
      expect(isValidPhone('8133334444')).toBe(true);
      expect(isValidPhone('123')).toBe(false);
    });
  });
});
