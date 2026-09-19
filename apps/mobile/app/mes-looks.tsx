import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { API_URL, apiFetch, apiUpload, ApiError } from '@/lib/api';
import { imageUri } from '@/lib/image';
import type { Look } from '@/types';

const MAX_PHOTOS = 5;

export default function MyLooksScreen() {
  const { t } = useTranslation();
  const [looks, setLooks] = useState<Look[] | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLooks(await apiFetch<Look[]>('/looks/mine', { auth: true }));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function pickPhotos() {
    setError(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - images.length,
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsUploading(true);
    try {
      for (const asset of result.assets.slice(0, MAX_PHOTOS - images.length)) {
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName ?? 'look.jpg',
          type: asset.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
        const uploaded = await apiUpload<{ url: string }>('/uploads/image', formData);
        setImages((current) => [...current, uploaded.url.startsWith('http') ? uploaded.url : `${API_URL}${uploaded.url}`]);
      }
    } catch {
      setError(t('lookbook.genericError'));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (images.length === 0) {
      setError(t('lookbook.errorNoPhoto'));
      return;
    }
    setIsSubmitting(true);
    try {
      await apiFetch('/looks', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ images, caption: caption.trim() || undefined }),
      });
      setImages([]);
      setCaption('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('lookbook.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('lookbook.submitTitle')}</Text>

        <View style={styles.thumbs}>
          {images.map((image) => (
            <Pressable key={image} onPress={() => setImages((current) => current.filter((item) => item !== image))}>
              <Image source={{ uri: imageUri(image) }} style={styles.thumb} />
            </Pressable>
          ))}
          {images.length < MAX_PHOTOS && (
            <Pressable style={[styles.thumb, styles.addThumb]} onPress={pickPhotos} disabled={isUploading}>
              {isUploading ? <ActivityIndicator color="#b8622e" /> : <Text style={styles.plus}>+</Text>}
            </Pressable>
          )}
        </View>

        <TextInput
          style={styles.input}
          placeholder={t('lookbook.captionPlaceholder')}
          value={caption}
          onChangeText={setCaption}
          multiline
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Pressable
          style={[styles.button, (isSubmitting || isUploading) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || isUploading}
        >
          <Text style={styles.buttonText}>{isSubmitting ? t('common.loading') : t('lookbook.submit')}</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>{t('lookbook.myLooksTitle')}</Text>
      {looks === null && <ActivityIndicator color="#b8622e" />}
      {looks?.length === 0 && <Text style={styles.empty}>{t('lookbook.noLooksMine')}</Text>}
      <View style={styles.grid}>
        {looks?.map((look) => (
          <View key={look._id} style={styles.lookCard}>
            <Image source={{ uri: imageUri(look.images[0]) }} style={styles.lookImage} />
            <View style={{ padding: 8 }}>
              <Text style={styles.meta}>{t('lookbook.likesCount', { count: look.likeCount })}</Text>
              <Text style={[styles.meta, { color: look.isHidden ? '#6b6b6b' : '#2e7d32' }]}>
                {look.isHidden ? t('lookbook.statusHidden') : t('lookbook.statusVisible')}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 12, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  thumb: { width: 72, height: 96, borderRadius: 8, backgroundColor: '#eee' },
  addThumb: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  plus: { fontSize: 28, color: '#b8622e' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    minHeight: 70,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  error: { color: '#c0392b', fontSize: 13, marginTop: 8 },
  button: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  empty: { color: '#6b6b6b', fontSize: 13 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lookCard: { width: '48.5%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#fff' },
  lookImage: { width: '100%', aspectRatio: 3 / 4, backgroundColor: '#eee' },
  meta: { fontSize: 12, color: '#6b6b6b' },
});
