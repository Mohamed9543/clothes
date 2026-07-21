const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export async function serverApiFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

export { API_URL };
