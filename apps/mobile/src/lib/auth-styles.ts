import { StyleSheet } from 'react-native';

// Shared look for the (auth) screens.
export const authStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#faf8f5' },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#6b6b6b', textAlign: 'center', marginBottom: 28 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  codeInput: { textAlign: 'center', fontSize: 22, letterSpacing: 10 },
  button: {
    backgroundColor: '#b8622e',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  link: { marginTop: 20, textAlign: 'center', color: '#b8622e' },
  linkEnd: { alignSelf: 'flex-end', color: '#b8622e', fontSize: 13, marginBottom: 4 },
  error: { color: '#c0392b', marginBottom: 12, fontSize: 13 },
  notice: { color: '#2e7d32', marginBottom: 12, fontSize: 13 },
});
