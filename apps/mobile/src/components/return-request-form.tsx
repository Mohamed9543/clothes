import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { Order, ReturnType } from '@/types';

export function ReturnRequestForm({
  order,
  onDone,
  onCancel,
}: {
  order: Order;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [type, setType] = useState<ReturnType>('return');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [exchangeSize, setExchangeSize] = useState('');
  const [exchangeColor, setExchangeColor] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = order.items[selectedIndex];

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/returns', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          orderId: order._id,
          type,
          reason: reason.trim(),
          items: [
            {
              productId: selected.productId,
              size: selected.size,
              color: selected.color,
              quantity,
              ...(type === 'exchange' ? { exchangeSize, exchangeColor } : {}),
            },
          ],
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('returns.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = reason.trim().length > 0 && (type === 'return' || (exchangeSize && exchangeColor));

  return (
    <View style={styles.card}>
      <View style={styles.chips}>
        {(['return', 'exchange'] as const).map((option) => (
          <Pressable
            key={option}
            onPress={() => setType(option)}
            style={[styles.chip, type === option && styles.chipActive]}
          >
            <Text style={type === option ? styles.chipTextActive : styles.chipText}>
              {option === 'return' ? t('returns.requestReturn') : t('returns.requestExchange')}
            </Text>
          </Pressable>
        ))}
      </View>

      {order.items.map((item, index) => (
        <Pressable
          key={`${item.productId}-${index}`}
          onPress={() => {
            setSelectedIndex(index);
            setQuantity(1);
          }}
          style={[styles.itemRow, selectedIndex === index && styles.itemRowActive]}
        >
          <Text style={styles.itemText} numberOfLines={1}>
            {localize(item.name, i18n.language)} ({item.size}/{item.color})
          </Text>
        </Pressable>
      ))}

      <View style={styles.quantityRow}>
        <Pressable style={styles.stepper} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
          <Text style={styles.stepperText}>−</Text>
        </Pressable>
        <Text style={styles.quantity}>{quantity}</Text>
        <Pressable style={styles.stepper} onPress={() => setQuantity((q) => Math.min(selected.quantity, q + 1))}>
          <Text style={styles.stepperText}>+</Text>
        </Pressable>
      </View>

      {type === 'exchange' && (
        <>
          <TextInput
            style={styles.input}
            placeholder={t('returns.exchangeSize')}
            value={exchangeSize}
            onChangeText={setExchangeSize}
          />
          <TextInput
            style={styles.input}
            placeholder={t('returns.exchangeColor')}
            value={exchangeColor}
            onChangeText={setExchangeColor}
          />
        </>
      )}

      <TextInput
        style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
        placeholder={t('returns.reason')}
        value={reason}
        onChangeText={setReason}
        multiline
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.actions}>
        <Pressable style={styles.cancel} onPress={onCancel}>
          <Text style={styles.cancelText}>{t('returns.cancel')}</Text>
        </Pressable>
        <Pressable
          style={[styles.submit, (!canSubmit || isSubmitting) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          <Text style={styles.submitText}>{t('returns.submit')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  chips: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  itemRow: { borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, marginBottom: 6 },
  itemRowActive: { borderColor: '#b8622e', backgroundColor: '#fdf4ef' },
  itemText: { fontSize: 13 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 10 },
  stepper: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 18 },
  quantity: { fontSize: 16, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#fff' },
  error: { color: '#c0392b', fontSize: 13, marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  cancel: { paddingHorizontal: 16, paddingVertical: 10 },
  cancelText: { color: '#6b6b6b' },
  submit: { backgroundColor: '#b8622e', borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10 },
  submitText: { color: '#fff', fontWeight: '600' },
});
