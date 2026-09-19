import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ApiError, useAuth } from '@/context/auth-context';

export function GoogleButton({ onError }: { onError: (message: string | null) => void }) {
  const { t } = useTranslation();
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  async function handlePress() {
    onError(null);
    setIsLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      onError(err instanceof ApiError || err instanceof Error ? err.message : t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <View>
      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>{t('auth.or')}</Text>
        <View style={styles.line} />
      </View>
      <Pressable style={styles.button} onPress={handlePress} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#444" />
        ) : (
          <>
            <Ionicons name="logo-google" size={18} color="#DB4437" />
            <Text style={styles.text}>{t('mobile.continueWithGoogle')}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  line: { flex: 1, height: 1, backgroundColor: '#ddd' },
  dividerText: { color: '#8a8a8a', fontSize: 12 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingVertical: 13,
    backgroundColor: '#fff',
  },
  text: { fontSize: 15, fontWeight: '600', color: '#333' },
});
