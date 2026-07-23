import { mkdirSync } from 'fs';
import { Module } from '@nestjs/common';
import { UploadsController, UPLOADS_DIR } from './uploads.controller';

mkdirSync(UPLOADS_DIR, { recursive: true });

@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
