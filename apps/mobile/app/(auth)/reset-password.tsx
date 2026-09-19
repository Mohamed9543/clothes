import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
} from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '@/components/password-input';
import { ApiError, apiFetch } from '@/lib/api';
import { authStyles as styles } from '@/lib/auth-styles';
import { clearResetState, getResetState } from '@/lib/password-reset';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const saved = getResetState();
  const [newPassword, setNewPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!saved && !isDone) {
    return <Redirect href="/(auth)/forgot-password" />;
  }
  if (saved && !saved.code) {
    return <Redirect href="/(auth)/verify-code" />;
  }

  async function handleSubmit() {
    if (!saved) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: saved.email, code: saved.code, newPassword }),
      });
      clearResetState();
      setIsDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isDone) {
    return (
      <KeyboardAvoidingView style={styles.container}>
        <Text style={styles.title}>{t('auth.newPasswordTitle')}</Text>
        <Text style={styles.subtitle}>{t('auth.resetSuccess')}</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>{t('auth.backToLogin')}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>{t('auth.newPasswordTitle')}</Text>
      <Text style={styles.subtitle}>{t('auth.newPasswordSubtitle')}</Text>

      <PasswordInput
        placeholder={t('auth.newPassword')}
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, (newPassword.length < 8 || isSubmitting) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={newPassword.length < 8 || isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('auth.resetCta')}</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}
