import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../../config/env.validation';
import { StorageProvider } from '../interfaces/storage-provider.interface';

/**
 * S3-compatible driver — works against AWS S3, Cloudflare R2, DigitalOcean
 * Spaces, etc. Not live-tested against a real bucket (no credentials exist
 * yet); wired up so it activates purely via STORAGE_DRIVER=s3 + S3_* env
 * vars once real credentials are available.
 */
@Injectable()
export class S3Provider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    this.bucket = this.configService.get('S3_BUCKET', { infer: true });
    this.publicUrlBase = this.configService.get('S3_PUBLIC_URL_BASE', { infer: true });
    this.client = new S3Client({
      region: this.configService.get('S3_REGION', { infer: true }),
      endpoint: this.configService.get('S3_ENDPOINT', { infer: true }) || undefined,
      credentials: {
        accessKeyId: this.configService.get('S3_ACCESS_KEY', { infer: true }),
        secretAccessKey: this.configService.get('S3_SECRET_KEY', { infer: true }),
      },
    });
  }

  async save(buffer: Buffer, filename: string, mimeType: string): Promise<{ url: string }> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      }),
    );
    return { url: `${this.publicUrlBase.replace(/\/$/, '')}/${filename}` };
  }
}
