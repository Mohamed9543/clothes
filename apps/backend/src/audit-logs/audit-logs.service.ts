import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { AuditLog, AuditLogDocument } from './schemas/audit-log.schema';

export interface CreateAuditLogInput {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: string | null;
}

export interface EnrichedAuditLog {
  _id: string;
  adminUserId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string | null;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private readonly auditLogModel: Model<AuditLogDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async log(input: CreateAuditLogInput): Promise<void> {
    await this.auditLogModel.create({
      adminUserId: input.adminUserId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details ?? null,
    });
  }

  async findAllAdmin(page = 1, limit = 50): Promise<PaginatedResult<EnrichedAuditLog>> {
    const [logs, total] = await Promise.all([
      this.auditLogModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.auditLogModel.countDocuments().exec(),
    ]);

    const adminIds = [...new Set(logs.map((log) => log.adminUserId.toString()))];
    const admins = await this.userModel.find({ _id: { $in: adminIds } }).exec();
    const adminMap = new Map(admins.map((admin) => [admin._id.toString(), admin]));

    const items: EnrichedAuditLog[] = logs.map((log) => {
      const admin = adminMap.get(log.adminUserId.toString());
      return {
        _id: log._id.toString(),
        adminUserId: log.adminUserId.toString(),
        adminName: admin ? `${admin.firstName} ${admin.lastName}` : 'Admin',
        action: log.action,
        targetType: log.targetType,
        targetId: log.targetId,
        details: log.details,
        createdAt: log.createdAt,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
