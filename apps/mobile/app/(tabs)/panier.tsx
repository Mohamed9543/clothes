import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { API_URL } from '@/lib/api';
import { localize } from '@/lib/localized';
import { useCart } from '@/context/cart-context';
import type { EnrichedCartItem } from '@/types';

function imageUri(path: string | null): string | null {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export default function CartScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { cart, updateItem, removeItem } = useCart();

  const items = cart?.items ?? [];

  function itemKey(item: EnrichedCartItem) {
    return `${item.productId}-${item.size}-${item.color}`;
  }

  if (items.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('cart.empty')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={itemKey}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const uri = imageUri(item.image);
          return (
            <View style={styles.row}>
              {uri ? (
                <Image source={{ uri }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}
              <View style={styles.info}>
                <Text numberOfLines={1} style={styles.name}>
                  {localize(item.name, i18n.language)}
                </Text>
                <Text style={styles.variant}>
                  {item.size} · {item.color}
                </Text>
                <Text style={styles.price}>
                  {item.subtotal} {t('common.currency')}
                </Text>
                <View style={styles.quantityRow}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() =>
                      item.quantity > 1
                        ? updateItem(item.productId, item.size, item.color, item.quantity - 1)
                        : removeItem(item.productId, item.size, item.color)
                    }
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => updateItem(item.productId, item.size, item.color, item.quantity + 1)}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                  <Pressable onPress={() => removeItem(item.productId, item.size, item.color)}>
                    <Text style={styles.remove}>{t('cart.remove')}</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>
          {t('cart.total')} : {cart?.total} {t('common.currency')}
        </Text>
        <Pressable style={styles.button} onPress={() => router.push('/checkout')}>
          <Text style={styles.buttonText}>{t('cart.checkout')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6b6b6b' },
  list: { padding: 12 },
  row: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 10 },
  image: { width: 72, height: 90, borderRadius: 8, backgroundColor: '#eee' },
  imagePlaceholder: {},
  info: { flex: 1, marginStart: 12 },
  name: { fontSize: 14, fontWeight: '600' },
  variant: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  price: { fontSize: 14, color: '#b8622e', marginTop: 4, fontWeight: '600' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 10 },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: { fontSize: 16 },
  quantity: { fontSize: 14, minWidth: 16, textAlign: 'center' },
  remove: { color: '#c0392b', fontSize: 12, marginStart: 'auto' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  total: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  button: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
