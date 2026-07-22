import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter } from 'mongoose';
import { AdjustStockDto, ManualStockReason } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LOW_STOCK_THRESHOLD, Product, ProductDocument } from './schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
  StockMovementReason,
} from './schemas/stock-movement.schema';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminProduct {
  totalStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovementDocument>,
  ) {}

  async findAll(query: QueryProductsDto): Promise<PaginatedResult<ProductDocument>> {
    return this.findAllInternal(query, { isActive: true });
  }

  async findAllAdmin(
    query: QueryProductsDto,
  ): Promise<PaginatedResult<Product & AdminProduct>> {
    const result = await this.findAllInternal(query, {});
    return {
      ...result,
      items: result.items.map((item) => this.withStockSummary(item)),
    };
  }

  private withStockSummary(product: ProductDocument): Product & AdminProduct {
    const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    const isOutOfStock = product.variants.every((variant) => variant.stock === 0);
    const isLowStock =
      !isOutOfStock && product.variants.some((variant) => variant.stock <= LOW_STOCK_THRESHOLD);
    return { ...product.toObject(), totalStock, isLowStock, isOutOfStock };
  }

  private async findAllInternal(
    query: QueryProductsDto,
    baseFilter: QueryFilter<Product>,
  ): Promise<PaginatedResult<ProductDocument>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const filter: QueryFilter<Product> = { ...baseFilter };

    if (query.audience) filter.audience = query.audience;
    if (query.type) filter.type = query.type;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = query.minPrice;
      if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice;
    }
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { 'name.fr': regex },
        { 'name.en': regex },
        { 'name.ar': regex },
        { 'name.tn': regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findBySlug(slug: string): Promise<ProductDocument> {
    const product = await this.productModel.findOne({ slug: slug.toLowerCase(), isActive: true }).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  create(dto: CreateProductDto): Promise<ProductDocument> {
    return this.productModel.create({ ...dto, slug: dto.slug.toLowerCase() });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    const product = await this.productModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Product not found');
    }
  }

  getVariantStock(product: ProductDocument, size: string): number {
    return product.variants.find((variant) => variant.size === size)?.stock ?? 0;
  }

  async decrementStock(
    productId: string,
    size: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    const result = await this.productModel
      .updateOne(
        { _id: productId, variants: { $elemMatch: { size, stock: { $gte: quantity } } } },
        { $inc: { 'variants.$.stock': -quantity } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new BadRequestException(`Not enough stock for size "${size}"`);
    }

    await this.stockMovementModel.create({
      productId,
      size,
      quantityChange: -quantity,
      reason: StockMovementReason.ORDER,
      orderId,
    });
  }

  async adjustStock(
    productId: string,
    dto: AdjustStockDto,
  ): Promise<ProductDocument> {
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const variant = product.variants.find((v) => v.size === dto.size);
    if (!variant) {
      throw new BadRequestException(`No variant found for size "${dto.size}"`);
    }

    const nextStock = variant.stock + dto.quantityChange;
    if (nextStock < 0) {
      throw new BadRequestException('Stock cannot go below 0');
    }
    variant.stock = nextStock;
    await product.save();

    await this.stockMovementModel.create({
      productId,
      size: dto.size,
      quantityChange: dto.quantityChange,
      reason: dto.reason as ManualStockReason,
      note: dto.note ?? '',
    });

    return product;
  }

  findStockMovements(productId: string): Promise<StockMovementDocument[]> {
    return this.stockMovementModel
      .find({ productId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
