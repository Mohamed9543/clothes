import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch, ApiError } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { ProductReviews } from '@/components/product-reviews';
import { SizeAssistant } from '@/components/size-assistant';
import { TryOnButton } from '@/components/try-on-button';
import type { PublicProduct } from '@/types';

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle: toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    apiFetch<PublicProduct>(`/products/${slug}`)
      .then((result) => {
        setProduct(result);
        setSelectedSize(result.variants[0]?.size ?? null);
        setSelectedColor(result.variants[0]?.color ?? null);
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const sizes = useMemo(
    () => (product ? [...new Set(product.variants.map((variant) => variant.size))] : []),
    [product],
  );
  const colors = useMemo(
    () => (product ? [...new Set(product.variants.map((variant) => variant.color))] : []),
    [product],
  );

  async function handleAddToCart() {
    if (!product || !selectedSize || !selectedColor) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setMessage(null);
    setIsAdding(true);
    try {
      await addItem(product._id, 1, selectedSize, selectedColor);
      setMessage(t('product.addedToCart'));
    } catch (err) {
      setMessage(err instanceof ApiError ? err.message : t('common.error'));
    } finally {
      setIsAdding(false);
    }
  }

  if (isLoading || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {product.images.map((image) => (
            <Image
              key={image}
              source={{ uri: imageUri(image) }}
              style={[styles.image, { width: Dimensions.get('window').width }]}
            />
          ))}
        </ScrollView>
        {user && (
          <Pressable style={styles.heart} onPress={() => void toggleWishlist(product._id)}>
            <Text style={[styles.heartText, isInWishlist(product._id) && styles.heartActive]}>
              {isInWishlist(product._id) ? '♥' : '♡'}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{localize(product.name, i18n.language)}</Text>
        <Text style={styles.price}>
          {product.price} {t('common.currency')}
          {product.isOnSale && product.compareAtPrice && (
            <Text style={styles.compareAtPrice}>
              {' '}
              {product.compareAtPrice} {t('common.currency')}
            </Text>
          )}
        </Text>
        {product.isOutOfStock && <Text style={styles.outOfStock}>{t('product.outOfStock')}</Text>}

        <Text style={styles.description}>{localize(product.description, i18n.language)}</Text>

        {sizes.length > 0 && (
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>{t('product.size')}</Text>
            <View style={styles.chipRow}>
              {sizes.map((size) => (
                <Pressable
                  key={size}
                  onPress={() => setSelectedSize(size)}
                  style={[styles.chip, selectedSize === size && styles.chipActive]}
                >
                  <Text style={selectedSize === size ? styles.chipTextActive : styles.chipText}>{size}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {colors.length > 0 && (
          <View style={styles.selectorGroup}>
            <Text style={styles.selectorLabel}>{t('product.color')}</Text>
            <View style={styles.chipRow}>
              {colors.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  style={[styles.chip, selectedColor === color && styles.chipActive]}
                >
                  <Text style={selectedColor === color ? styles.chipTextActive : styles.chipText}>{color}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {user && <SizeAssistant productId={product._id} />}

        {message && <Text style={styles.message}>{message}</Text>}

        <Pressable
          style={[styles.button, (product.isOutOfStock || isAdding) && styles.buttonDisabled]}
          onPress={handleAddToCart}
          disabled={product.isOutOfStock || isAdding}
        >
          <Text style={styles.buttonText}>{isAdding ? t('common.loading') : t('product.addToCart')}</Text>
        </Pressable>

        <TryOnButton product={product} selectedColor={selectedColor} />

        <ProductReviews slug={product.slug} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  content: { padding: 16 },
  heart: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: { fontSize: 22, color: '#6b6b6b' },
  heartActive: { color: '#c0392b' },
  name: { fontSize: 20, fontWeight: '700' },
  price: { fontSize: 18, color: '#b8622e', marginTop: 6, fontWeight: '600' },
  compareAtPrice: { fontSize: 14, color: '#999', textDecorationLine: 'line-through' },
  outOfStock: { color: '#c0392b', marginTop: 4, fontSize: 13 },
  description: { fontSize: 14, color: '#4b4b4b', marginTop: 12, lineHeight: 20 },
  selectorGroup: { marginTop: 16 },
  selectorLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  button: {
    backgroundColor: '#b8622e',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  message: { marginTop: 16, fontSize: 13, color: '#2e7d32' },
});
