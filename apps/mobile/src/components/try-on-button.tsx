import { Pressable, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/auth-context';
import type { PublicProduct } from '@/types';

export function TryOnButton({
  product,
  selectedColor,
}: {
  product: PublicProduct;
  selectedColor?: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  if (!product.tryOnEnabled) {
    return null;
  }

  if (user?.avatarUrl && user.avatarDisabled) {
    return <Text style={styles.hint}>{t('avatar.avatarDisabledMessage')}</Text>;
  }

  if (!user?.avatarUrl) {
    return <Text style={styles.hint}>{t('avatar.createAvatarFirst')}</Text>;
  }

  return (
    <Pressable
      style={styles.button}
      onPress={() => {
        apiFetch('/analytics/track', {
          method: 'POST',
          auth: true,
          body: JSON.stringify({ type: 'tryon_opened' }),
        }).catch(() => {});
        router.push({
          pathname: '/essayage/[slug]',
          params: { slug: product.slug, color: selectedColor ?? '' },
        });
      }}
    >
      <Text style={styles.buttonText}>{t('avatar.tryOn')}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: { fontSize: 15, fontWeight: '500' },
  hint: { marginTop: 12, textAlign: 'center', fontSize: 13, color: '#b8622e' },
});
