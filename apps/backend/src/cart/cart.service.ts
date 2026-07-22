import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../catalog/products.service';
import { Cart, CartDocument } from './schemas/cart.schema';

export interface EnrichedCartItem {
  productId: string;
  slug: string;
  name: Record<string, string>;
  image: string | null;
  unitPrice: number;
  quantity: number;
  size: string;
  subtotal: number;
}

export interface EnrichedCart {
  items: EnrichedCartItem[];
  total: number;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<CartDocument>,
    private readonly productsService: ProductsService,
  ) {}

  private async getOrCreate(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ userId }).exec();
    if (!cart) {
      cart = await this.cartModel.create({ userId, items: [] });
    }
    return cart;
  }

  async getEnrichedCart(userId: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const items: EnrichedCartItem[] = [];

    for (const item of cart.items) {
      const product = await this.productsService.findById(item.productId.toString());
      if (!product) continue;
      const subtotal = product.price * item.quantity;
      items.push({
        productId: product._id.toString(),
        slug: product.slug,
        name: product.name as unknown as Record<string, string>,
        image: product.images[0] ?? null,
        unitPrice: product.price,
        quantity: item.quantity,
        size: item.size,
        subtotal,
      });
    }

    return { items, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
  }

  async addItem(userId: string, productId: string, quantity: number, size: string): Promise<EnrichedCart> {
    const product = await this.productsService.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size,
    );
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (this.productsService.getVariantStock(product, size) < nextQuantity) {
      throw new BadRequestException(`Not enough stock for size "${size}"`);
    }

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ productId: new Types.ObjectId(productId), quantity, size });
    }
    await cart.save();

    return this.getEnrichedCart(userId);
  }

  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find((entry) => entry.productId.toString() === productId);
    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productsService.findById(productId);
    if (product && this.productsService.getVariantStock(product, item.size) < quantity) {
      throw new BadRequestException(`Not enough stock for size "${item.size}"`);
    }

    item.quantity = quantity;
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async removeItem(userId: string, productId: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter((entry) => entry.productId.toString() !== productId) as typeof cart.items;
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async clear(userId: string): Promise<void> {
    const cart = await this.getOrCreate(userId);
    cart.items = [] as typeof cart.items;
    await cart.save();
  }

  async getRawCart(userId: string): Promise<CartDocument> {
    return this.getOrCreate(userId);
  }
}
