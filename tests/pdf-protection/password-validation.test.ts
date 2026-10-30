import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  validatePasswords,
} from '../../src/features/pdf-protection/password-validation';

describe('password validation', () => {
  it('requires a usable password and a matching confirmation', () => {
    expect(validatePasswords('', '')).toEqual({
      passwordError: 'Use at least 8 characters and avoid a spaces-only password.',
      confirmationError: 'Re-enter your opening password to confirm it.',
    });
    expect(validatePasswords('short', 'different').confirmationError).toBe(
      'The passwords do not match.',
    );
    expect(validatePasswords('Strong password 2026!', 'Strong password 2026!')).toEqual({});
  });

  it('scores longer passwords with mixed character types higher', () => {
    expect(getPasswordStrength('')).toBe(0);
    expect(getPasswordStrength('abcdefgh')).toBe(1);
    expect(getPasswordStrength('Strong password 2026!')).toBe(4);
  });
});
