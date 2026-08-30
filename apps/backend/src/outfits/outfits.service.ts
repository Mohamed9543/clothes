import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../catalog/schemas/product.schema';
import { CreateOutfitDto } from './dto/create-outfit.dto';
import { UpdateOutfitDto } from './dto/update-outfit.dto';
import { Outfit, OutfitDocument } from './schemas/outfit.schema';

export interface OutfitWithProducts {
  _id: unknown;
  slug: string;
  title: Outfit['title'];
  description: Outfit['description'];
  coverImage: string;
  productIds: string[];
  isActive: boolean;
  isFeatured: boolean;
  bundleDiscountPercent: number | null;
  createdAt: Date;
  products: Product[];
  totalPrice: number;
  bundlePrice: number | null;
}

export interface ApplicableBundle {
  outfitSlug: string;
  productIds: string[];
  percent: number;
}

@Injectable()
export class OutfitsService {
  constructor(
    @InjectModel(Outfit.name) private readonly outfitModel: Model<OutfitDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
  ) {}

  findAllAdmin(): Promise<OutfitDocument[]> {
    return this.outfitModel.find().sort({ createdAt: -1 }).exec();
  }

  findFeatured(limit = 6): Promise<OutfitDocument[]> {
    return this.outfitModel
      .find({ isActive: true, isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async findBySlug(slug: string): Promise<OutfitWithProducts> {
    const outfit = await this.outfitModel.findOne({ slug: slug.toLowerCase(), isActive: true }).exec();
    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }

    const products = await this.productModel.find({ _id: { $in: outfit.productIds } }).exec();
    const productMap = new Map<string, Product>(
      products.map((product) => [product._id.toString(), product.toObject() as Product]),
    );
    const orderedProducts = outfit.productIds
      .map((id) => productMap.get(id))
      .filter((product): product is Product => Boolean(product));
    const totalPrice = orderedProducts.reduce((sum, product) => sum + product.price, 0);
    const bundlePrice = outfit.bundleDiscountPercent
      ? totalPrice * (1 - outfit.bundleDiscountPercent / 100)
      : null;

    return { ...outfit.toObject(), products: orderedProducts, totalPrice, bundlePrice };
  }

  /**
   * Finds the best bundle discount whose full product list is a subset of
   * the given cart product ids — i.e. the customer genuinely has every piece
   * of that bundle in their cart right now. Returns null rather than ever
   * suggesting a discount that isn't backed by the cart's real contents.
   */
  async findApplicableBundle(cartProductIds: string[]): Promise<ApplicableBundle | null> {
    const bundles = await this.outfitModel
      .find({ isActive: true, bundleDiscountPercent: { $gt: 0 } })
      .exec();

    const cartSet = new Set(cartProductIds);
    const matches = bundles.filter((bundle) => bundle.productIds.every((id) => cartSet.has(id)));
    if (matches.length === 0) {
      return null;
    }

    const best = matches.reduce((top, current) =>
      (current.bundleDiscountPercent ?? 0) > (top.bundleDiscountPercent ?? 0) ? current : top,
    );

    return {
      outfitSlug: best.slug,
      productIds: best.productIds,
      percent: best.bundleDiscountPercent as number,
    };
  }

  async findById(id: string): Promise<OutfitDocument> {
    const outfit = await this.outfitModel.findById(id).exec();
    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }
    return outfit;
  }

  create(dto: CreateOutfitDto): Promise<OutfitDocument> {
    return this.outfitModel.create({ ...dto, slug: dto.slug.toLowerCase() });
  }

  async update(id: string, dto: UpdateOutfitDto): Promise<OutfitDocument> {
    const outfit = await this.outfitModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!outfit) {
      throw new NotFoundException('Outfit not found');
    }
    return outfit;
  }

  async remove(id: string): Promise<void> {
    const result = await this.outfitModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Outfit not found');
    }
  }
}
