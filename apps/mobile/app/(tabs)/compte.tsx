import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { LanguageSwitcher } from '@/components/language-switcher';

const ROWS = [
  { href: '/commandes', icon: '📦', labelKey: 'account.myOrders' },
  { href: '/wishlist', icon: '♡', labelKey: 'nav.wishlist' },
  { href: '/retours', icon: '↩️', labelKey: 'returns.title' },
  { href: '/mes-looks', icon: '📸', labelKey: 'account.myLooks' },
  { href: '/mensurations', icon: '📏', labelKey: 'avatar.measurements' },
  { href: '/assistant', icon: '💬', labelKey: 'chat.title' },
  { href: '/a-propos', icon: 'ℹ️', labelKey: 'nav.about' },
] as const;

export default function AccountScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName[0]?.toUpperCase()}
            {user.lastName[0]?.toUpperCase()}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.loyaltyText}>
          {t('account.loyaltyPoints', { points: user.loyaltyPoints })}
        </Text>
      </View>

      <LanguageSwitcher />

      {ROWS.map((row) => (
        <Pressable key={row.href} style={styles.row} onPress={() => router.push(row.href)}>
          <Text style={styles.rowText}>
            {row.icon}  {t(row.labelKey)}
          </Text>
        </Pressable>
      ))}

      <Pressable style={styles.logoutButton} onPress={() => logout()}>
        <Text style={styles.logoutText}>{t('nav.logout')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#b8622e',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 13, color: '#6b6b6b', marginTop: 2 },
  loyaltyText: { fontSize: 14, fontWeight: '600', color: '#b8622e' },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  rowText: { fontSize: 14, fontWeight: '500' },
  logoutButton: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: '#c0392b', fontSize: 14, fontWeight: '600' },
});
