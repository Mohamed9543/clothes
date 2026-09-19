import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

// Password field with a show/hide (eye) toggle.
export function PasswordInput(props: Omit<TextInputProps, 'secureTextEntry'>) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        style={[styles.input, props.style]}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => setVisible((current) => !current)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={visible ? t('mobile.hidePassword') : t('mobile.showPassword')}
        style={styles.toggle}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b6b6b" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12 },
  toggle: { paddingHorizontal: 12 },
});
