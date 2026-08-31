import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument } from '../analytics/schemas/analytics-event.schema';
import { Conversation, ConversationDocument } from '../chat/schemas/conversation.schema';
import { LocalizedText, Product, ProductAudience, ProductDocument, ProductType } from '../catalog/schemas/product.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { Outfit, OutfitDocument } from '../outfits/schemas/outfit.schema';
import { Return, ReturnDocument, ReturnStatus } from '../returns/schemas/return.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

const REVENUE_STATUSES = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

export type StatsPeriod = 'day' | 'week' | 'month' | 'year';

export interface SalesPoint {
  label: string;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  name: LocalizedText;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  type: ProductType;
  quantity: number;
  revenue: number;
}

export interface AudienceSales {
  audience: ProductAudience;
  quantity: number;
  revenue: number;
}

export interface LanguageDistributionEntry {
  language: string;
  count: number;
}

export interface ChatbotConversion {
  totalRecommendations: number;
  converted: number;
  rate: number;
}

export interface PopularVariantEntry {
  value: string;
  quantity: number;
}

export interface ReturnsStats {
  requestedCount: number;
  completedCount: number;
  refundedAmount: number;
}

export interface ReviewStats {
  count: number;
  avgRating: number;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  revenueByMonth: SalesPoint[];
  topProducts: TopProduct[];
  topCategories: CategorySales[];
  salesByAudience: AudienceSales[];
  languageDistribution: LanguageDistributionEntry[];
  chatbotConversion: ChatbotConversion;
  popularSizes: PopularVariantEntry[];
  popularColors: PopularVariantEntry[];
  returnsStats: ReturnsStats;
  reviewStats: ReviewStats;
  outfitsCount: number;
  tryOnUsageCount: number;
}

interface PeriodWindow {
  since: Date;
  bucketCount: number;
  bucketKey: (date: Date) => string;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

// Pure, period → bucketing-window config. Kept separate from any DB call so
// it's trivially unit-testable and never drifts between label() and key().
// Entirely UTC-based (getUTC*/Date.UTC) so bucket boundaries never shift
// depending on the server's local timezone.
function periodWindow(period: StatsPeriod, now: Date): PeriodWindow {
  if (period === 'day') {
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 29));
    return {
      since,
      bucketCount: 30,
      bucketKey: (date) => date.toISOString().slice(0, 10),
    };
  }

  if (period === 'week') {
    const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const since = new Date(todayUtc - weekMs * 11);
    return {
      since,
      bucketCount: 12,
      bucketKey: (date) => {
        const index = Math.floor((date.getTime() - since.getTime()) / weekMs);
        return new Date(since.getTime() + index * weekMs).toISOString().slice(0, 10);
      },
    };
  }

  if (period === 'year') {
    const since = new Date(Date.UTC(now.getUTCFullYear() - 4, 0, 1));
    return {
      since,
      bucketCount: 5,
      bucketKey: (date) => String(date.getUTCFullYear()),
    };
  }

  // month (default)
  const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  return {
    since,
    bucketCount: 12,
    bucketKey: (date) => `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`,
  };
}

export function bucketOrdersByPeriod(
  orders: { totalAmount: number; createdAt: Date }[],
  period: StatsPeriod,
  now = new Date(),
): SalesPoint[] {
  const { since, bucketCount, bucketKey } = periodWindow(period, now);

  const totals = new Map<string, number>();
  for (const order of orders) {
    const key = bucketKey(order.createdAt);
    totals.set(key, (totals.get(key) ?? 0) + order.totalAmount);
  }

  const result: SalesPoint[] = [];
  const stepMs =
    period === 'day'
      ? 24 * 60 * 60 * 1000
      : period === 'week'
        ? 7 * 24 * 60 * 60 * 1000
        : null;

  for (let i = 0; i < bucketCount; i += 1) {
    let label: string;
    if (stepMs) {
      label = new Date(since.getTime() + i * stepMs).toISOString().slice(0, 10);
    } else if (period === 'year') {
      label = String(since.getUTCFullYear() + i);
    } else {
      const cursor = new Date(Date.UTC(since.getUTCFullYear(), since.getUTCMonth() + i, 1));
      label = `${cursor.getUTCFullYear()}-${pad2(cursor.getUTCMonth() + 1)}`;
    }
    result.push({ label, revenue: totals.get(label) ?? 0 });
  }
  return result;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Return.name) private readonly returnModel: Model<ReturnDocument>,
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Outfit.name) private readonly outfitModel: Model<OutfitDocument>,
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsEventModel: Model<AnalyticsEventDocument>,
  ) {}

  private async getTotals(): Promise<{ totalRevenue: number; totalOrders: number }> {
    const result = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalOrders: { $sum: 1 } } },
      ])
      .exec();
    return {
      totalRevenue: result[0]?.totalRevenue ?? 0,
      totalOrders: result[0]?.totalOrders ?? 0,
    };
  }

  private async getSalesOverTime(period: StatsPeriod): Promise<SalesPoint[]> {
    const now = new Date();
    const { since } = periodWindow(period, now);
    const orders = await this.orderModel
      .find({ status: { $in: REVENUE_STATUSES }, createdAt: { $gte: since } })
      .select('totalAmount createdAt')
      .exec();
    return bucketOrdersByPeriod(
      orders.map((o) => ({ totalAmount: o.totalAmount, createdAt: o.createdAt })),
      period,
      now,
    );
  }

  private async getTopProducts(limit = 10): Promise<TopProduct[]> {
    const rows = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: limit },
      ])
      .exec();

    const productIds = rows.map((row) => row._id);
    const products = await this.productModel.find({ _id: { $in: productIds } }).exec();
    const productMap = new Map(products.map((product) => [product._id.toString(), product]));

    return rows.map((row) => {
      const product = productMap.get(row._id.toString());
      return {
        productId: row._id.toString(),
        name: product?.name ?? { ar: '', tn: '', fr: '?', en: '?' },
        quantity: row.quantity,
        revenue: row.revenue,
      };
    });
  }

  private async getTopCategories(): Promise<CategorySales[]> {
    const rows = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.type',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .exec();

    return rows.map((row) => ({ type: row._id, quantity: row.quantity, revenue: row.revenue }));
  }

  private async getSalesByAudience(): Promise<AudienceSales[]> {
    const rows = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$items' },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: '$product' },
        {
          $group: {
            _id: '$product.audience',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.unitPrice', '$items.quantity'] } },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .exec();

    return rows.map((row) => ({ audience: row._id, quantity: row.quantity, revenue: row.revenue }));
  }

  private async getPopularVariant(field: 'size' | 'color', limit = 10): Promise<PopularVariantEntry[]> {
    const rows = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES } } },
        { $unwind: '$items' },
        { $group: { _id: `$items.${field}`, quantity: { $sum: '$items.quantity' } } },
        { $sort: { quantity: -1 } },
        { $limit: limit },
      ])
      .exec();

    return rows.map((row) => ({ value: row._id, quantity: row.quantity }));
  }

  private async getLanguageDistribution(): Promise<LanguageDistributionEntry[]> {
    const rows = await this.userModel
      .aggregate([{ $group: { _id: '$preferredLanguage', count: { $sum: 1 } } }])
      .exec();
    return rows.map((row) => ({ language: row._id, count: row.count }));
  }

  private async getReturnsStats(): Promise<ReturnsStats> {
    const [requestedCount, completedRows] = await Promise.all([
      this.returnModel.countDocuments().exec(),
      this.returnModel
        .aggregate([
          { $match: { status: ReturnStatus.COMPLETED, refundAmount: { $ne: null } } },
          { $group: { _id: null, count: { $sum: 1 }, refundedAmount: { $sum: '$refundAmount' } } },
        ])
        .exec(),
    ]);

    return {
      requestedCount,
      completedCount: completedRows[0]?.count ?? 0,
      refundedAmount: completedRows[0]?.refundedAmount ?? 0,
    };
  }

  private async getReviewStats(): Promise<ReviewStats> {
    const rows = await this.reviewModel
      .aggregate([
        { $match: { isHidden: false } },
        { $group: { _id: null, count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
      ])
      .exec();
    return { count: rows[0]?.count ?? 0, avgRating: rows[0]?.avgRating ?? 0 };
  }

  private getOutfitsCount(): Promise<number> {
    return this.outfitModel.countDocuments({ isActive: true }).exec();
  }

  private getTryOnUsageCount(since: Date): Promise<number> {
    return this.analyticsEventModel.countDocuments({ type: 'tryon_opened', createdAt: { $gte: since } }).exec();
  }

  private async getChatbotConversion(): Promise<ChatbotConversion> {
    const conversations = await this.conversationModel
      .find({ 'messages.recommendedProductIds.0': { $exists: true } })
      .select('userId messages')
      .exec();

    const recommendations: { userId: string; productId: string; recommendedAt: Date }[] = [];
    for (const conversation of conversations) {
      for (const message of conversation.messages) {
        for (const productId of message.recommendedProductIds ?? []) {
          recommendations.push({
            userId: conversation.userId.toString(),
            productId,
            recommendedAt: message.createdAt,
          });
        }
      }
    }

    if (recommendations.length === 0) {
      return { totalRecommendations: 0, converted: 0, rate: 0 };
    }

    const userIds = [...new Set(recommendations.map((r) => r.userId))];
    const orders = await this.orderModel
      .find({ userId: { $in: userIds } })
      .select('userId items createdAt')
      .exec();

    const ordersByUser = new Map<string, { productId: string; createdAt: Date }[]>();
    for (const order of orders) {
      const entries = order.items.map((item) => ({
        productId: item.productId.toString(),
        createdAt: order.createdAt,
      }));
      ordersByUser.set(order.userId.toString(), [
        ...(ordersByUser.get(order.userId.toString()) ?? []),
        ...entries,
      ]);
    }

    let converted = 0;
    for (const recommendation of recommendations) {
      const userOrders = ordersByUser.get(recommendation.userId) ?? [];
      const hasConversion = userOrders.some(
        (order) =>
          order.productId === recommendation.productId &&
          order.createdAt >= recommendation.recommendedAt,
      );
      if (hasConversion) {
        converted += 1;
      }
    }

    return {
      totalRecommendations: recommendations.length,
      converted,
      rate: converted / recommendations.length,
    };
  }

  async getDashboard(period: StatsPeriod = 'month'): Promise<DashboardStats> {
    const { since: tryOnSince } = periodWindow(period, new Date());
    const [
      totals,
      revenueByMonth,
      topProducts,
      topCategories,
      salesByAudience,
      languageDistribution,
      chatbotConversion,
      popularSizes,
      popularColors,
      returnsStats,
      reviewStats,
      outfitsCount,
      tryOnUsageCount,
    ] = await Promise.all([
      this.getTotals(),
      this.getSalesOverTime(period),
      this.getTopProducts(),
      this.getTopCategories(),
      this.getSalesByAudience(),
      this.getLanguageDistribution(),
      this.getChatbotConversion(),
      this.getPopularVariant('size'),
      this.getPopularVariant('color'),
      this.getReturnsStats(),
      this.getReviewStats(),
      this.getOutfitsCount(),
      this.getTryOnUsageCount(tryOnSince),
    ]);

    return {
      ...totals,
      revenueByMonth,
      topProducts,
      topCategories,
      salesByAudience,
      languageDistribution,
      chatbotConversion,
      popularSizes,
      popularColors,
      returnsStats,
      reviewStats,
      outfitsCount,
      tryOnUsageCount,
    };
  }
}
