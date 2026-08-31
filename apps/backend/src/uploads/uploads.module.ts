import { mkdirSync } from 'fs';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { LocalDiskProvider } from './providers/local-disk.provider';
import { S3Provider } from './providers/s3.provider';
import { UploadsController, UPLOADS_DIR } from './uploads.controller';

mkdirSync(UPLOADS_DIR, { recursive: true });

@Module({
  controllers: [UploadsController],
  providers: [
    LocalDiskProvider,
    S3Provider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService<EnvConfig, true>,
        localProvider: LocalDiskProvider,
        s3Provider: S3Provider,
      ) => {
        const driver = configService.get('STORAGE_DRIVER', { infer: true });
        if (driver === 'local') {
          return localProvider;
        }
        if (driver === 's3') {
          const requiredVars: (keyof EnvConfig)[] = [
            'S3_BUCKET',
            'S3_ACCESS_KEY',
            'S3_SECRET_KEY',
            'S3_PUBLIC_URL_BASE',
          ];
          const missing = requiredVars.filter((key) => !configService.get(key, { infer: true }));
          if (missing.length > 0) {
            // Loud failure on purpose — a misconfigured STORAGE_DRIVER=s3
            // should never silently fall back to local disk.
            throw new Error(
              `STORAGE_DRIVER=s3 requires the following env vars: ${missing.join(', ')}`,
            );
          }
          return s3Provider;
        }
        throw new Error(`STORAGE_DRIVER "${driver}" is not implemented.`);
      },
      inject: [ConfigService, LocalDiskProvider, S3Provider],
    },
  ],
})
export class UploadsModule {}
