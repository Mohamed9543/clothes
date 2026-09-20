'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useAuth } from '@/context/auth-context';
import { AddOutfitToCartButton } from '@/components/add-outfit-to-cart-button';
import { apiFetch } from '@/lib/api';
import { AUTH_PATHS } from '@/lib/auth-paths';
import { ChatProductCard } from './chat-product-card';
import type { ChatComposedOutfit, ChatReply, ChatToolProduct, Conversation } from '@/types';

const CONVERSATION_ID_KEY = 'libas_conversation_id';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  products?: ChatToolProduct[];
  outfit?: ChatComposedOutfit;
}

export function ChatWidget() {
  const t = useTranslations('chat');
  const { user } = useAuth();
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.includes(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user || conversationId) return;

    async function initConversation() {
      setIsLoading(true);
      try {
        const storedId = localStorage.getItem(CONVERSATION_ID_KEY);
        if (storedId) {
          const conversation = await apiFetch<Conversation>(`/chat/conversations/${storedId}`, {
            auth: true,
          });
          setConversationId(conversation._id);
          setMessages(conversation.messages.map((m) => ({ role: m.role, content: m.content })));
        } else {
          const conversation = await apiFetch<Conversation>('/chat/conversations', {
            method: 'POST',
            auth: true,
          });
          localStorage.setItem(CONVERSATION_ID_KEY, conversation._id);
          setConversationId(conversation._id);
        }
      } catch {
        localStorage.removeItem(CONVERSATION_ID_KEY);
        const conversation = await apiFetch<Conversation>('/chat/conversations', {
          method: 'POST',
          auth: true,
        });
        localStorage.setItem(CONVERSATION_ID_KEY, conversation._id);
        setConversationId(conversation._id);
      } finally {
        setIsLoading(false);
      }
    }

    void initConversation();
  }, [isOpen, user, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || !conversationId || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsSending(true);

    try {
      const reply = await apiFetch<ChatReply>(`/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ content: userMessage }),
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply.message, products: reply.products, outfit: reply.outfit },
      ]);
    } catch {
      setError(t('error'));
    } finally {
      setIsSending(false);
    }
  }

  if (isAuthPage) {
    return null;
  }

  return (
    <div className="fixed bottom-4 end-4 z-50">
      {isOpen && (
        <div className="mb-3 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-medium">{t('title')}</p>
            <button onClick={() => setIsOpen(false)} aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {!user && <p className="text-sm text-muted">{t('loginRequired')}</p>}
            {!user && (
              <Link href="/login" className="text-sm text-brand-terracotta underline">
                {t('login')}
              </Link>
            )}

            {user && isLoading && <p className="text-sm text-muted">{t('thinking')}</p>}

            {user && !isLoading && messages.length === 0 && (
              <p className="rounded-lg bg-background px-3 py-2 text-sm">{t('greeting')}</p>
            )}

            {messages.map((message, index) => (
              <div key={index} className={message.role === 'user' ? 'text-end' : 'text-start'}>
                <p
                  className={`inline-block max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'bg-brand-terracotta text-white'
                      : 'bg-background text-foreground'
                  }`}
                >
                  {message.content}
                </p>
                {!message.outfit && message.products && message.products.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto">
                    {message.products.map((product) => (
                      <ChatProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {message.outfit && (
                  <div className="mt-2 rounded-lg border border-brand-gold/40 bg-background p-3 text-start">
                    <p className="text-xs font-semibold uppercase tracking-wide text-brand-terracotta">
                      {t('outfitTitle')}
                    </p>
                    <div className="mt-2 flex gap-2 overflow-x-auto">
                      {message.outfit.items.map((product) => (
                        <ChatProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    <p className="mt-2 text-sm font-medium">
                      {t('outfitTotal', { total: message.outfit.totalPrice })}
                    </p>
                    {!message.outfit.allInStock && (
                      <p className="mt-1 text-xs text-brand-terracotta">{t('outfitSomeUnavailable')}</p>
                    )}
                    <div className="mt-2">
                      <AddOutfitToCartButton productIds={message.outfit.items.map((item) => item.id)} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isSending && <p className="text-sm text-muted">{t('thinking')}</p>}
            {error && <p className="text-sm text-brand-terracotta">{error}</p>}
          </div>

          {user && (
            <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-border p-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('placeholder')}
                className="flex-1 rounded-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-gold"
              />
              <button
                type="submit"
                disabled={isSending || !input.trim()}
                aria-label={t('send')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-terracotta text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      )}

      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-label={t('openLabel')}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-terracotta text-white shadow-lg hover:opacity-90"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
