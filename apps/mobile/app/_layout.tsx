import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { initI18n } from '@/i18n';
import { syncNativeRtlFlag } from '@/lib/rtl';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" color="#b8622e" />
    </View>
  );
}

function RootNavigator() {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(user)}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="checkout"
          options={{ headerShown: true, title: t('checkout.title'), presentation: 'modal' }}
        />
        <Stack.Screen
          name="commandes/index"
          options={{ headerShown: true, title: t('account.myOrders') }}
        />
        <Stack.Screen
          name="commandes/[id]"
          options={{ headerShown: true, title: t('account.orderNumber') }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [isI18nReady, setIsI18nReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const locale = await initI18n();
      // On a fresh install this only takes effect after the next reload (a
      // platform limitation of I18nManager.forceRTL) — sets things up
      // correctly for that next launch rather than silently doing nothing.
      syncNativeRtlFlag(locale);
      setIsI18nReady(true);
    })();
  }, []);

  if (!isI18nReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
