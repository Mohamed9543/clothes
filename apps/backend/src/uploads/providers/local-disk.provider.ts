import { join } from 'path';
import { writeFile } from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { StorageProvider } from '../interfaces/storage-provider.interface';
import { UPLOADS_DIR } from '../uploads.controller';

/**
 * Default driver — writes to the local `uploads/` directory and returns the
 * same `/uploads/<filename>` URL shape the app has always used. Behavior is
 * unchanged from before the StorageProvider adapter was introduced.
 */
@Injectable()
export class LocalDiskProvider implements StorageProvider {
  async save(buffer: Buffer, filename: string): Promise<{ url: string }> {
    await writeFile(join(UPLOADS_DIR, filename), buffer);
    return { url: `/uploads/${filename}` };
  }
}
