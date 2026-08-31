import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/cart-context';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const { itemCount } = useCart();

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#b8622e' }}>
      <Tabs.Screen
        name="catalogue"
        options={{
          title: t('nav.catalog'),
          headerShown: false,
          tabBarIcon: ({ focused }) => <TabIcon label="🛍️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="panier"
        options={{
          title: t('nav.cart'),
          tabBarIcon: ({ focused }) => <TabIcon label="🧺" focused={focused} />,
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
        }}
      />
      <Tabs.Screen
        name="compte"
        options={{
          title: t('nav.account'),
          tabBarIcon: ({ focused }) => <TabIcon label="👤" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
