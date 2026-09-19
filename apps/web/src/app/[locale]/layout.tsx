import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Fraunces, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { routing, rtlLocales } from '@/i18n/routing';
import { APP_URL, buildAlternates } from '@/lib/seo';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { AuthProvider } from '@/context/auth-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { FittingRoomProvider } from '@/context/fitting-room-context';
import { AuthGate } from '@/components/auth/auth-gate';
import { ChatWidget } from '@/components/chat/chat-widget';
import { FittingRoomModal } from '@/components/avatar/fitting-room-modal';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-heading',
  axes: ['opsz', 'SOFT', 'WONK'],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;
  const t = await getTranslations({ locale, namespace: 'brand' });
  const alternates = buildAlternates(locale, '/');
  return {
    metadataBase: new URL(APP_URL),
    title: { default: t('name'), template: `%s · ${t('name')}` },
    description: t('tagline'),
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: t('name'),
    },
    alternates,
    openGraph: {
      siteName: t('name'),
      title: t('name'),
      description: t('tagline'),
      locale,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('name'),
      description: t('tagline'),
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#b8622e',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!hasLocale(routing.locales, rawLocale)) {
    notFound();
  }
  const locale = rawLocale;

  const messages = await getMessages();
  const dir = rtlLocales.includes(locale) ? 'rtl' : 'ltr';
  const t = await getTranslations({ locale, namespace: 'brand' });
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: t('name'),
    url: APP_URL,
    logo: `${APP_URL}/icon-512.png`,
  };

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          // Runs before paint to avoid a flash of the wrong theme.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('libas_theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script id="sw-register" strategy="afterInteractive">
          {`if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js');});}`}
        </Script>
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <FittingRoomProvider>
                  <Navbar />
                  <main className="flex-1">
                    <AuthGate>{children}</AuthGate>
                  </main>
                  <Footer />
                  <ChatWidget />
                  <FittingRoomModal />
                </FittingRoomProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
