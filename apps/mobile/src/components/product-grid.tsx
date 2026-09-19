import { StyleSheet, View } from 'react-native';
import { ProductCard } from '@/components/product-card';
import type { PublicProduct } from '@/types';

// Two-column grid that can sit inside a ScrollView (a FlatList can't).
export function ProductGrid({ products }: { products: PublicProduct[] }) {
  const rows: PublicProduct[][] = [];
  for (let index = 0; index < products.length; index += 2) {
    rows.push(products.slice(index, index + 2));
  }

  return (
    <View>
      {rows.map((row) => (
        <View key={row[0]._id} style={styles.row}>
          {row.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
          {row.length === 1 && <View style={{ flex: 1 }} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
});
