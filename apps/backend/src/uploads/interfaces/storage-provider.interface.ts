/**
 * Anything that can persist an uploaded file and return its public URL.
 * Controllers/services depend only on this interface — swapping the local
 * disk stand-in for a real S3-compatible bucket later means adding a new
 * class, not touching the uploads controller.
 */
export interface StorageProvider {
  save(buffer: Buffer, filename: string, mimeType: string): Promise<{ url: string }>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
