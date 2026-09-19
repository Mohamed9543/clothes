import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { PaginatedResult, PublicProduct } from '@/types';

const LIMIT = 20;
const AUDIENCES = ['men', 'women', 'kids'] as const;
const TYPES = ['pull', 'pantalon', 'chemise', 'robe', 'veste', 'chaussure', 'accessoire'] as const;
const SORTS = ['newest', 'price_asc', 'price_desc'] as const;

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={active ? styles.chipTextActive : styles.chipText}>{label}</Text>
    </Pressable>
  );
}

export default function CatalogueScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const params = useLocalSearchParams<{ audience?: string }>();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [audience, setAudience] = useState<string | null>(params.audience ?? null);
  const [type, setType] = useState<string | null>(null);
  const [sort, setSort] = useState<(typeof SORTS)[number]>('newest');

  const [items, setItems] = useState<PublicProduct[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // A category tapped on the home screen arrives as a route param.
  useEffect(() => {
    if (params.audience) setAudience(params.audience);
  }, [params.audience]);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(handle);
  }, [search]);

  const loadPage = useCallback(
    async (targetPage: number) => {
      const query = new URLSearchParams({ page: String(targetPage), limit: String(LIMIT), sort });
      if (audience) query.set('audience', audience);
      if (type) query.set('type', type);
      if (debouncedSearch) query.set('search', debouncedSearch);
      const result = await apiFetch<PaginatedResult<PublicProduct>>(`/products?${query.toString()}`);
      setTotalPages(result.totalPages);
      setPage(result.page);
      return result.items;
    },
    [audience, type, sort, debouncedSearch],
  );

  useEffect(() => {
    setIsLoading(true);
    loadPage(1)
      .then(setItems)
      .catch(() => setItems([]))
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

  const header = (
    <View style={styles.filters}>
      <TextInput
        style={styles.search}
        placeholder={t('nav.searchPlaceholder')}
        value={search}
        onChangeText={setSearch}
        returnKeyType="search"
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label={t('catalog.all')} active={audience === null} onPress={() => setAudience(null)} />
        {AUDIENCES.map((value) => (
          <Chip
            key={value}
            label={t(`catalog.${value}`)}
            active={audience === value}
            onPress={() => setAudience(audience === value ? null : value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        <Chip label={t('catalog.all')} active={type === null} onPress={() => setType(null)} />
        {TYPES.map((value) => (
          <Chip
            key={value}
            label={t(`catalog.${value}`)}
            active={type === value}
            onPress={() => setType(type === value ? null : value)}
          />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {SORTS.map((value) => (
          <Chip key={value} label={t(`catalog.sort.${value}`)} active={sort === value} onPress={() => setSort(value)} />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      data={isLoading ? [] : items}
      keyExtractor={(item) => item._id}
      numColumns={2}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={header}
      ListEmptyComponent={
        isLoading ? (
          <ActivityIndicator size="large" color="#b8622e" style={{ marginTop: 40 }} />
        ) : (
          <Text style={styles.empty}>{t('catalog.noResults')}</Text>
        )
      }
      ListFooterComponent={isLoadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} /> : null}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/catalogue/${item.slug}`)}>
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
  list: { padding: 8 },
  row: { gap: 8 },
  filters: { paddingBottom: 8, gap: 8 },
  search: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  chipRow: { gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff' },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6b6b6b', marginTop: 40 },
  card: { flex: 1, marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 13, fontWeight: '500', marginTop: 6, marginHorizontal: 8 },
  price: { fontSize: 13, color: '#b8622e', marginTop: 2, marginHorizontal: 8, marginBottom: 8 },
});
