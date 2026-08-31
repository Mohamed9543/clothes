import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Product, ProductDocument } from '../catalog/schemas/product.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateLookDto } from './dto/create-look.dto';
import { QueryLooksDto } from './dto/query-looks.dto';
import { Look, LookDocument } from './schemas/look.schema';
import { LookLike, LookLikeDocument } from './schemas/look-like.schema';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LookProductSummary {
  _id: string;
  slug: string;
  name: Product['name'];
  image: string | null;
}

export interface EnrichedLook {
  _id: string;
  userId: string;
  authorName: string;
  images: string[];
  caption: string | null;
  productIds: string[];
  products: LookProductSummary[];
  likeCount: number;
  reportCount: number;
  isHidden: boolean;
  createdAt: Date;
}

@Injectable()
export class LooksService {
  constructor(
    @InjectModel(Look.name) private readonly lookModel: Model<LookDocument>,
    @InjectModel(LookLike.name) private readonly lookLikeModel: Model<LookLikeDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  private async enrichLooks(looks: LookDocument[]): Promise<EnrichedLook[]> {
    const userIds = [...new Set(looks.map((look) => look.userId))];
    const users = await this.userModel.find({ _id: { $in: userIds } }).exec();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    const productIds = [...new Set(looks.flatMap((look) => look.productIds))];
    const products =
      productIds.length > 0 ? await this.productModel.find({ _id: { $in: productIds } }).exec() : [];
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    return looks.map((look) => {
      const user = userMap.get(look.userId);
      const authorName = user
        ? `${user.firstName} ${user.lastName ? `${user.lastName[0]}.` : ''}`.trim()
        : 'Utilisateur';
      const obj = look.toObject();
      return {
        ...obj,
        _id: obj._id.toString(),
        authorName,
        products: look.productIds.reduce<LookProductSummary[]>((summaries, id) => {
          const product = productMap.get(id);
          if (product) {
            summaries.push({
              _id: product._id.toString(),
              slug: product.slug,
              name: product.name,
              image: product.images[0] ?? null,
            });
          }
          return summaries;
        }, []),
      };
    });
  }

  async create(userId: string, dto: CreateLookDto): Promise<LookDocument> {
    const requestedProductIds = dto.productIds ?? [];
    const validProductIds =
      requestedProductIds.length > 0
        ? (
            await this.productModel.find({ _id: { $in: requestedProductIds } }, { _id: 1 }).exec()
          ).map((product) => product._id.toString())
        : [];

    return this.lookModel.create({
      userId,
      images: dto.images,
      caption: dto.caption ?? null,
      productIds: validProductIds,
      isHidden: false,
    });
  }

  async findPublicFeed(query: QueryLooksDto): Promise<PaginatedResult<EnrichedLook>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [looks, total] = await Promise.all([
      this.lookModel
        .find({ isHidden: false })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.lookModel.countDocuments({ isHidden: false }).exec(),
    ]);

    const items = await this.enrichLooks(looks);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<EnrichedLook> {
    const look = await this.lookModel.findOne({ _id: id, isHidden: false }).exec();
    if (!look) {
      throw new NotFoundException('Look not found');
    }
    const [enriched] = await this.enrichLooks([look]);
    return enriched;
  }

  async findForUser(userId: string): Promise<EnrichedLook[]> {
    const looks = await this.lookModel.find({ userId }).sort({ createdAt: -1 }).exec();
    return this.enrichLooks(looks);
  }

  async toggleLike(lookId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const look = await this.lookModel.findOne({ _id: lookId, isHidden: false }).exec();
    if (!look) {
      throw new NotFoundException('Look not found');
    }

    try {
      await this.lookLikeModel.create({ lookId, userId });
      const updated = await this.lookModel
        .findByIdAndUpdate(lookId, { $inc: { likeCount: 1 } }, { new: true })
        .exec();
      return { liked: true, likeCount: updated?.likeCount ?? look.likeCount + 1 };
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
      // Duplicate key on the unique {lookId, userId} index means this user
      // already liked the look — toggling off is the correct behavior.
      await this.lookLikeModel.deleteOne({ lookId, userId }).exec();
      const updated = await this.lookModel
        .findByIdAndUpdate(lookId, { $inc: { likeCount: -1 } }, { new: true })
        .exec();
      return { liked: false, likeCount: updated?.likeCount ?? Math.max(0, look.likeCount - 1) };
    }
  }

  async getUserLikedLookIds(userId: string, lookIds: string[]): Promise<string[]> {
    const likes = await this.lookLikeModel.find({ userId, lookId: { $in: lookIds } }).exec();
    return likes.map((like) => like.lookId);
  }

  async report(id: string): Promise<void> {
    const look = await this.lookModel
      .findByIdAndUpdate(id, { $inc: { reportCount: 1 } }, { new: true })
      .exec();
    if (!look) {
      throw new BadRequestException('Look not found');
    }
  }

  async findAllAdmin(query: QueryLooksDto): Promise<PaginatedResult<EnrichedLook>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [looks, total] = await Promise.all([
      this.lookModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.lookModel.countDocuments().exec(),
    ]);

    const items = await this.enrichLooks(looks);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async setHidden(id: string, isHidden: boolean, adminUserId: string): Promise<LookDocument> {
    const look = await this.lookModel.findByIdAndUpdate(id, { isHidden }, { new: true }).exec();
    if (!look) {
      throw new BadRequestException('Look not found');
    }
    await this.auditLogsService.log({
      adminUserId,
      action: 'look_moderated',
      targetType: 'look',
      targetId: id,
      details: isHidden ? 'hidden' : 'unhidden',
    });
    return look;
  }

  async remove(id: string, adminUserId: string): Promise<void> {
    const result = await this.lookModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException('Look not found');
    }
    await this.lookLikeModel.deleteMany({ lookId: id }).exec();
    await this.auditLogsService.log({
      adminUserId,
      action: 'look_deleted',
      targetType: 'look',
      targetId: id,
    });
  }
}
