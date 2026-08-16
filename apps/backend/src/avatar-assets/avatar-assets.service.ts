import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AvatarAsset, AvatarAssetDocument } from './schemas/avatar-asset.schema';
import { CreateAvatarAssetDto } from './dto/create-avatar-asset.dto';
import { UpdateAvatarAssetDto } from './dto/update-avatar-asset.dto';

@Injectable()
export class AvatarAssetsService {
  constructor(
    @InjectModel(AvatarAsset.name) private readonly avatarAssetModel: Model<AvatarAssetDocument>,
  ) {}

  findAllActive(): Promise<AvatarAssetDocument[]> {
    return this.avatarAssetModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  findAllAdmin(): Promise<AvatarAssetDocument[]> {
    return this.avatarAssetModel.find().sort({ createdAt: -1 }).exec();
  }

  create(dto: CreateAvatarAssetDto): Promise<AvatarAssetDocument> {
    return this.avatarAssetModel.create(dto);
  }

  async update(id: string, dto: UpdateAvatarAssetDto): Promise<AvatarAssetDocument> {
    const asset = await this.avatarAssetModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!asset) {
      throw new NotFoundException('Avatar asset not found');
    }
    return asset;
  }

  async remove(id: string): Promise<void> {
    const result = await this.avatarAssetModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Avatar asset not found');
    }
  }
}
