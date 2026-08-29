import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../catalog/products.service';
import { PaymentsService } from '../payments/payments.service';
import { PromotionsService } from '../promotions/promotions.service';
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
  total: number;
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
    @InjectConnection() private readonly connection: Connection,
    private readonly cartService: CartService,
    private readonly productsService: ProductsService,
    private readonly shippingFeeService: ShippingFeeService,
    private readonly paymentsService: PaymentsService,
    private readonly promotionsService: PromotionsService,
  ) {}

  async quote(userId: string, dto: QuoteOrderDto): Promise<OrderQuote> {
    const cart = await this.cartService.getEnrichedCart(userId);
    const shippingFee = this.shippingFeeService.computeShippingFee(dto.governorate);
    const discountAmount = dto.couponCode
      ? (await this.promotionsService.validateCoupon(dto.couponCode, cart.total)).discountAmount
      : 0;
    return {
      itemsSubtotal: cart.total,
      shippingFee,
      discountAmount,
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

        let discountAmount = 0;
        if (dto.couponCode) {
          const result = await this.promotionsService.validateCoupon(dto.couponCode, totalAmount);
          discountAmount = result.discountAmount;
        }

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
