import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { Look } from '@/types';

export default function LookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const [look, setLook] = useState<Look | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    apiFetch<Look>(`/looks/${id}`).then((result) => {
      setLook(result);
      setLikeCount(result.likeCount);
    });
    apiFetch<{ liked: boolean }>(`/looks/${id}/like-status`, { auth: true })
      .then((result) => setLiked(result.liked))
      .catch(() => {});
  }, [id]);

  async function toggleLike() {
    if (isToggling) return;
    setIsToggling(true);
    try {
      const result = await apiFetch<{ liked: boolean; likeCount: number }>(`/looks/${id}/like`, {
        method: 'POST',
        auth: true,
      });
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } finally {
      setIsToggling(false);
    }
  }

  if (!look) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      {look.images.map((image) => (
        <Image key={image} source={{ uri: imageUri(image) }} style={styles.image} />
      ))}

      <View style={styles.content}>
        <View style={styles.authorRow}>
          <Text style={styles.author}>{look.authorName}</Text>
          <Pressable onPress={toggleLike} disabled={isToggling} accessibilityLabel={t('lookbook.like')}>
            <Text style={[styles.like, liked && styles.liked]}>
              {liked ? '♥' : '♡'} {likeCount}
            </Text>
          </Pressable>
        </View>

        {look.caption && <Text style={styles.caption}>{look.caption}</Text>}

        {look.products.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={styles.sectionTitle}>{t('lookbook.linkedProducts')}</Text>
            <View style={styles.chips}>
              {look.products.map((product) => (
                <Pressable
                  key={product._id}
                  style={styles.chip}
                  onPress={() => router.push(`/catalogue/${product.slug}`)}
                >
                  <Text style={styles.chipText}>{localize(product.name, i18n.language)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5' },
  image: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee', marginBottom: 2 },
  content: { padding: 16 },
  authorRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 16, fontWeight: '600' },
  like: { fontSize: 18, color: '#6b6b6b' },
  liked: { color: '#c0392b' },
  caption: { fontSize: 14, color: '#4b4b4b', marginTop: 10, lineHeight: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 13 },
});
