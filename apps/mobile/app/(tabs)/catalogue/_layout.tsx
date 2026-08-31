import { Stack } from 'expo-router';

export default function CatalogueLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Catalogue' }} />
      <Stack.Screen name="[slug]" options={{ title: '' }} />
    </Stack>
  );
}
