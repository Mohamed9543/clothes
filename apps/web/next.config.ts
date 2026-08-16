import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'localhost', port: '3000' },
    ],
    // Le backend d'upload tourne sur localhost en dev ; Next.js bloque par défaut
    // les images dont l'hôte résout vers une IP privée/loopback (protection SSRF).
    dangerouslyAllowLocalIP: true,
  },
};

export default withNextIntl(nextConfig);
