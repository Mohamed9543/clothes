import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { localize } from '@/lib/localized';
import { ReturnRequestForm } from '@/components/return-request-form';
import type { Order, OrderStatus } from '@/types';

interface HistoryEntry {
  _id: string;
  toStatus: OrderStatus;
  createdAt: string;
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showReturnForm, setShowReturnForm] = useState(false);

  useEffect(() => {
    apiFetch<Order>(`/orders/${id}`, { auth: true }).then(setOrder);
    apiFetch<HistoryEntry[]>(`/orders/${id}/history`, { auth: true })
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [id]);

  if (!order) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.orderNumber}>#{order._id.slice(-6).toUpperCase()}</Text>
        <Text style={styles.status}>{t(`orderStatus.${order.status}`)}</Text>
      </View>

      {history.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('account.trackOrder')}</Text>
          {history.map((entry) => (
            <View key={entry._id} style={styles.historyRow}>
              <View style={styles.dot} />
              <View>
                <Text style={styles.historyStatus}>{t(`orderStatus.${entry.toStatus}`)}</Text>
                <Text style={styles.historyDate}>
                  {new Date(entry.createdAt).toLocaleString(i18n.language)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {order.status === 'delivered' && (
        <>
          <Pressable style={styles.card} onPress={() => setShowReturnForm((current) => !current)}>
            <Text style={styles.linkText}>
              {t('returns.requestReturn')} / {t('returns.requestExchange')}
            </Text>
          </Pressable>
          {showReturnForm && (
            <ReturnRequestForm
              order={order}
              onDone={() => {
                setShowReturnForm(false);
                router.push('/retours');
              }}
              onCancel={() => setShowReturnForm(false)}
            />
          )}
        </>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('mobile.orderItems')}</Text>
        {order.items.map((item, index) => (
          <View key={`${item.productId}-${index}`} style={styles.itemRow}>
            <Text style={styles.itemName} numberOfLines={1}>
              {localize(item.name, i18n.language)} ({item.size}/{item.color}) × {item.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              {item.unitPrice * item.quantity} {t('common.currency')}
            </Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.itemRow}>
          <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
          <Text style={styles.totalValue}>
            {order.totalAmount} {t('common.currency')}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('checkout.shippingAddress')}</Text>
        <Text style={styles.addressLine}>{order.shippingAddress.fullName}</Text>
        <Text style={styles.addressLine}>{order.shippingAddress.phone}</Text>
        <Text style={styles.addressLine}>{order.shippingAddress.address}</Text>
        <Text style={styles.addressLine}>
          {order.shippingAddress.delegation}, {t(`checkout.governorate.${order.shippingAddress.governorate}`)}
        </Text>
        <Text style={styles.paymentNote}>
          {order.paymentMethod === 'cod' ? t('checkout.cod') : t('mobile.paymentByCard')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5', padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  orderNumber: { fontSize: 16, fontWeight: '700' },
  status: { fontSize: 13, color: '#b8622e', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { flex: 1, fontSize: 13, marginEnd: 8 },
  itemPrice: { fontSize: 13, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 8 },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontWeight: '700', color: '#b8622e' },
  addressLine: { fontSize: 13, color: '#4b4b4b', marginBottom: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#b8622e', marginTop: 4 },
  historyStatus: { fontSize: 13, fontWeight: '600' },
  historyDate: { fontSize: 11, color: '#6b6b6b', marginTop: 2 },
  linkText: { color: '#b8622e', fontWeight: '600', fontSize: 14 },
  paymentNote: { fontSize: 12, color: '#6b6b6b', marginTop: 8 },
});
