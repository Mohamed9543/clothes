import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../catalog/products.service';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrderStatusHistory,
  OrderStatusHistoryDocument,
} from './schemas/order-status-history.schema';
import { Order, OrderDocument, OrderItem, OrderStatus } from './schemas/order.schema';

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
  ) {}

  async create(userId: string, dto: CreateOrderDto): Promise<OrderDocument> {
    const cart = await this.cartService.getRawCart(userId);
    if (cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

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
          if (this.productsService.getVariantStock(product, item.size) < item.quantity) {
            throw new BadRequestException(
              `Not enough stock for "${product.name.fr}" (size ${item.size})`,
            );
          }

          orderItems.push({
            productId: product._id,
            name: product.name as unknown as Record<string, string>,
            unitPrice: product.price,
            quantity: item.quantity,
            size: item.size,
          });
          totalAmount += product.price * item.quantity;
        }

        const created = await this.orderModel.create(
          [
            {
              userId,
              items: orderItems,
              totalAmount,
              shippingAddress: dto.shippingAddress,
            },
          ],
          { session },
        );
        order = created[0];

        for (const item of orderItems) {
          await this.productsService.decrementStock(
            item.productId.toString(),
            item.size,
            item.quantity,
            order._id.toString(),
          );
        }
      });

      await this.statusHistoryModel.create({
        orderId: (order as OrderDocument)._id.toString(),
        fromStatus: null,
        toStatus: OrderStatus.PENDING,
        changedBy: null,
      });

      await this.cartService.clear(userId);
      return order as OrderDocument;
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
