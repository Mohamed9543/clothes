import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';
import type { ProductReviewsResult, ReviewFit } from '@/types';

const FITS: ReviewFit[] = ['small', 'true_to_size', 'large'];

function Stars({ value }: { value: number }) {
  return <Text style={styles.stars}>{'★'.repeat(Math.round(value)) + '☆'.repeat(5 - Math.round(value))}</Text>;
}

export function ProductReviews({ slug }: { slug: string }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState<ProductReviewsResult | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [fit, setFit] = useState<ReviewFit | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(await apiFetch<ProductReviewsResult>(`/reviews/product/${slug}`));
  }, [slug]);

  useEffect(() => {
    load().catch(() => setData({ reviews: [], avgRating: 0, count: 0 }));
  }, [load]);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiFetch(`/reviews/product/${slug}`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ rating, comment: comment.trim(), fit: fit ?? undefined }),
      });
      setComment('');
      setFit(null);
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('review.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('review.title')}</Text>
      {data && data.count > 0 && (
        <View style={styles.summary}>
          <Stars value={data.avgRating} />
          <Text style={styles.count}>
            {data.avgRating.toFixed(1)} · {t('review.ratingCount', { count: data.count })}
          </Text>
        </View>
      )}
      {data && data.count === 0 && <Text style={styles.empty}>{t('review.noReviews')}</Text>}

      {data?.reviews.map((review) => (
        <View key={review._id} style={styles.review}>
          <View style={styles.reviewHeader}>
            <Text style={styles.author}>{review.authorName}</Text>
            <Stars value={review.rating} />
          </View>
          <Text style={styles.comment}>{review.comment}</Text>
          {review.fit && <Text style={styles.fit}>{t(`review.fit.${review.fit}`)}</Text>}
          <Text style={styles.date}>{new Date(review.createdAt).toLocaleDateString(i18n.language)}</Text>
        </View>
      ))}

      {user && !showForm && (
        <Pressable onPress={() => setShowForm(true)}>
          <Text style={styles.link}>{t('review.writeReview')}</Text>
        </Pressable>
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>{t('review.rating')}</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)}>
                <Text style={[styles.starButton, value <= rating && styles.starActive]}>★</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>{t('review.fitLabel')}</Text>
          <View style={styles.chips}>
            {FITS.map((option) => (
              <Pressable
                key={option}
                onPress={() => setFit(fit === option ? null : option)}
                style={[styles.chip, fit === option && styles.chipActive]}
              >
                <Text style={fit === option ? styles.chipTextActive : styles.chipText}>{t(`review.fit.${option}`)}</Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder={t('review.comment')}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={[styles.submit, (!comment.trim() || isSubmitting) && { opacity: 0.5 }]}
            onPress={handleSubmit}
            disabled={!comment.trim() || isSubmitting}
          >
            <Text style={styles.submitText}>{t('review.submit')}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 28 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 8 },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  stars: { color: '#e0a100', fontSize: 15 },
  count: { fontSize: 13, color: '#6b6b6b' },
  empty: { fontSize: 13, color: '#6b6b6b', marginBottom: 8 },
  review: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 13, fontWeight: '600' },
  comment: { fontSize: 13, color: '#333', marginTop: 6, lineHeight: 19 },
  fit: { fontSize: 12, color: '#6b6b6b', marginTop: 4 },
  date: { fontSize: 11, color: '#999', marginTop: 4 },
  link: { color: '#b8622e', fontWeight: '600', marginTop: 6 },
  form: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginTop: 8 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 6 },
  ratingRow: { flexDirection: 'row', gap: 6 },
  starButton: { fontSize: 28, color: '#ddd' },
  starActive: { color: '#e0a100' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 12 },
  chipTextActive: { fontSize: 12, color: '#b8622e', fontWeight: '600' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, minHeight: 70, textAlignVertical: 'top', marginTop: 10 },
  error: { color: '#c0392b', fontSize: 13, marginTop: 6 },
  submit: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 11, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: '600' },
});
