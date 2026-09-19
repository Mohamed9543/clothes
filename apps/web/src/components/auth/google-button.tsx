'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useLocale } from 'next-intl';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleIdentity {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
}

export function GoogleButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  callbackRef.current = onCredential;

  function render() {
    const google = (window as unknown as { google?: GoogleIdentity }).google;
    if (!google || !CLIENT_ID || !containerRef.current) return;
    google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => callbackRef.current(response.credential),
    });
    google.accounts.id.renderButton(containerRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 320,
      locale: locale === 'tn' ? 'ar' : locale,
    });
  }

  // Covers the case where the GIS script is already loaded (client-side navigation).
  useEffect(render, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!CLIENT_ID) return null;
  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={render}
      />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
