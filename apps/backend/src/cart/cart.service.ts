import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProductsService } from '../catalog/products.service';
import { Cart, CartDocument, CartItem } from './schemas/cart.schema';

export interface EnrichedCartItem {
  productId: string;
  slug: string;
  name: Record<string, string>;
  image: string | null;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
  subtotal: number;
}

export interface EnrichedCart {
  items: EnrichedCartItem[];
  savedForLater: EnrichedCartItem[];
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
      cart = await this.cartModel.create({ userId, items: [], savedForLater: [] });
    }
    return cart;
  }

  private async enrichItems(items: CartItem[]): Promise<EnrichedCartItem[]> {
    const enriched: EnrichedCartItem[] = [];
    for (const item of items) {
      const product = await this.productsService.findById(item.productId.toString());
      if (!product) continue;
      const variant = product.variants.find((v) => v.size === item.size && v.color === item.color);
      const unitPrice = variant?.priceOverride ?? product.price;
      enriched.push({
        productId: product._id.toString(),
        slug: product.slug,
        name: product.name as unknown as Record<string, string>,
        image: product.images[0] ?? null,
        unitPrice,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        subtotal: unitPrice * item.quantity,
      });
    }
    return enriched;
  }

  async getEnrichedCart(userId: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const [items, savedForLater] = await Promise.all([
      this.enrichItems(cart.items),
      this.enrichItems(cart.savedForLater),
    ]);

    return { items, savedForLater, total: items.reduce((sum, item) => sum + item.subtotal, 0) };
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
    size: string,
    color: string,
  ): Promise<EnrichedCart> {
    const product = await this.productsService.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const cart = await this.getOrCreate(userId);
    const existing = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size && item.color === color,
    );
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    if (this.productsService.getVariantStock(product, size, color) < nextQuantity) {
      throw new BadRequestException(`Not enough stock for size "${size}" / color "${color}"`);
    }

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ productId: new Types.ObjectId(productId), quantity, size, color });
    }
    await cart.save();

    return this.getEnrichedCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    size: string,
    color: string,
    quantity: number,
  ): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const item = cart.items.find(
      (entry) => entry.productId.toString() === productId && entry.size === size && entry.color === color,
    );
    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productsService.findById(productId);
    if (product && this.productsService.getVariantStock(product, size, color) < quantity) {
      throw new BadRequestException(`Not enough stock for size "${size}" / color "${color}"`);
    }

    item.quantity = quantity;
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async removeItem(userId: string, productId: string, size: string, color: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    cart.items = cart.items.filter(
      (entry) => !(entry.productId.toString() === productId && entry.size === size && entry.color === color),
    ) as typeof cart.items;
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async saveForLater(userId: string, productId: string, size: string, color: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const index = cart.items.findIndex(
      (entry) => entry.productId.toString() === productId && entry.size === size && entry.color === color,
    );
    if (index === -1) {
      throw new NotFoundException('Item not found in cart');
    }
    const [moved] = cart.items.splice(index, 1);
    cart.savedForLater.push(moved);
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async moveToCart(userId: string, productId: string, size: string, color: string): Promise<EnrichedCart> {
    const cart = await this.getOrCreate(userId);
    const index = cart.savedForLater.findIndex(
      (entry) => entry.productId.toString() === productId && entry.size === size && entry.color === color,
    );
    if (index === -1) {
      throw new NotFoundException('Item not found in saved-for-later list');
    }
    const [moved] = cart.savedForLater.splice(index, 1);

    const product = await this.productsService.findById(productId);
    if (!product || this.productsService.getVariantStock(product, size, color) < moved.quantity) {
      throw new BadRequestException(`Not enough stock for size "${size}" / color "${color}"`);
    }

    const existing = cart.items.find(
      (entry) => entry.productId.toString() === productId && entry.size === size && entry.color === color,
    );
    if (existing) {
      existing.quantity += moved.quantity;
    } else {
      cart.items.push(moved);
    }
    await cart.save();
    return this.getEnrichedCart(userId);
  }

  async addManyFirstAvailable(
    userId: string,
    productIds: string[],
  ): Promise<{ cart: EnrichedCart; skippedProductIds: string[] }> {
    const skippedProductIds: string[] = [];

    for (const productId of productIds) {
      const product = await this.productsService.findById(productId);
      const variant = product?.variants.find((v) => v.stock > 0);
      if (!product || !product.isActive || !variant) {
        skippedProductIds.push(productId);
        continue;
      }
      try {
        await this.addItem(userId, productId, 1, variant.size, variant.color);
      } catch {
        // Stock moved between the check above and addItem (rare race) —
        // skip this item rather than failing the whole bulk add.
        skippedProductIds.push(productId);
      }
    }

    return { cart: await this.getEnrichedCart(userId), skippedProductIds };
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
