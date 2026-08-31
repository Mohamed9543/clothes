import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch, API_URL } from '@/lib/api';
import { localize } from '@/lib/localized';
import type { PaginatedResult, PublicProduct } from '@/types';

const LIMIT = 20;

function imageUri(path: string): string {
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}

export default function CatalogueScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [items, setItems] = useState<PublicProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadPage = useCallback(async (targetPage: number) => {
    const result = await apiFetch<PaginatedResult<PublicProduct>>(
      `/products?page=${targetPage}&limit=${LIMIT}`,
    );
    setTotalPages(result.totalPages);
    setPage(result.page);
    return result.items;
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadPage(1)
      .then(setItems)
      .finally(() => setIsLoading(false));
  }, [loadPage]);

  async function loadMore() {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    try {
      const next = await loadPage(page + 1);
      setItems((current) => [...current, ...next]);
    } finally {
      setIsLoadingMore(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item._id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/catalogue/${item.slug}`)}
        >
          {item.images[0] ? (
            <Image source={{ uri: imageUri(item.images[0]) }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.imagePlaceholder]} />
          )}
          <Text numberOfLines={1} style={styles.name}>
            {localize(item.name, i18n.language)}
          </Text>
          <Text style={styles.price}>
            {item.price} {t('common.currency')}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 8 },
  row: { gap: 8 },
  card: { flex: 1, marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '500', marginTop: 6, marginHorizontal: 8 },
  price: { fontSize: 13, color: '#b8622e', marginTop: 2, marginHorizontal: 8, marginBottom: 8 },
});
