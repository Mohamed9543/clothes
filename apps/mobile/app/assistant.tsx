import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/context/cart-context';
import { apiFetch } from '@/lib/api';
import { imageUri } from '@/lib/image';
import { localize } from '@/lib/localized';
import type { BulkAddResult, ChatComposedOutfit, ChatReply, ChatToolProduct, Conversation } from '@/types';

const CONVERSATION_KEY = 'libas_conversation_id';

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products?: ChatToolProduct[];
  outfit?: ChatComposedOutfit;
}

export default function AssistantScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { refresh: refreshCart } = useCart();
  const listRef = useRef<FlatList<DisplayMessage>>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const create = () =>
        apiFetch<Conversation>('/chat/conversations', { method: 'POST', auth: true });
      try {
        const storedId = await AsyncStorage.getItem(CONVERSATION_KEY);
        let conversation: Conversation;
        try {
          conversation = storedId
            ? await apiFetch<Conversation>(`/chat/conversations/${storedId}`, { auth: true })
            : await create();
        } catch {
          conversation = await create();
        }
        await AsyncStorage.setItem(CONVERSATION_KEY, conversation._id);
        setConversationId(conversation._id);
        setMessages(
          conversation.messages.map((message, index) => ({
            id: `history-${index}`,
            role: message.role,
            content: message.content,
          })),
        );
      } catch {
        setError(t('chat.error'));
      } finally {
        setIsLoading(false);
      }
    })();
  }, [t]);

  async function handleSend() {
    const content = input.trim();
    if (!content || !conversationId || isSending) return;
    setInput('');
    setError(null);
    setMessages((current) => [...current, { id: `u-${Date.now()}`, role: 'user', content }]);
    setIsSending(true);
    try {
      const reply = await apiFetch<ChatReply>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ content }),
      });
      setMessages((current) => [
        ...current,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply.message, products: reply.products, outfit: reply.outfit },
      ]);
    } catch {
      setError(t('chat.error'));
    } finally {
      setIsSending(false);
    }
  }

  async function addOutfitToCart(outfit: ChatComposedOutfit) {
    try {
      await apiFetch<BulkAddResult>('/cart/bulk-add', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ productIds: outfit.items.map((item) => item.id) }),
      });
      await refreshCart();
      router.push('/panier');
    } catch {
      setError(t('chat.error'));
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#b8622e" />
      </View>
    );
  }

  const currency = t('common.currency');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(message) => message.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          messages.length === 0 ? <Text style={styles.greeting}>{t('chat.greeting')}</Text> : null
        }
        ListFooterComponent={isSending ? <Text style={styles.thinking}>{t('chat.thinking')}</Text> : null}
        renderItem={({ item }) => (
          <View style={[styles.bubbleRow, item.role === 'user' && styles.bubbleRowUser]}>
            <View style={[styles.bubble, item.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}>
              <Text style={item.role === 'user' ? styles.textUser : styles.textAssistant}>{item.content}</Text>

              {item.products && item.products.length > 0 && (
                <View style={{ marginTop: 8 }}>
                  {item.products.map((product) => (
                    <Pressable
                      key={product.id}
                      style={styles.productRow}
                      onPress={() => router.push(`/catalogue/${product.slug}`)}
                    >
                      {product.image && <Image source={{ uri: imageUri(product.image) }} style={styles.productImage} />}
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={styles.productName}>
                          {localize(product.name, i18n.language)}
                        </Text>
                        <Text style={styles.productPrice}>
                          {product.price} {currency}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}

              {item.outfit && (
                <View style={styles.outfit}>
                  <Text style={styles.outfitTitle}>{t('chat.outfitTitle')}</Text>
                  {item.outfit.items.map((piece) => (
                    <Text key={piece.id} style={styles.outfitItem} numberOfLines={1}>
                      • {localize(piece.name, i18n.language)} — {piece.price} {currency}
                    </Text>
                  ))}
                  <Text style={styles.outfitTotal}>{t('chat.outfitTotal', { total: item.outfit.totalPrice })}</Text>
                  {!item.outfit.allInStock && <Text style={styles.outfitWarning}>{t('chat.outfitSomeUnavailable')}</Text>}
                  <Pressable style={styles.outfitButton} onPress={() => addOutfitToCart(item.outfit as ChatComposedOutfit)}>
                    <Text style={styles.outfitButtonText}>{t('outfit.addToCart')}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={t('chat.placeholder')}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          editable={Boolean(conversationId)}
        />
        <Pressable
          style={[styles.send, (!input.trim() || isSending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || isSending}
        >
          <Text style={styles.sendText}>{t('chat.send')}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: '#faf8f5' },
  list: { padding: 12, paddingBottom: 8 },
  greeting: { textAlign: 'center', color: '#6b6b6b', marginVertical: 24, lineHeight: 20 },
  thinking: { color: '#6b6b6b', fontSize: 13, marginTop: 4 },
  bubbleRow: { flexDirection: 'row', marginBottom: 10 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '86%', borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: '#b8622e' },
  bubbleAssistant: { backgroundColor: '#fff' },
  textUser: { color: '#fff', fontSize: 14, lineHeight: 20 },
  textAssistant: { color: '#222', fontSize: 14, lineHeight: 20 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#eee' },
  productImage: { width: 44, height: 56, borderRadius: 6, backgroundColor: '#eee' },
  productName: { fontSize: 13, fontWeight: '600' },
  productPrice: { fontSize: 12, color: '#b8622e', marginTop: 2 },
  outfit: { marginTop: 10, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 },
  outfitTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
  outfitItem: { fontSize: 12, marginBottom: 2 },
  outfitTotal: { fontSize: 13, fontWeight: '700', color: '#b8622e', marginTop: 4 },
  outfitWarning: { fontSize: 12, color: '#c0392b', marginTop: 2 },
  outfitButton: { backgroundColor: '#b8622e', borderRadius: 999, paddingVertical: 9, alignItems: 'center', marginTop: 8 },
  outfitButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  error: { color: '#c0392b', fontSize: 13, textAlign: 'center', paddingBottom: 6 },
  inputRow: { flexDirection: 'row', gap: 8, padding: 10, borderTopWidth: 1, borderTopColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  send: { backgroundColor: '#b8622e', borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
});
