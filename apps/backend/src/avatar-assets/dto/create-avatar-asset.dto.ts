import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { AvatarAssetType } from '../schemas/avatar-asset.schema';

export class CreateAvatarAssetDto {
  @IsEnum(AvatarAssetType)
  type: AvatarAssetType;

  @IsString()
  name: string;

  @IsString()
  modelUrl: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
