import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { imageUri } from '@/lib/image';
import type { Look, PaginatedResult } from '@/types';

export default function LookbookScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await apiFetch<PaginatedResult<Look>>('/looks?page=1&limit=24').catch(() => null);
    setLooks(result?.items ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (looks === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <FlatList
      data={looks}
      keyExtractor={(look) => look._id}
      numColumns={2}
      contentContainerStyle={styles.list}
      columnWrapperStyle={styles.row}
      refreshing={isRefreshing}
      onRefresh={async () => {
        setIsRefreshing(true);
        await load();
        setIsRefreshing(false);
      }}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.subtitle}>{t('lookbook.subtitle')}</Text>
          <Pressable onPress={() => router.push('/mes-looks')}>
            <Text style={styles.link}>{t('account.myLooks')}</Text>
          </Pressable>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>{t('lookbook.empty')}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/lookbook/${item._id}`)}>
          <Image source={{ uri: imageUri(item.images[0]) }} style={styles.image} />
          <View style={styles.meta}>
            <Text numberOfLines={1} style={styles.author}>
              {item.authorName}
            </Text>
            <Text style={styles.likes}>♥ {item.likeCount}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 8 },
  row: { gap: 8 },
  header: { paddingHorizontal: 4, paddingBottom: 12 },
  subtitle: { fontSize: 13, color: '#6b6b6b' },
  link: { color: '#b8622e', marginTop: 8, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6b6b6b', marginTop: 32 },
  card: { flex: 1, marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', padding: 8 },
  author: { flex: 1, fontSize: 12, fontWeight: '500' },
  likes: { fontSize: 12, color: '#b8622e' },
});
