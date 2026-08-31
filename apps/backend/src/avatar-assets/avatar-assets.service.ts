import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AvatarAsset, AvatarAssetDocument } from './schemas/avatar-asset.schema';
import { CreateAvatarAssetDto } from './dto/create-avatar-asset.dto';
import { UpdateAvatarAssetDto } from './dto/update-avatar-asset.dto';

@Injectable()
export class AvatarAssetsService {
  constructor(
    @InjectModel(AvatarAsset.name) private readonly avatarAssetModel: Model<AvatarAssetDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  findAllActive(): Promise<AvatarAssetDocument[]> {
    return this.avatarAssetModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  findAllAdmin(): Promise<AvatarAssetDocument[]> {
    return this.avatarAssetModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(dto: CreateAvatarAssetDto, adminUserId: string): Promise<AvatarAssetDocument> {
    const asset = await this.avatarAssetModel.create(dto);
    await this.auditLogsService.log({
      adminUserId,
      action: 'avatar_asset_created',
      targetType: 'avatar_asset',
      targetId: asset._id.toString(),
      details: dto.name,
    });
    return asset;
  }

  async update(id: string, dto: UpdateAvatarAssetDto, adminUserId: string): Promise<AvatarAssetDocument> {
    const asset = await this.avatarAssetModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!asset) {
      throw new NotFoundException('Avatar asset not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: 'avatar_asset_updated',
      targetType: 'avatar_asset',
      targetId: id,
    });
    return asset;
  }

  async remove(id: string, adminUserId: string): Promise<void> {
    const result = await this.avatarAssetModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Avatar asset not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: 'avatar_asset_removed',
      targetType: 'avatar_asset',
      targetId: id,
      details: result.name,
    });
  }
}
