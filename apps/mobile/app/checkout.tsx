import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Governorate } from '@libas/shared';
import { apiFetch, ApiError } from '@/lib/api';
import { useCart } from '@/context/cart-context';
import type { CreateOrderResult, Order, OrderQuote } from '@/types';

type PaymentMethod = 'cod' | 'card';

export default function CheckoutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, refresh } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [delegation, setDelegation] = useState('');
  const [governorate, setGovernorate] = useState<Governorate>(Governorate.TUNIS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    setIsQuoting(true);
    apiFetch<OrderQuote>('/orders/quote', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ governorate }),
    })
      .then(setQuote)
      .catch(() => setQuote(null))
      .finally(() => setIsQuoting(false));
  }, [governorate]);

  async function handleSubmit() {
    if (!fullName.trim() || !phone.trim() || !address.trim() || !delegation.trim()) {
      setError(t('common.error'));
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiFetch<CreateOrderResult>('/orders', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          paymentMethod,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            governorate,
            delegation: delegation.trim(),
            country: 'Tunisie',
          },
        }),
      });
      await refresh();

      if (result.paymentRedirectUrl) {
        // The mock provider returns a web confirmation URL
        // (`${WEB_APP_URL}/payments/mock/{reference}`) — the reference is
        // always its last path segment. Mobile has its own native screen
        // for this instead of opening the web page (which relies on the
        // web app's localStorage session, not this app's auth).
        const reference = result.paymentRedirectUrl.split('/').filter(Boolean).pop();
        router.replace(`/payments/mock/${reference}`);
        return;
      }

      setConfirmedOrder(result.order);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.confirmTitle}>{t('checkout.orderSuccessTitle')}</Text>
        <Text style={styles.confirmText}>
          {t('mobile.confirmOrderText', {
            number: `#${confirmedOrder._id.slice(-6).toUpperCase()}`,
          })}{' '}
          {t('checkout.cod')}.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/catalogue')}>
          <Text style={styles.buttonText}>{t('cart.browseCatalog')}</Text>
        </Pressable>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>{t('cart.empty')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>{t('checkout.shippingAddress')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('checkout.fullName')}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder={t('checkout.phone')}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput
        style={styles.input}
        placeholder={t('checkout.address')}
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder={t('checkout.delegationLabel')}
        value={delegation}
        onChangeText={setDelegation}
      />

      <Text style={styles.label}>{t('checkout.governorateLabel')}</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={governorate} onValueChange={(value) => setGovernorate(value)}>
          {Object.values(Governorate).map((value) => (
            <Picker.Item key={value} label={t(`checkout.governorate.${value}`)} value={value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>{t('checkout.paymentMethod')}</Text>
      <View style={styles.paymentRow}>
        <Pressable
          onPress={() => setPaymentMethod('cod')}
          style={[styles.paymentChip, paymentMethod === 'cod' && styles.paymentChipActive]}
        >
          <Text style={paymentMethod === 'cod' ? styles.paymentChipTextActive : styles.paymentChipText}>
            {t('checkout.cod')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setPaymentMethod('card')}
          style={[styles.paymentChip, paymentMethod === 'card' && styles.paymentChipActive]}
        >
          <Text style={paymentMethod === 'card' ? styles.paymentChipTextActive : styles.paymentChipText}>
            {t('checkout.card')}
          </Text>
        </Pressable>
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>{t('cart.title')}</Text>
        {isQuoting ? (
          <ActivityIndicator />
        ) : quote ? (
          <>
            <View style={styles.summaryRow}>
              <Text>{t('checkout.subtotal')}</Text>
              <Text>
                {quote.itemsSubtotal} {t('common.currency')}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>{t('checkout.shippingFee')}</Text>
              <Text>
                {quote.shippingFee} {t('common.currency')}
              </Text>
            </View>
            {quote.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text>{t('checkout.discount')}</Text>
                <Text>
                  -{quote.discountAmount} {t('common.currency')}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
              <Text style={styles.totalValue}>
                {quote.total} {t('common.currency')}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.error}>{t('common.error')}</Text>
        )}
        <Text style={styles.paymentNote}>{t(paymentMethod === 'cod' ? 'checkout.cod' : 'checkout.card')}.</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{t('checkout.placeOrder')}</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  container: { padding: 16, backgroundColor: '#faf8f5', flexGrow: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff', marginBottom: 16 },
  paymentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  paymentChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  paymentChipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  paymentChipText: { fontSize: 13 },
  paymentChipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  summary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalLabel: { fontWeight: '700' },
  totalValue: { fontWeight: '700', color: '#b8622e' },
  paymentNote: { fontSize: 12, color: '#6b6b6b', marginTop: 8 },
  button: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#c0392b', marginTop: 8, fontSize: 13 },
  confirmTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  confirmText: { fontSize: 14, color: '#4b4b4b', textAlign: 'center', marginBottom: 24 },
});
