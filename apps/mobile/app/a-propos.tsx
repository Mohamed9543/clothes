import { ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function AboutScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('about.title')}</Text>
      <Text style={styles.text}>{t('about.text1')}</Text>
      <Text style={styles.text}>{t('about.text2')}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 16 },
  text: { fontSize: 15, color: '#4b4b4b', lineHeight: 23, marginBottom: 14 },
});
