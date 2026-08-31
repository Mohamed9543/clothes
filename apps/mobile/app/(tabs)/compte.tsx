import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
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
        <Text style={styles.loyaltyLabel}>Points de fidélité</Text>
        <Text style={styles.loyaltyValue}>{user.loyaltyPoints}</Text>
      </View>

      <Pressable style={styles.row} onPress={() => router.push('/commandes')}>
        <Text style={styles.rowText}>Mes commandes</Text>
      </Pressable>

      <Pressable style={styles.logoutButton} onPress={() => logout()}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5', padding: 16 },
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
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700' },
  name: { fontSize: 15, fontWeight: '600' },
  email: { fontSize: 13, color: '#6b6b6b', marginTop: 2 },
  loyaltyLabel: { fontSize: 13, color: '#6b6b6b' },
  loyaltyValue: { fontSize: 20, fontWeight: '700', color: '#b8622e', marginLeft: 'auto' },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  rowText: { fontSize: 14, fontWeight: '500' },
  logoutButton: { marginTop: 8, alignItems: 'center', paddingVertical: 12 },
  logoutText: { color: '#c0392b', fontSize: 14, fontWeight: '600' },
});
