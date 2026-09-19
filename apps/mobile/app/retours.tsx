import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import type { ReturnRequest } from '@/types';

export default function ReturnsScreen() {
  const { t, i18n } = useTranslation();
  const [returns, setReturns] = useState<ReturnRequest[] | null>(null);

  useEffect(() => {
    apiFetch<ReturnRequest[]>('/returns', { auth: true })
      .then(setReturns)
      .catch(() => setReturns([]));
  }, []);

  if (returns === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {returns.length === 0 && <Text style={styles.empty}>{t('returns.empty')}</Text>}

      {returns.map((request) => (
        <View key={request._id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>
              {request.type === 'return' ? t('returns.requestReturn') : t('returns.requestExchange')} — #
              {request._id.slice(-6).toUpperCase()}
            </Text>
            <Text style={styles.status}>{t(`returns.status.${request.status}`)}</Text>
          </View>
          <Text style={styles.date}>{new Date(request.createdAt).toLocaleDateString(i18n.language)}</Text>
          {request.items.map((item, index) => (
            <Text key={index} style={styles.item}>
              {item.quantity} × {item.size} / {item.color}
              {item.exchangeSize ? ` → ${item.exchangeSize} / ${item.exchangeColor}` : ''}
            </Text>
          ))}
          <Text style={styles.reason}>{request.reason}</Text>
          {request.refundAmount != null && (
            <Text style={styles.refund}>
              {t('returns.refundAmount')}: {request.refundAmount} {t('common.currency')}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 12 },
  empty: { textAlign: 'center', color: '#6b6b6b', marginTop: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '700' },
  status: { fontSize: 12, color: '#b8622e', fontWeight: '600' },
  date: { fontSize: 12, color: '#6b6b6b', marginTop: 4, marginBottom: 8 },
  item: { fontSize: 13, marginBottom: 2 },
  reason: { fontSize: 13, color: '#6b6b6b', marginTop: 8 },
  refund: { fontSize: 13, fontWeight: '600', color: '#2e7d32', marginTop: 8 },
});
