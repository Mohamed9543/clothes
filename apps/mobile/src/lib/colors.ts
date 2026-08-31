// Ported verbatim from apps/web/src/lib/colors.ts.
const COLOR_MAP: Record<string, string> = {
  gris: '#9ca3af',
  beige: '#d8c3a5',
  marine: '#1e3a5f',
  noir: '#1a1a1a',
  blanc: '#f5f5f0',
  camel: '#c19a6b',
  bleu: '#3b6ea5',
  multicolore: '#b06a9a',
};

export function colorNameToHex(name: string | undefined): string {
  if (!name) return '#8a8a8a';
  return COLOR_MAP[name.trim().toLowerCase()] ?? '#8a8a8a';
}
