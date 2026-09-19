import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, apiFetch } from '@/lib/api';
import { authStyles as styles } from '@/lib/auth-styles';
import { setResetState } from '@/lib/password-reset';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      const trimmed = email.trim();
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: trimmed }),
      });
      setResetState({ email: trimmed });
      router.push('/(auth)/verify-code');
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
      <Text style={styles.title}>{t('auth.forgotTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.forgotSubtitle')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.email')}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (!email.trim() || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={!email.trim() || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.sendCode')}</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" style={styles.link}>
        {t('auth.backToLogin')}
      </Link>
    </KeyboardAvoidingView>
  );
}
