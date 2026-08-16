import { PartialType } from '@nestjs/mapped-types';
import { CreateAvatarAssetDto } from './create-avatar-asset.dto';

export class UpdateAvatarAssetDto extends PartialType(CreateAvatarAssetDto) {}
