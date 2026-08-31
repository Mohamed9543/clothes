import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '@/lib/api';
import type { Order } from '@/types';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'En attente',
  paid: 'Payée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function OrdersListScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    apiFetch<Order[]>('/orders', { auth: true }).then(setOrders);
  }, []);

  if (!orders) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Vous n’avez pas encore de commande.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(order) => order._id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/commandes/${item._id}`)}>
          <View>
            <Text style={styles.orderNumber}>#{item._id.slice(-6).toUpperCase()}</Text>
            <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</Text>
          </View>
          <View style={styles.rightColumn}>
            <Text style={styles.amount}>{item.totalAmount} TND</Text>
            <Text style={styles.status}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#6b6b6b' },
  list: { padding: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  orderNumber: { fontSize: 14, fontWeight: '600' },
  date: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  rightColumn: { alignItems: 'flex-end' },
  amount: { fontSize: 14, fontWeight: '600', color: '#b8622e' },
  status: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
});
