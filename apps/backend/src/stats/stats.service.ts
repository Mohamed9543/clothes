import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Conversation, ConversationDocument } from '../chat/schemas/conversation.schema';
import { LocalizedText, Product, ProductAudience, ProductDocument, ProductType } from '../catalog/schemas/product.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

const REVENUE_STATUSES = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED];

export interface MonthlyRevenue {
  month: string;
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

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  revenueByMonth: MonthlyRevenue[];
  topProducts: TopProduct[];
  topCategories: CategorySales[];
  salesByAudience: AudienceSales[];
  languageDistribution: LanguageDistributionEntry[];
  chatbotConversion: ChatbotConversion;
}

@Injectable()
export class StatsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Conversation.name) private readonly conversationModel: Model<ConversationDocument>,
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

  private async getRevenueByMonth(months = 12): Promise<MonthlyRevenue[]> {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    const rows = await this.orderModel
      .aggregate([
        { $match: { status: { $in: REVENUE_STATUSES }, createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
          },
        },
      ])
      .exec();

    const revenueByKey = new Map(rows.map((row) => [row._id as string, row.revenue as number]));

    const result: MonthlyRevenue[] = [];
    const cursor = new Date(since);
    for (let i = 0; i < months; i += 1) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      result.push({ month: key, revenue: revenueByKey.get(key) ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
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

  private async getLanguageDistribution(): Promise<LanguageDistributionEntry[]> {
    const rows = await this.userModel
      .aggregate([{ $group: { _id: '$preferredLanguage', count: { $sum: 1 } } }])
      .exec();
    return rows.map((row) => ({ language: row._id, count: row.count }));
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

  async getDashboard(): Promise<DashboardStats> {
    const [totals, revenueByMonth, topProducts, topCategories, salesByAudience, languageDistribution, chatbotConversion] =
      await Promise.all([
        this.getTotals(),
        this.getRevenueByMonth(),
        this.getTopProducts(),
        this.getTopCategories(),
        this.getSalesByAudience(),
        this.getLanguageDistribution(),
        this.getChatbotConversion(),
      ]);

    return {
      ...totals,
      revenueByMonth,
      topProducts,
      topCategories,
      salesByAudience,
      languageDistribution,
      chatbotConversion,
    };
  }
}
