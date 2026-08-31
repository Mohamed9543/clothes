import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '@/lib/api';

type Outcome = 'paid' | 'failed';

// Dev-only stand-in for a real payment gateway's hosted checkout — native
// mirror of apps/web/src/app/[locale]/payments/mock/[reference]/page.tsx.
// Not a WebView: the web page relies on the web app's own localStorage
// session, which this app doesn't have, so this calls the same backend
// endpoint directly with the mobile app's own auth instead.
export default function MockPaymentScreen() {
  const { reference } = useLocalSearchParams<{ reference: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function simulate(outcome: Outcome) {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/payments/mock/${reference}/simulate`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ outcome }),
      });
      setResult(outcome);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('payments.simulateError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (result) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>
          {t(result === 'paid' ? 'payments.simulatedPaidTitle' : 'payments.simulatedFailedTitle')}
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/commandes')}>
          <Text style={styles.buttonText}>{t('payments.viewOrders')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.center}>
      <Text style={styles.title}>{t('payments.mockConfirmTitle')}</Text>
      <Text style={styles.subtitle}>{t('payments.mockConfirmSubtitle')}</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Pressable style={styles.button} onPress={() => simulate('paid')} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('payments.simulateSuccess')}</Text>
          )}
        </Pressable>
        <Pressable
          style={styles.outlineButton}
          onPress={() => simulate('failed')}
          disabled={isSubmitting}
        >
          <Text style={styles.outlineButtonText}>{t('payments.simulateFailure')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#faf8f5' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b6b6b', textAlign: 'center', marginTop: 8 },
  actions: { marginTop: 24, width: '100%', gap: 10 },
  button: {
    backgroundColor: '#b8622e',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: { fontSize: 15, fontWeight: '500' },
  error: { color: '#c0392b', marginTop: 16, fontSize: 13, textAlign: 'center' },
});
