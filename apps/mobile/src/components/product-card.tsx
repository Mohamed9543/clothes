import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { PublicProduct } from '@/types';

// Grid card used by the home, wishlist and outfit screens (two per row).
export function ProductCard({ product }: { product: PublicProduct }) {
  const router = useRouter();
  const { t, i18n } = useTranslation();

  return (
    <Pressable style={styles.card} onPress={() => router.push(`/catalogue/${product.slug}`)}>
      {product.images[0] ? (
        <Image source={{ uri: imageUri(product.images[0]) }} style={styles.image} />
      ) : (
        <View style={styles.image} />
      )}
      <Text numberOfLines={1} style={styles.name}>
        {localize(product.name, i18n.language)}
      </Text>
      <Text style={styles.price}>
        {product.price} {t('common.currency')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  name: { fontSize: 13, fontWeight: '500', marginTop: 6, marginHorizontal: 8 },
  price: { fontSize: 13, color: '#b8622e', marginTop: 2, marginHorizontal: 8, marginBottom: 8 },
});
