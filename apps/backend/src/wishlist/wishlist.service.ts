import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

const DEFAULT_LIST_NAME = 'Ma liste';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private readonly wishlistModel: Model<WishlistDocument>,
  ) {}

  findAllForUser(userId: string): Promise<WishlistDocument[]> {
    return this.wishlistModel.find({ userId }).sort({ createdAt: 1 }).exec();
  }

  private async assertOwned(userId: string, listId: string): Promise<WishlistDocument> {
    const list = await this.wishlistModel.findById(listId).exec();
    if (!list) {
      throw new NotFoundException('Wishlist not found');
    }
    if (list.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return list;
  }

  async getOrCreateDefault(userId: string): Promise<WishlistDocument> {
    const existing = await this.wishlistModel.findOne({ userId, isDefault: true }).exec();
    if (existing) return existing;
    return this.wishlistModel.create({ userId, name: DEFAULT_LIST_NAME, isDefault: true });
  }

  createList(userId: string, name: string): Promise<WishlistDocument> {
    return this.wishlistModel.create({ userId, name, isDefault: false });
  }

  async addItem(userId: string, listId: string, productId: string): Promise<WishlistDocument> {
    const list = await this.assertOwned(userId, listId);
    if (!list.productIds.includes(productId)) {
      list.productIds.push(productId);
      await list.save();
    }
    return list;
  }

  async removeItem(userId: string, listId: string, productId: string): Promise<WishlistDocument> {
    const list = await this.assertOwned(userId, listId);
    list.productIds = list.productIds.filter((id) => id !== productId);
    await list.save();
    return list;
  }

  async deleteList(userId: string, listId: string): Promise<void> {
    const list = await this.assertOwned(userId, listId);
    if (list.isDefault) {
      const count = await this.wishlistModel.countDocuments({ userId }).exec();
      if (count <= 1) {
        throw new BadRequestException('Cannot delete your only wishlist');
      }
    }
    await this.wishlistModel.findByIdAndDelete(listId).exec();
  }
}
