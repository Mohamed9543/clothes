import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../catalog/schemas/product.schema';
import { ProductsService } from '../catalog/products.service';
import { OrdersService } from '../orders/orders.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';
import { Review, ReviewDocument } from './schemas/review.schema';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrichedReview {
  _id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  isHidden: boolean;
  createdAt: Date;
}

export interface AdminReview extends EnrichedReview {
  productName: Product['name'];
  productSlug: string;
}

export interface ProductReviewsResult {
  reviews: EnrichedReview[];
  avgRating: number;
  count: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly productsService: ProductsService,
    private readonly ordersService: OrdersService,
  ) {}

  private async enrichWithAuthorName(reviews: ReviewDocument[]): Promise<EnrichedReview[]> {
    const userIds = [...new Set(reviews.map((review) => review.userId))];
    const users = await this.userModel.find({ _id: { $in: userIds } }).exec();
    const userMap = new Map(users.map((user) => [user._id.toString(), user]));

    return reviews.map((review) => {
      const user = userMap.get(review.userId);
      const authorName = user ? `${user.firstName} ${user.lastName}` : 'Utilisateur';
      const obj = review.toObject();
      return { ...obj, _id: obj._id.toString(), authorName };
    });
  }

  async create(userId: string, slug: string, dto: CreateReviewDto): Promise<ReviewDocument> {
    const product = await this.productsService.findBySlug(slug);

    const hasReceived = await this.ordersService.hasUserReceivedProduct(
      userId,
      product._id.toString(),
    );
    if (!hasReceived) {
      throw new ForbiddenException('You can only review products you have received');
    }

    const existing = await this.reviewModel
      .findOne({ productId: product._id.toString(), userId })
      .exec();
    if (existing) {
      throw new BadRequestException('You have already reviewed this product');
    }

    return this.reviewModel.create({
      productId: product._id.toString(),
      userId,
      rating: dto.rating,
      comment: dto.comment,
      isHidden: false,
    });
  }

  async findForProduct(slug: string): Promise<ProductReviewsResult> {
    const product = await this.productsService.findBySlug(slug);

    const reviews = await this.reviewModel
      .find({ productId: product._id.toString(), isHidden: false })
      .sort({ createdAt: -1 })
      .exec();

    const enriched = await this.enrichWithAuthorName(reviews);
    const count = enriched.length;
    const avgRating =
      count === 0 ? 0 : enriched.reduce((sum, review) => sum + review.rating, 0) / count;

    return { reviews: enriched, avgRating, count };
  }

  async findAllAdmin(query: QueryReviewsDto): Promise<PaginatedResult<AdminReview>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [reviews, total] = await Promise.all([
      this.reviewModel
        .find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      this.reviewModel.countDocuments().exec(),
    ]);

    const enriched = await this.enrichWithAuthorName(reviews);

    const productIds = [...new Set(reviews.map((review) => review.productId))];
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    const items: AdminReview[] = enriched.map((review) => {
      const product = productMap.get(review.productId);
      return {
        ...review,
        productName: product?.name ?? { ar: '', tn: '', fr: '?', en: '?' },
        productSlug: product?.slug ?? '',
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async setHidden(id: string, isHidden: boolean): Promise<ReviewDocument> {
    const review = await this.reviewModel.findByIdAndUpdate(id, { isHidden }, { new: true }).exec();
    if (!review) {
      throw new BadRequestException('Review not found');
    }
    return review;
  }

  async remove(id: string): Promise<void> {
    const result = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new BadRequestException('Review not found');
    }
  }
}
