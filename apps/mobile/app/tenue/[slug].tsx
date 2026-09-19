import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProductGrid } from '@/components/product-grid';
import { useCart } from '@/context/cart-context';
import { apiFetch, ApiError } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { BulkAddResult, OutfitWithProducts } from '@/types';

export default function OutfitScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const { refresh } = useCart();
  const [outfit, setOutfit] = useState<OutfitWithProducts | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OutfitWithProducts>(`/outfits/${slug}`).then(setOutfit);
  }, [slug]);

  async function handleAddAll() {
    if (!outfit) return;
    setMessage(null);
    setIsAdding(true);
    try {
      const result = await apiFetch<BulkAddResult>('/cart/bulk-add', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ productIds: outfit.productIds }),
      });
      await refresh();
      setMessage(result.skippedProductIds.length > 0 ? t('outfit.someItemsUnavailable') : t('outfit.itemsAdded'));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsAdding(false);
    }
  }

  if (!outfit) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  const currency = t('common.currency');

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <Image source={{ uri: imageUri(outfit.coverImage) }} style={styles.cover} />
      <View style={styles.content}>
        <Text style={styles.title}>{localize(outfit.title, i18n.language)}</Text>
        <Text style={styles.description}>{localize(outfit.description, i18n.language)}</Text>

        {outfit.bundlePrice != null ? (
          <Text style={styles.price}>
            <Text style={styles.oldPrice}>
              {outfit.totalPrice} {currency}
            </Text>
            {'  '}
            {t('outfit.bundlePrice')}: {Math.round(outfit.bundlePrice * 100) / 100} {currency} (
            {t('outfit.bundleSavings', { percent: outfit.bundleDiscountPercent ?? 0 })})
          </Text>
        ) : (
          <Text style={styles.price}>
            {t('outfit.totalPrice')}: {outfit.totalPrice} {currency}
          </Text>
        )}

        {message && <Text style={styles.message}>{message}</Text>}
        <Pressable
          style={[styles.button, isAdding && { opacity: 0.5 }]}
          onPress={handleAddAll}
          disabled={isAdding}
        >
          <Text style={styles.buttonText}>{isAdding ? t('common.loading') : t('outfit.addToCart')}</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>{t('outfit.includedProducts')}</Text>
        <ProductGrid products={outfit.products} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5' },
  cover: { width: '100%', aspectRatio: 4 / 3, backgroundColor: '#eee' },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  description: { fontSize: 14, color: '#4b4b4b', marginTop: 8, lineHeight: 20 },
  price: { fontSize: 16, fontWeight: '700', color: '#b8622e', marginTop: 14 },
  oldPrice: { color: '#999', fontWeight: '400', textDecorationLine: 'line-through' },
  message: { marginTop: 12, fontSize: 13, color: '#2e7d32' },
  button: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 24, marginBottom: 10 },
});
