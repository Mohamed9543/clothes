import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StyleForm',
    short_name: 'StyleForm',
    description: "La mode, essayée avant d'être achetée.",
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f5',
    theme_color: '#b8622e',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
