export interface PasswordValidation {
  passwordError?: string;
  confirmationError?: string;
}

export function countPasswordWords(password: string): number {
  return password.trim().match(/\S+/g)?.length ?? 0;
}

export function getPasswordStrength(password: string): number {
  return Math.min(countPasswordWords(password), 4);
}

export function validatePasswords(
  password: string,
  confirmation: string,
): PasswordValidation {
  const errors: PasswordValidation = {};

  if (countPasswordWords(password) < 4) {
    errors.passwordError = 'Use at least 4 words in your password.';
  }

  if (!confirmation) {
    errors.confirmationError = 'Re-enter your opening password to confirm it.';
  } else if (password !== confirmation) {
    errors.confirmationError = 'The passwords do not match.';
  }

  return errors;
}
