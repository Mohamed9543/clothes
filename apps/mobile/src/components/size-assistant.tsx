import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import type { SizeRecommendation } from '@/types';

// Suggests a size from the customer's saved measurements.
export function SizeAssistant({ productId }: { productId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [recommendation, setRecommendation] = useState<SizeRecommendation | null>(null);

  useEffect(() => {
    apiFetch<SizeRecommendation>(`/size-assistant/recommend/${productId}`, { auth: true })
      .then(setRecommendation)
      .catch(() => setRecommendation(null));
  }, [productId]);

  if (!recommendation) return null;

  if (recommendation.confidence === 'none') {
    return (
      <View style={styles.box}>
        <Text style={styles.text}>{recommendation.message}</Text>
        <Pressable onPress={() => router.push('/mensurations')}>
          <Text style={styles.link}>{t('sizeAssistant.fillProfile')}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        <Text style={styles.bold}>{t('sizeAssistant.title')}</Text> {recommendation.recommendedSize} —{' '}
        {recommendation.confidence === 'high' ? t('sizeAssistant.confidenceHigh') : t('sizeAssistant.confidenceMedium')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#fbe9e0', borderRadius: 10, padding: 12, marginTop: 14 },
  text: { fontSize: 13, color: '#4b4b4b' },
  bold: { fontWeight: '700' },
  link: { color: '#b8622e', fontWeight: '600', marginTop: 6, fontSize: 13 },
});
