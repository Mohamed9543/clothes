import { API_URL } from '@/lib/api';

// Product/look images are either absolute URLs or paths served by the API.
export function imageUri(path: string): string {
  return path.startsWith('http') ? path : `${API_URL}${path}`;
}
