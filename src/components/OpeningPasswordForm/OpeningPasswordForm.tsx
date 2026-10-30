import { useState } from 'react';
import {
  Button,
  Caption1,
  Card,
  CardHeader,
  Field,
  Input,
  Text,
} from '@fluentui/react-components';
import {
  EyeOffRegular,
  EyeRegular,
  KeyRegular,
  LockClosedRegular,
} from '@fluentui/react-icons';
import {
  countPasswordWords,
  getPasswordStrength,
} from '../../features/pdf-protection/password-validation';

interface OpeningPasswordFormProps {
  secret: string;
  confirmation: string;
  onPasswordChange: (value: string) => void;
  onConfirmationChange: (value: string) => void;
}

const strengthLabels = ['Not set', 'Weak', 'Fair', 'Good', 'Strong'];

export function OpeningPasswordForm({
  secret,
  confirmation,
  onPasswordChange,
  onConfirmationChange,
}: OpeningPasswordFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(secret);
  const passwordError =
    secret.length > 0 && countPasswordWords(secret) < 4
      ? 'Use at least 4 words in your password.'
      : undefined;
  const confirmationError =
    confirmation.length > 0 && secret !== confirmation
      ? 'The passwords do not match.'
      : undefined;

  return (
    <Card className="panel security-panel" appearance="filled">
      <CardHeader
        header={
          <div className="section-title">
            <LockClosedRegular aria-hidden="true" />
            <Text weight="semibold" size={400}>
              Opening password
            </Text>
          </div>
        }
        description={<Caption1>Use this password to open the protected PDF.</Caption1>}
      />

      <div className="form-fields">
        <Field
          label="Password"
          validationState={
            passwordError ? 'warning' : secret.length === 0 ? 'warning' : 'none'
          }
          validationMessage={
            passwordError ??
            'Use 4 or more words. Any words or characters are allowed.'
          }
        >
          <Input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={secret}
            onChange={(_event, data) => onPasswordChange(data.value)}
            contentAfter={
              <Button
                appearance="transparent"
                size="small"
                icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((visible) => !visible)}
              />
            }
          />
        </Field>

        <div className="strength-row" aria-live="polite">
          <Caption1>Password strength</Caption1>
          <span
            className={`strength-bars strength-bars--${strength}`}
            aria-hidden="true"
          >
            {strengthLabels.slice(1).map((label) => (
              <i key={label} />
            ))}
          </span>
          <Text className={`strength-value strength-value--${strength}`} size={200}>
            {strengthLabels[strength]}
          </Text>
        </div>

        <Field
          label="Confirm password"
          validationState={confirmationError ? 'error' : 'none'}
          validationMessage={confirmationError}
        >
          <Input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirmation}
            onChange={(_event, data) => onConfirmationChange(data.value)}
          />
        </Field>

        <div className="crypto-note">
          <KeyRegular aria-hidden="true" />
          <Caption1>
            AES-256 encryption is used. Some older or specialized PDF readers may not support it.
            Encrypted PDFs, PDF/A files, damaged files, and some complex PDFs may not be supported.
            Saving can invalidate existing digital signatures.
          </Caption1>
        </div>
      </div>
    </Card>
  );
}
