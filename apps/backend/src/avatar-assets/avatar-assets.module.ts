import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AvatarAssetsController } from './avatar-assets.controller';
import { AvatarAssetsService } from './avatar-assets.service';
import { AvatarAsset, AvatarAssetSchema } from './schemas/avatar-asset.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: AvatarAsset.name, schema: AvatarAssetSchema }]),
    AuditLogsModule,
  ],
  controllers: [AvatarAssetsController],
  providers: [AvatarAssetsService],
})
export class AvatarAssetsModule {}
