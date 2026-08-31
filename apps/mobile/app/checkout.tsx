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
import { Governorate } from '@libas/shared';
import { apiFetch, ApiError } from '@/lib/api';
import { GOVERNORATE_LABELS } from '@/lib/governorates';
import { useCart } from '@/context/cart-context';
import type { Order, OrderQuote } from '@/types';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cart, refresh } = useCart();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [delegation, setDelegation] = useState('');
  const [governorate, setGovernorate] = useState<Governorate>(Governorate.TUNIS);
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
      setError('Merci de remplir tous les champs.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const order = await apiFetch<Order>('/orders', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
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
      setConfirmedOrder(order);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Une erreur est survenue.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <View style={styles.center}>
        <Text style={styles.confirmTitle}>Commande confirmée !</Text>
        <Text style={styles.confirmText}>
          Votre commande #{confirmedOrder._id.slice(-6).toUpperCase()} a été enregistrée. Paiement à la
          livraison.
        </Text>
        <Pressable style={styles.button} onPress={() => router.replace('/(tabs)/catalogue')}>
          <Text style={styles.buttonText}>Retour au catalogue</Text>
        </Pressable>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Votre panier est vide.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionTitle}>Adresse de livraison</Text>
      <TextInput style={styles.input} placeholder="Nom complet" value={fullName} onChangeText={setFullName} />
      <TextInput
        style={styles.input}
        placeholder="Téléphone"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />
      <TextInput style={styles.input} placeholder="Adresse" value={address} onChangeText={setAddress} />
      <TextInput style={styles.input} placeholder="Délégation" value={delegation} onChangeText={setDelegation} />

      <Text style={styles.label}>Gouvernorat</Text>
      <View style={styles.pickerWrapper}>
        <Picker selectedValue={governorate} onValueChange={(value) => setGovernorate(value)}>
          {Object.values(Governorate).map((value) => (
            <Picker.Item key={value} label={GOVERNORATE_LABELS[value]} value={value} />
          ))}
        </Picker>
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Récapitulatif</Text>
        {isQuoting ? (
          <ActivityIndicator />
        ) : quote ? (
          <>
            <View style={styles.summaryRow}>
              <Text>Sous-total</Text>
              <Text>{quote.itemsSubtotal} TND</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>Livraison</Text>
              <Text>{quote.shippingFee} TND</Text>
            </View>
            {quote.discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text>Remise</Text>
                <Text>-{quote.discountAmount} TND</Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{quote.total} TND</Text>
            </View>
          </>
        ) : (
          <Text style={styles.error}>Impossible de calculer le total.</Text>
        )}
        <Text style={styles.paymentNote}>Paiement à la livraison (contre-remboursement).</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirmer la commande</Text>
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
