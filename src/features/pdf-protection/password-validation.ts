export interface PasswordValidation {
  passwordError?: string;
  confirmationError?: string;
}

export function getPasswordStrength(password: string): number {
  if (!password) return 0;

  const characterGroups = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  const score =
    Number(password.length >= 8) +
    Number(password.length >= 12) +
    Number(password.length >= 16) +
    Number(characterGroups >= 2);

  return Math.min(score, 4);
}

export function validatePasswords(
  password: string,
  confirmation: string,
): PasswordValidation {
  const errors: PasswordValidation = {};

  if (password.length < 8 || !/\S/.test(password)) {
    errors.passwordError = 'Use at least 8 characters and avoid a spaces-only password.';
  } else if (getPasswordStrength(password) < 2) {
    errors.passwordError = 'Use a mix of character types for a stronger password.';
  }

  if (!confirmation) {
    errors.confirmationError = 'Re-enter your opening password to confirm it.';
  } else if (password !== confirmation) {
    errors.confirmationError = 'The passwords do not match.';
  }

  return errors;
}
