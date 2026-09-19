import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '@/components/product-card';
import { useWishlist } from '@/context/wishlist-context';
import { apiFetch } from '@/lib/api';
import type { PublicProduct } from '@/types';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { lists, removeFromList, createList } = useWishlist();
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [products, setProducts] = useState<Record<string, PublicProduct>>({});
  const [newListName, setNewListName] = useState('');

  const activeList = lists.find((list) => list._id === activeListId) ?? lists.find((list) => list.isDefault) ?? lists[0];
  const productIds = activeList?.productIds.join(',') ?? '';

  useEffect(() => {
    if (!productIds) {
      setProducts({});
      return;
    }
    let cancelled = false;
    apiFetch<PublicProduct[]>(`/products/by-ids?ids=${productIds}`)
      .then((items) => {
        if (!cancelled) setProducts(Object.fromEntries(items.map((product) => [product._id, product])));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productIds]);

  const items = activeList ? activeList.productIds.map((id) => products[id]).filter(Boolean) : [];

  async function handleCreate() {
    if (!newListName.trim()) return;
    await createList(newListName.trim());
    setNewListName('');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {lists.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {lists.map((list) => (
            <Pressable
              key={list._id}
              onPress={() => setActiveListId(list._id)}
              style={[styles.chip, activeList?._id === list._id && styles.chipActive]}
            >
              <Text style={activeList?._id === list._id ? styles.chipTextActive : styles.chipText}>
                {list.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('wishlist.empty')}</Text>
          <Pressable onPress={() => router.push('/catalogue')}>
            <Text style={styles.link}>{t('wishlist.browseCatalog')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.grid}>
          {items.map((product) => (
            <View key={product._id} style={styles.cell}>
              <ProductCard product={product} />
              <Pressable onPress={() => activeList && void removeFromList(activeList._id, product._id)}>
                <Text style={styles.remove}>{t('wishlist.remove')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.newList}>
        <TextInput
          style={styles.input}
          placeholder={t('wishlist.newListPlaceholder')}
          value={newListName}
          onChangeText={setNewListName}
        />
        <Pressable style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.createText}>{t('wishlist.createList')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 12, paddingBottom: 32 },
  chips: { gap: 8, paddingBottom: 12 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  empty: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' },
  emptyText: { color: '#6b6b6b', marginBottom: 12 },
  link: { color: '#b8622e', textDecorationLine: 'underline' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: { width: '48.5%' },
  remove: { textAlign: 'center', color: '#b8622e', fontSize: 12, marginBottom: 12, textDecorationLine: 'underline' },
  newList: { flexDirection: 'row', gap: 8, marginTop: 24 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  createButton: { borderWidth: 1, borderColor: '#b8622e', borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  createText: { color: '#b8622e', fontWeight: '600' },
});
