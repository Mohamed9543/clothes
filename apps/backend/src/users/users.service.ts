import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User, UserDocument } from './schemas/user.schema';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  create(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create({
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
    });
  }

  async updateRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.userModel.updateOne({ _id: userId }, { refreshTokenHash }).exec();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserDocument> {
    const update: UpdateProfileDto & { avatarDisabled?: boolean } = { ...dto };

    if (dto.avatarUrl) {
      const current = await this.userModel.findById(userId).select('avatarUrl').exec();
      if (current && current.avatarUrl !== dto.avatarUrl) {
        update.avatarDisabled = false;
      }
    }

    const user = await this.userModel.findByIdAndUpdate(userId, update, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async clearBodyProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          chestCm: null,
          waistCm: null,
          hipsCm: null,
          legLengthCm: null,
          usualSize: null,
          fitPreference: null,
        },
        { new: true },
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async awardPoints(userId: string, points: number): Promise<void> {
    if (points <= 0) return;
    await this.userModel.updateOne({ _id: userId }, { $inc: { loyaltyPoints: points } }).exec();
  }

  async redeemPoints(userId: string, points: number): Promise<void> {
    if (points <= 0) return;
    const result = await this.userModel
      .updateOne({ _id: userId, loyaltyPoints: { $gte: points } }, { $inc: { loyaltyPoints: -points } })
      .exec();
    if (result.matchedCount === 0) {
      throw new BadRequestException('Not enough loyalty points');
    }
  }

  findAllAdmin(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .select('-passwordHash -refreshTokenHash')
      .sort({ createdAt: -1 })
      .exec();
  }

  findAllWithAvatars(): Promise<UserDocument[]> {
    return this.userModel
      .find({ avatarUrl: { $ne: null } })
      .select('firstName lastName email avatarUrl avatarDisabled')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async setAvatarDisabled(id: string, disabled: boolean): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { avatarDisabled: disabled }, { new: true })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async setBlocked(id: string, isBlocked: boolean, adminUserId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        { isBlocked, ...(isBlocked ? { refreshTokenHash: null } : {}) },
        { new: true },
      )
      .exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: isBlocked ? 'user_blocked' : 'user_unblocked',
      targetType: 'user',
      targetId: id,
    });
    return user;
  }

  async updateAdmin(
    id: string,
    dto: { firstName?: string; lastName?: string },
    adminUserId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: 'user_updated',
      targetType: 'user',
      targetId: id,
      details: Object.keys(dto).join(', '),
    });
    return user;
  }

  async remove(id: string, adminUserId: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: 'user_deleted',
      targetType: 'user',
      targetId: id,
      details: result.email,
    });
  }
}
