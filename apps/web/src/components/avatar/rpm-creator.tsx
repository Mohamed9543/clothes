'use client';

import { useEffect, useRef } from 'react';

const RPM_SUBDOMAIN = 'demo';
const CREATOR_URL = `https://${RPM_SUBDOMAIN}.readyplayer.me/avatar?frameApi&bodyType=fullbody&quickStart=false&clearCache=true`;

interface RpmMessage {
  source?: string;
  eventName?: string;
  data?: { url?: string };
}

function parseRpmMessage(event: MessageEvent): RpmMessage | null {
  const json = event.data;
  if (typeof json !== 'string') return null;
  try {
    return JSON.parse(json) as RpmMessage;
  } catch {
    return null;
  }
}

export function RpmCreator({ onAvatarExported }: { onAvatarExported: (glbUrl: string) => void }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const message = parseRpmMessage(event);
      if (!message?.eventName) return;

      if (message.eventName === 'v1.frame.ready') {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            target: 'readyplayerme',
            type: 'subscribe',
            eventName: 'v1.**',
          }),
          '*',
        );
        return;
      }

      if (message.eventName === 'v1.avatar.exported' && message.data?.url) {
        onAvatarExported(message.data.url);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAvatarExported]);

  return (
    <iframe
      ref={iframeRef}
      src={CREATOR_URL}
      title="Ready Player Me"
      allow="camera *; microphone *"
      className="h-[600px] w-full rounded-xl border border-border"
    />
  );
}
