import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { LOYALTY_POINTS_PER_TND_SPENT, LOYALTY_TND_PER_POINT_REDEEMED } from '@libas/shared';
import type { DiscountSource } from '@libas/shared';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../catalog/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OutfitsService } from '../outfits/outfits.service';
import { PaymentsService } from '../payments/payments.service';
import { PromotionsService } from '../promotions/promotions.service';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteOrderDto } from './dto/quote-order.dto';
import { ShippingFeeService } from './shipping-fee.service';
import {
  OrderStatusHistory,
  OrderStatusHistoryDocument,
} from './schemas/order-status-history.schema';
import { Order, OrderDocument, OrderItem, OrderStatus, PaymentMethod } from './schemas/order.schema';

export interface OrderQuote {
  itemsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  discountSource: DiscountSource | null;
  total: number;
}

interface DiscountResult {
  discountAmount: number;
  discountSource: DiscountSource | null;
}

export interface CreateOrderResult {
  order: OrderDocument;
  paymentRedirectUrl?: string;
}

export interface OrderRequester {
  sub: string;
  role: string;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatusHistory.name)
    private readonly statusHistoryModel: Model<OrderStatusHistoryDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly outfitsService: OutfitsService,
    private readonly shippingFeeService: ShippingFeeService,
    private readonly paymentsService: PaymentsService,
    private readonly promotionsService: PromotionsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Single source of discount per order, priority coupon > points > bundle —
   * never stacked, so the math stays simple to audit and test. Each branch
   * only ever discounts against real, currently-held data (a valid coupon, a
   * points balance the user actually has, or a bundle whose products are
   * genuinely all in the cart) — never an invented promotion.
   */
  private async computeDiscount(
    userId: string,
    items: { productId: string; subtotal: number }[],
    subtotal: number,
    couponCode?: string,
    usePoints?: number,
  ): Promise<DiscountResult> {
    if (couponCode) {
      const result = await this.promotionsService.validateCoupon(couponCode, subtotal);
      return { discountAmount: result.discountAmount, discountSource: 'coupon' };
    }

    if (usePoints) {
      const user = await this.userModel.findById(userId).exec();
      if (!user || user.loyaltyPoints < usePoints) {
        throw new BadRequestException('Not enough loyalty points');
      }
      const discountAmount = Math.min(usePoints * LOYALTY_TND_PER_POINT_REDEEMED, subtotal);
      return { discountAmount, discountSource: 'points' };
    }

    const bundle = await this.outfitsService.findApplicableBundle(items.map((i) => i.productId));
    if (bundle) {
      const bundleSubtotal = items
        .filter((item) => bundle.productIds.includes(item.productId))
        .reduce((sum, item) => sum + item.subtotal, 0);
      return { discountAmount: bundleSubtotal * (bundle.percent / 100), discountSource: 'bundle' };
    }

    return { discountAmount: 0, discountSource: null };
  }

  async quote(userId: string, dto: QuoteOrderDto): Promise<OrderQuote> {
    const cart = await this.cartService.getEnrichedCart(userId);
    const shippingFee = this.shippingFeeService.computeShippingFee(dto.governorate);
    const { discountAmount, discountSource } = await this.computeDiscount(
      userId,
      cart.items.map((item) => ({ productId: item.productId, subtotal: item.subtotal })),
      cart.total,
      dto.couponCode,
      dto.usePoints,
    );
    return {
      itemsSubtotal: cart.total,
      shippingFee,
      discountAmount,
      discountSource,
      total: cart.total - discountAmount + shippingFee,
    };
  }

  async create(userId: string, dto: CreateOrderDto): Promise<CreateOrderResult> {
    const cart = await this.cartService.getRawCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const paymentMethod = dto.paymentMethod ?? PaymentMethod.COD;
    // Every order starts pending — payment is never marked synchronously at
    // creation time. COD orders are marked paid by an admin on delivery (the
    // existing honest zero-gateway path); any other payment method only
    // becomes "paid" once the payment provider confirms it (see below).
    const initialStatus = OrderStatus.PENDING;

    const session = await this.connection.startSession();
    try {
      let order: OrderDocument | undefined;

      await session.withTransaction(async () => {
        const orderItems: OrderItem[] = [];
        let totalAmount = 0;

        for (const item of cart.items) {
          const product = await this.productsService.findById(item.productId.toString());
          if (!product) {
            throw new NotFoundException('A product in your cart no longer exists');
          }
          if (this.productsService.getVariantStock(product, item.size, item.color) < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for "${product.name.fr}" (size ${item.size}, color ${item.color})`,
            );
          }

          const variant = product.variants.find(
            (v) => v.size === item.size && v.color === item.color,
          );
          const unitPrice = variant?.priceOverride ?? product.price;

          orderItems.push({
            productId: product._id,
            name: product.name as unknown as Record<string, string>,
            unitPrice,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
          });
          totalAmount += unitPrice * item.quantity;
        }

        const shippingFee = this.shippingFeeService.computeShippingFee(
          dto.shippingAddress.governorate,
        );

        const { discountAmount, discountSource } = await this.computeDiscount(
          userId,
          orderItems.map((item) => ({
            productId: item.productId.toString(),
            subtotal: item.unitPrice * item.quantity,
          })),
          totalAmount,
          dto.couponCode,
          dto.usePoints,
        );

        totalAmount = totalAmount - discountAmount + shippingFee;

        const created = await this.orderModel.create(
          [
            {
              userId,
              items: orderItems,
              totalAmount,
              shippingFee,
              couponCode: dto.couponCode ? dto.couponCode.trim().toUpperCase() : null,
              discountAmount,
              discountSource,
              loyaltyPointsRedeemed: discountSource === 'points' ? (dto.usePoints ?? 0) : 0,
              shippingAddress: dto.shippingAddress,
              paymentMethod,
              status: initialStatus,
            },
          ],
          { session },
        );
        order = created[0];

        for (const item of orderItems) {
          await this.productsService.decrementStock(
            item.productId.toString(),
            item.size,
            item.color,
            item.quantity,
            order._id.toString(),
          );
        }
      });

      await this.statusHistoryModel.create({
        orderId: (order as OrderDocument)._id.toString(),
        fromStatus: null,
        toStatus: initialStatus,
        changedBy: null,
      });

      await this.cartService.clear(userId);

      const finalOrder = order as OrderDocument;
      if (finalOrder.discountSource === 'points' && finalOrder.loyaltyPointsRedeemed > 0) {
        await this.userModel
          .updateOne(
            { _id: userId, loyaltyPoints: { $gte: finalOrder.loyaltyPointsRedeemed } },
            { $inc: { loyaltyPoints: -finalOrder.loyaltyPointsRedeemed } },
          )
          .exec();
      }

      if (paymentMethod === PaymentMethod.COD) {
        return { order: finalOrder };
      }

      const initiation = await this.paymentsService.initiateForOrder(finalOrder);
      return { order: finalOrder, paymentRedirectUrl: initiation.redirectUrl };
    } finally {
      await session.endSession();
    }
  }

  findAllForUser(userId: string): Promise<OrderDocument[]> {
    return this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findOneForUser(userId: string, orderId: string): Promise<OrderDocument> {
    const order = await this.orderModel.findById(orderId).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  findAll(): Promise<OrderDocument[]> {
    return this.orderModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    adminUserId: string,
  ): Promise<OrderDocument> {
    const previous = await this.orderModel.findById(orderId).exec();
    if (!previous) {
      throw new NotFoundException('Order not found');
    }

    const order = await this.orderModel.findByIdAndUpdate(orderId, { status }, { new: true }).exec();
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    await this.statusHistoryModel.create({
      orderId,
      fromStatus: previous.status,
      toStatus: status,
      changedBy: adminUserId,
    });

    // Points are earned on genuine delivery, not on payment — an order can
    // still be cancelled/returned before that point. Guarded so re-saving
    // (or a status flip back and forth) never double-credits.
    if (status === OrderStatus.DELIVERED && !order.loyaltyPointsAwarded) {
      const points = Math.floor(order.totalAmount * LOYALTY_POINTS_PER_TND_SPENT);
      if (points > 0) {
        await this.userModel.updateOne({ _id: order.userId }, { $inc: { loyaltyPoints: points } }).exec();
      }
      order.loyaltyPointsAwarded = true;
      await order.save();
    }

    await this.notificationsService.create({
      userId: order.userId.toString(),
      type: 'order_status',
      message: `Your order #${orderId.slice(-6)} is now "${status}"`,
      link: '/commandes',
    });

    return order;
  }

  async getHistory(requester: OrderRequester, orderId: string): Promise<OrderStatusHistoryDocument[]> {
    if (requester.role !== 'admin') {
      await this.findOneForUser(requester.sub, orderId);
    }
    return this.statusHistoryModel.find({ orderId }).sort({ createdAt: 1 }).exec();
  }

  async hasUserReceivedProduct(userId: string, productId: string): Promise<boolean> {
    const count = await this.orderModel
      .countDocuments({
        userId,
        status: OrderStatus.DELIVERED,
        'items.productId': new Types.ObjectId(productId),
      })
      .exec();
    return count > 0;
  }
}
