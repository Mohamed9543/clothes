import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from 'react-native';
import { Link, Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, apiFetch } from '@/lib/api';
import { authStyles as styles } from '@/lib/auth-styles';
import { getResetState, setResetState } from '@/lib/password-reset';

export default function VerifyCodeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const email = getResetState()?.email;
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (!email) {
    return <Redirect href="/(auth)/forgot-password" />;
  }

  async function handleVerify() {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/verify-reset-code', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
      setResetState({ email: email as string, code });
      router.push('/(auth)/reset-password');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    setError(null);
    setNotice(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
      setCode('');
      setNotice(t('auth.codeResent'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{t('auth.verifyTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.codeSentTo', { email })}</Text>

      <TextInput
        style={[styles.input, styles.codeInput]}
        placeholder="——————"
        keyboardType="number-pad"
        maxLength={6}
        autoComplete="sms-otp"
        textContentType="oneTimeCode"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, ''))}
      />

      {error && <Text style={styles.error}>{error}</Text>}
      {notice && <Text style={styles.notice}>{notice}</Text>}

      <Pressable
        style={[styles.button, (code.length !== 6 || isSubmitting) && styles.buttonDisabled]}
        onPress={handleVerify}
        disabled={code.length !== 6 || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.verifyCta')}</Text>
        )}
      </Pressable>

      <Pressable onPress={handleResend} disabled={isSubmitting}>
        <Text style={styles.link}>{t('auth.resendCode')}</Text>
      </Pressable>
      <Link href="/(auth)/login" style={styles.link}>
        {t('auth.backToLogin')}
      </Link>
    </KeyboardAvoidingView>
  );
}
