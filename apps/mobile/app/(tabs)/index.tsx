import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProductGrid } from '@/components/product-grid';
import { apiFetch } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { Outfit, PaginatedResult, PublicProduct } from '@/types';

const CATEGORIES = [
  { audience: 'men', labelKey: 'home.categoryMen' },
  { audience: 'women', labelKey: 'home.categoryWomen' },
  { audience: 'kids', labelKey: 'home.categoryKids' },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<PublicProduct[] | null>(null);
  const [outfits, setOutfits] = useState<Outfit[]>([]);

  useEffect(() => {
    apiFetch<PaginatedResult<PublicProduct>>('/products?limit=8')
      .then((result) => setProducts(result.items))
      .catch(() => setProducts([]));
    apiFetch<Outfit[]>('/outfits/featured')
      .then(setOutfits)
      .catch(() => setOutfits([]));
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
        <Text style={styles.heroSubtitle}>{t('home.heroSubtitle')}</Text>
        <Pressable style={styles.heroButton} onPress={() => router.push('/catalogue')}>
          <Text style={styles.heroButtonText}>{t('home.heroCta')}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t('home.categoriesTitle')}</Text>
      <View style={styles.categories}>
        {CATEGORIES.map((category) => (
          <Pressable
            key={category.audience}
            style={styles.category}
            onPress={() => router.push(`/catalogue?audience=${category.audience}`)}
          >
            <Text style={styles.categoryText}>{t(category.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.assistant} onPress={() => router.push('/assistant')}>
        <Text style={styles.assistantEmoji}>💬</Text>
        <Text style={styles.assistantText}>{t('chat.title')}</Text>
      </Pressable>

      {outfits.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>{t('home.outfitsTitle')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.outfitRow}>
            {outfits.map((outfit) => (
              <Pressable
                key={outfit._id}
                style={styles.outfit}
                onPress={() => router.push(`/tenue/${outfit.slug}`)}
              >
                <Image source={{ uri: imageUri(outfit.coverImage) }} style={styles.outfitImage} />
                <Text numberOfLines={1} style={styles.outfitTitle}>
                  {localize(outfit.title, i18n.language)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </>
      )}

      <Text style={styles.sectionTitle}>{t('home.featuredTitle')}</Text>
      {products === null ? (
        <ActivityIndicator color="#b8622e" style={{ marginVertical: 24 }} />
      ) : (
        <ProductGrid products={products} />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 12, paddingBottom: 32 },
  hero: { backgroundColor: '#b8622e', borderRadius: 16, padding: 24, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 26, fontWeight: '700' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, lineHeight: 20 },
  heroButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 11,
    marginTop: 18,
  },
  heroButtonText: { color: '#b8622e', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  categories: { flexDirection: 'row', gap: 8 },
  category: {
    flex: 1,
    height: 84,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: { fontSize: 15, fontWeight: '600' },
  assistant: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fbe9e0',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
  },
  assistantEmoji: { fontSize: 22 },
  assistantText: { fontSize: 14, fontWeight: '600', color: '#b8622e' },
  outfitRow: { gap: 10 },
  outfit: { width: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  outfitImage: { width: '100%', height: 200, backgroundColor: '#eee' },
  outfitTitle: { fontSize: 13, fontWeight: '600', margin: 8 },
});
