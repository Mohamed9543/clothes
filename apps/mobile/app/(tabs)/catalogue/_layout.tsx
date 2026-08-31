import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function CatalogueLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('nav.catalog') }} />
      <Stack.Screen name="[slug]" options={{ title: '' }} />
    </Stack>
  );
}
