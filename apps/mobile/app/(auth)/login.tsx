import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
} from 'react-native';
import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ApiError, useAuth } from '@/context/auth-context';
import { GoogleButton } from '@/components/google-button';
import { PasswordInput } from '@/components/password-input';
import { authStyles as styles } from '@/lib/auth-styles';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#faf8f5' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { fontSize: 32 }]}>{t('brand.name')}</Text>
        <Text style={styles.subtitle}>{t('mobile.loginSubtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <PasswordInput
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
        />

        <Link href="/(auth)/forgot-password" style={styles.linkEnd}>
          {t('auth.forgotLink')}
        </Link>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('auth.loginCta')}</Text>
          )}
        </Pressable>

        <GoogleButton onError={setError} />

        <Link href="/(auth)/register" style={styles.link}>
          {t('auth.noAccount')} {t('auth.createAccount')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
