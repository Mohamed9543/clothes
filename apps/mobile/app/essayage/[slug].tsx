import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { colorNameToHex } from '@/lib/colors';
import { localize } from '@/lib/localized';
import { useAuth } from '@/context/auth-context';
import { AvatarViewer } from '@/components/avatar-viewer';
import type { PublicProduct } from '@/types';

export default function TryOnScreen() {
  const { slug, color } = useLocalSearchParams<{ slug: string; color?: string }>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    apiFetch<PublicProduct>(`/products/${slug}`).then(setProduct);
  }, [slug]);

  useEffect(() => {
    if (product) {
      navigation.setOptions({ title: localize(product.name, i18n.language) });
    }
  }, [product, navigation, i18n.language]);

  if (!user?.avatarUrl || !product) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {hasLoadError ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{t('avatar.loadError')}</Text>
        </View>
      ) : (
        <AvatarViewer
          avatarUrl={user.avatarUrl}
          heightCm={user.heightCm}
          weightKg={user.weightKg}
          overlay={{
            type: product.type,
            colorHex: colorNameToHex(color || product.variants[0]?.color),
            modelUrl: product.modelUrl,
          }}
          onLoadError={() => setHasLoadError(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 14, color: '#6b6b6b', textAlign: 'center' },
});
