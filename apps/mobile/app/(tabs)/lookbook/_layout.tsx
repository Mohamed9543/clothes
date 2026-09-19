import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function LookbookLayout() {
  const { t } = useTranslation();

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('lookbook.title') }} />
      <Stack.Screen name="[id]" options={{ title: '' }} />
    </Stack>
  );
}
