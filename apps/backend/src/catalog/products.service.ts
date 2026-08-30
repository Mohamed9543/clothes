import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Model, QueryFilter, Types } from 'mongoose';
import { CSV_COLUMNS, productToRow, rowToProductDto } from './csv/product-csv.mapper';
import { AdjustStockDto, ManualStockReason } from './dto/adjust-stock.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { LOW_STOCK_THRESHOLD, Product, ProductDocument, isProductOnSale } from './schemas/product.schema';
import {
  StockMovement,
  StockMovementDocument,
  StockMovementReason,
} from './schemas/stock-movement.schema';

export interface ImportSummary {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

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
  isOnSale: boolean;
}

// Public-facing stock summary: deliberately omits `totalStock` so exact
// quantities aren't exposed to anonymous catalogue browsers, only the
// derived availability signal the UI needs (badges, disabled states).
export interface PublicStockSummary {
  _id: Types.ObjectId;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isOnSale: boolean;
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(StockMovement.name)
    private readonly stockMovementModel: Model<StockMovementDocument>,
  ) {}

  async findAll(query: QueryProductsDto): Promise<PaginatedResult<Product & PublicStockSummary>> {
    const result = await this.findAllInternal(query, { isActive: true });
    return {
      ...result,
      items: result.items.map((item) => this.withPublicStockSummary(item)),
    };
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

  private stockFlags(
    product: ProductDocument,
  ): { isLowStock: boolean; isOutOfStock: boolean; isOnSale: boolean } {
    const isOutOfStock = product.variants.every((variant) => variant.stock === 0);
    const isLowStock =
      !isOutOfStock && product.variants.some((variant) => variant.stock <= LOW_STOCK_THRESHOLD);
    return { isLowStock, isOutOfStock, isOnSale: isProductOnSale(product) };
  }

  private withPublicStockSummary(product: ProductDocument): Product & PublicStockSummary {
    return { ...product.toObject(), ...this.stockFlags(product) };
  }

  private withStockSummary(product: ProductDocument): Product & AdminProduct {
    const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    return { ...product.toObject(), totalStock, ...this.stockFlags(product) };
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
    // color and inStockOnly must be combined into a single $elemMatch when
    // both are present, otherwise a product could match just because SOME
    // variant is in stock and a DIFFERENT variant has the requested color.
    if (query.color || query.inStockOnly) {
      const elemMatch: Record<string, unknown> = {};
      if (query.color) elemMatch.color = query.color;
      if (query.inStockOnly) elemMatch.stock = { $gt: 0 };
      filter.variants = { $elemMatch: elemMatch };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
    };
    const sort = sortMap[query.sort ?? 'newest'];

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort(sort)
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

  async findBySlugPublic(slug: string): Promise<Product & PublicStockSummary> {
    const product = await this.findBySlug(slug);
    return this.withPublicStockSummary(product);
  }

  // Used by the wishlist page to resolve a set of product ids regardless of
  // catalogue size — the slug-keyed public endpoints can't batch-resolve by id.
  async findByIdsPublic(ids: string[]): Promise<(Product & PublicStockSummary)[]> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    const products = await this.productModel
      .find({ _id: { $in: validIds }, isActive: true })
      .exec();
    return products.map((product) => this.withPublicStockSummary(product));
  }

  async findById(id: string): Promise<ProductDocument | null> {
    return this.productModel.findById(id).exec();
  }

  private assertUniqueSkus(variants: { sku: string }[]): void {
    const seen = new Set<string>();
    for (const variant of variants) {
      if (seen.has(variant.sku)) {
        throw new BadRequestException(`Duplicate SKU "${variant.sku}" within product variants`);
      }
      seen.add(variant.sku);
    }
  }

  create(dto: CreateProductDto): Promise<ProductDocument> {
    this.assertUniqueSkus(dto.variants);
    return this.productModel.create({ ...dto, slug: dto.slug.toLowerCase() });
  }

  async update(id: string, dto: UpdateProductDto): Promise<ProductDocument> {
    if (dto.variants) {
      this.assertUniqueSkus(dto.variants);
    }
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

  getVariantStock(product: ProductDocument, size: string, color: string): number {
    return product.variants.find((variant) => variant.size === size && variant.color === color)
      ?.stock ?? 0;
  }

  async decrementStock(
    productId: string,
    size: string,
    color: string,
    quantity: number,
    orderId: string,
  ): Promise<void> {
    const result = await this.productModel
      .updateOne(
        { _id: productId, variants: { $elemMatch: { size, color, stock: { $gte: quantity } } } },
        { $inc: { 'variants.$.stock': -quantity } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new BadRequestException(`Not enough stock for size "${size}" / color "${color}"`);
    }

    await this.stockMovementModel.create({
      productId,
      size,
      color,
      quantityChange: -quantity,
      reason: StockMovementReason.ORDER,
      orderId,
    });
  }

  // Mirror of decrementStock for returned items coming back into stock —
  // same atomic $elemMatch targeting, positive instead of negative $inc.
  async restock(
    productId: string,
    size: string,
    color: string,
    quantity: number,
    returnId: string,
  ): Promise<void> {
    const result = await this.productModel
      .updateOne(
        { _id: productId, variants: { $elemMatch: { size, color } } },
        { $inc: { 'variants.$.stock': quantity } },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new BadRequestException(`No variant found for size "${size}" / color "${color}"`);
    }

    await this.stockMovementModel.create({
      productId,
      size,
      color,
      quantityChange: quantity,
      reason: StockMovementReason.RETURN,
      note: `Return ${returnId}`,
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

    const variant = product.variants.find((v) => v.size === dto.size && v.color === dto.color);
    if (!variant) {
      throw new BadRequestException(`No variant found for size "${dto.size}" / color "${dto.color}"`);
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
      color: dto.color,
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

  async importFromCsv(buffer: Buffer): Promise<ImportSummary> {
    const rows: Record<string, string>[] = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const summary: ImportSummary = { created: 0, updated: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      try {
        const plainDto = rowToProductDto(row);
        const dto = plainToInstance(CreateProductDto, plainDto);
        const validationErrors = await validate(dto);
        if (validationErrors.length > 0) {
          const message = validationErrors
            .map((error) => Object.values(error.constraints ?? {}).join(', '))
            .join('; ');
          throw new Error(message || 'Invalid row');
        }

        const existing = await this.productModel.findOne({ slug: dto.slug }).exec();
        if (existing) {
          await this.productModel.updateOne({ _id: existing._id }, dto).exec();
          summary.updated += 1;
        } else {
          await this.productModel.create(dto);
          summary.created += 1;
        }
      } catch (error) {
        summary.errors.push({
          row: rowNumber,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return summary;
  }

  async exportToCsv(): Promise<string> {
    const products = await this.productModel.find().sort({ slug: 1 }).exec();
    const rows = products.map((product) => productToRow(product));
    return stringify(rows, { header: true, columns: CSV_COLUMNS });
  }
}
