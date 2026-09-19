import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth-context';
import { apiFetch, ApiError } from '@/lib/api';

type NumericField = 'heightCm' | 'weightKg' | 'chestCm' | 'waistCm' | 'hipsCm' | 'legLengthCm';

const GENDERS = [
  { value: 'male', labelKey: 'avatar.genderMale' },
  { value: 'female', labelKey: 'avatar.genderFemale' },
  { value: 'other', labelKey: 'avatar.genderOther' },
] as const;

const FITS = [
  { value: 'slim', labelKey: 'avatar.fitSlim' },
  { value: 'regular', labelKey: 'avatar.fitRegular' },
  { value: 'oversized', labelKey: 'avatar.fitOversized' },
] as const;

const NUMERIC_FIELDS: { field: NumericField; labelKey: string }[] = [
  { field: 'heightCm', labelKey: 'avatar.height' },
  { field: 'weightKg', labelKey: 'avatar.weight' },
  { field: 'chestCm', labelKey: 'avatar.chest' },
  { field: 'waistCm', labelKey: 'avatar.waist' },
  { field: 'hipsCm', labelKey: 'avatar.hips' },
  { field: 'legLengthCm', labelKey: 'avatar.legLength' },
];

export default function MeasurementsScreen() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();

  const [values, setValues] = useState<Record<NumericField, string>>({
    heightCm: user?.heightCm ? String(user.heightCm) : '',
    weightKg: user?.weightKg ? String(user.weightKg) : '',
    chestCm: '',
    waistCm: '',
    hipsCm: '',
    legLengthCm: '',
  });
  const [gender, setGender] = useState<string | null>(user?.gender ?? null);
  const [usualSize, setUsualSize] = useState('');
  const [fit, setFit] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleSave() {
    setMessage(null);
    setIsSaving(true);
    try {
      const body: Record<string, string | number> = {};
      for (const { field } of NUMERIC_FIELDS) {
        const parsed = parseInt(values[field], 10);
        if (!Number.isNaN(parsed)) body[field] = parsed;
      }
      if (gender) body.gender = gender;
      if (usualSize.trim()) body.usualSize = usualSize.trim();
      if (fit) body.fitPreference = fit;

      await apiFetch('/users/me', { method: 'PATCH', auth: true, body: JSON.stringify(body) });
      await refreshUser();
      setMessage({ text: t('avatar.saved'), isError: false });
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : t('common.error'), isError: true });
    } finally {
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert(t('avatar.deleteBodyProfile'), t('avatar.confirmDeleteBodyProfile'), [
      { text: t('returns.cancel'), style: 'cancel' },
      {
        text: t('avatar.deleteBodyProfile'),
        style: 'destructive',
        onPress: async () => {
          await apiFetch('/users/me/body-profile', { method: 'DELETE', auth: true });
          await refreshUser();
          setValues({ heightCm: '', weightKg: '', chestCm: '', waistCm: '', hipsCm: '', legLengthCm: '' });
          setGender(null);
          setUsualSize('');
          setFit(null);
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.intro}>{t('avatar.measurementsHint')}</Text>

      {NUMERIC_FIELDS.map(({ field, labelKey }) => (
        <View key={field}>
          <Text style={styles.label}>{t(labelKey)}</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={values[field]}
            onChangeText={(text) => setValues((current) => ({ ...current, [field]: text.replace(/\D/g, '') }))}
          />
        </View>
      ))}

      <Text style={styles.label}>{t('avatar.gender')}</Text>
      <View style={styles.chips}>
        {GENDERS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setGender(option.value)}
            style={[styles.chip, gender === option.value && styles.chipActive]}
          >
            <Text style={gender === option.value ? styles.chipTextActive : styles.chipText}>
              {t(option.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>{t('avatar.usualSize')}</Text>
      <TextInput style={styles.input} autoCapitalize="characters" maxLength={10} value={usualSize} onChangeText={setUsualSize} />

      <Text style={styles.label}>{t('avatar.fitPreference')}</Text>
      <View style={styles.chips}>
        {FITS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setFit(option.value)}
            style={[styles.chip, fit === option.value && styles.chipActive]}
          >
            <Text style={fit === option.value ? styles.chipTextActive : styles.chipText}>{t(option.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      {message && <Text style={message.isError ? styles.error : styles.success}>{message.text}</Text>}

      <Pressable style={[styles.button, isSaving && { opacity: 0.5 }]} onPress={handleSave} disabled={isSaving}>
        {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('avatar.save')}</Text>}
      </Pressable>

      <Pressable onPress={confirmDelete}>
        <Text style={styles.delete}>{t('avatar.deleteBodyProfile')}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf8f5' },
  content: { padding: 16, paddingBottom: 40 },
  intro: { fontSize: 13, color: '#6b6b6b', marginBottom: 12, lineHeight: 19 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 11, backgroundColor: '#fff' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff' },
  chipActive: { borderColor: '#b8622e', backgroundColor: '#fbe9e0' },
  chipText: { fontSize: 13 },
  chipTextActive: { fontSize: 13, color: '#b8622e', fontWeight: '600' },
  error: { color: '#c0392b', marginTop: 14, fontSize: 13 },
  success: { color: '#2e7d32', marginTop: 14, fontSize: 13 },
  button: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  delete: { color: '#c0392b', textAlign: 'center', marginTop: 20, fontSize: 13 },
});
