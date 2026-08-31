import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/i18n';
import { applyLocale } from '@/lib/rtl';

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
  tn: 'تونسي',
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isSwitching, setIsSwitching] = useState(false);
  const current = i18n.language as SupportedLocale;

  async function handleSelect(locale: SupportedLocale) {
    if (locale === current || isSwitching) return;
    setIsSwitching(true);
    try {
      const result = await applyLocale(locale);
      if (result.manualRestartNeeded) {
        Alert.alert(t('mobile.restartRequiredTitle'), t('mobile.restartRequiredText') + ' ' + t('mobile.restartManual'));
      }
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('mobile.languagePickerTitle')}</Text>
      <View style={styles.row}>
        {SUPPORTED_LOCALES.map((locale) => (
          <Pressable
            key={locale}
            onPress={() => handleSelect(locale)}
            disabled={isSwitching}
            style={[styles.chip, current === locale && styles.chipActive]}
          >
            <Text style={current === locale ? styles.chipTextActive : styles.chipText}>
              {LOCALE_LABELS[locale]}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
});
