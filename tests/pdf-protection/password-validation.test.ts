import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  validatePasswords,
} from '../../src/features/pdf-protection/password-validation';

describe('password validation', () => {
  it('requires a usable password and a matching confirmation', () => {
    expect(validatePasswords('', '')).toEqual({
      passwordError: 'Use at least 4 words in your password.',
      confirmationError: 'Re-enter your opening password to confirm it.',
    });
    expect(validatePasswords('short', 'different').confirmationError).toBe(
      'The passwords do not match.',
    );
    expect(validatePasswords('Strong password phrase 2026!', 'Strong password phrase 2026!')).toEqual({});
  });

  it('scores passwords by word count without requiring specific character types', () => {
    expect(getPasswordStrength('')).toBe(0);
    expect(getPasswordStrength('blue sky')).toBe(2);
    expect(getPasswordStrength('one two three four')).toBe(4);
    expect(validatePasswords('one two three four', 'one two three four')).toEqual({});
    expect(validatePasswords('one two three', 'one two three').passwordError).toBe(
      'Use at least 4 words in your password.',
    );
  });
});
