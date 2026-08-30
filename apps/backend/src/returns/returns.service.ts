import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ProductsService } from '../catalog/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderStatus } from '../orders/schemas/order.schema';
import { OrdersService } from '../orders/orders.service';
import { CreateReturnDto } from './dto/create-return.dto';
import { Return, ReturnDocument, ReturnStatus, ReturnType } from './schemas/return.schema';

@Injectable()
export class ReturnsService {
  constructor(
    @InjectModel(Return.name) private readonly returnModel: Model<ReturnDocument>,
    private readonly ordersService: OrdersService,
    private readonly productsService: ProductsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateReturnDto): Promise<ReturnDocument> {
    const order = await this.ordersService.findOneForUser(userId, dto.orderId);
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Only delivered orders can be returned or exchanged');
    }

    const existingReturns = await this.returnModel
      .find({ orderId: dto.orderId, status: { $ne: ReturnStatus.REJECTED } })
      .exec();

    for (const item of dto.items) {
      const purchased = order.items.find(
        (orderItem) =>
          orderItem.productId.toString() === item.productId &&
          orderItem.size === item.size &&
          orderItem.color === item.color,
      );
      if (!purchased) {
        throw new BadRequestException(
          `No matching purchased item for size "${item.size}" / color "${item.color}"`,
        );
      }

      const alreadyRequested = existingReturns
        .flatMap((r) => r.items)
        .filter((i) => i.productId.toString() === item.productId && i.size === item.size && i.color === item.color)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (alreadyRequested + item.quantity > purchased.quantity) {
        throw new BadRequestException(
          `Cannot request more than what was purchased for size "${item.size}" / color "${item.color}"`,
        );
      }
    }

    const created = await this.returnModel.create({
      orderId: dto.orderId,
      userId,
      type: dto.type,
      items: dto.items,
      reason: dto.reason,
      status: ReturnStatus.REQUESTED,
      statusHistory: [{ status: ReturnStatus.REQUESTED, changedAt: new Date(), changedBy: null }],
    });

    await this.notificationsService.create({
      userId: null,
      type: 'return_requested',
      message: `New ${dto.type} request for order #${dto.orderId.slice(-6)}`,
      link: '/admin/retours',
    });

    return created;
  }

  findAllForUser(userId: string): Promise<ReturnDocument[]> {
    return this.returnModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  findAllAdmin(): Promise<ReturnDocument[]> {
    return this.returnModel.find().sort({ createdAt: -1 }).exec();
  }

  async updateStatus(id: string, status: ReturnStatus, adminUserId: string): Promise<ReturnDocument> {
    const ret = await this.returnModel.findById(id).exec();
    if (!ret) {
      throw new NotFoundException('Return not found');
    }

    // Guard against double-restocking if RECEIVED is (re-)applied more than
    // once — the stock/refund side effects below must only run once.
    if (status === ReturnStatus.RECEIVED && ret.status !== ReturnStatus.RECEIVED) {
      const order = await this.ordersService.findOneForUser(ret.userId.toString(), ret.orderId.toString());

      // For an exchange, pull the replacement size/color first — if it's out
      // of stock this throws before anything else changes, leaving the
      // return's state untouched rather than partially applied.
      if (ret.type === ReturnType.EXCHANGE) {
        for (const item of ret.items) {
          if (!item.exchangeSize || !item.exchangeColor) continue;
          await this.productsService.decrementStock(
            item.productId.toString(),
            item.exchangeSize,
            item.exchangeColor,
            item.quantity,
            ret._id.toString(),
          );
        }
      }

      // Restock the originally purchased size/color for every line.
      for (const item of ret.items) {
        await this.productsService.restock(
          item.productId.toString(),
          item.size,
          item.color,
          item.quantity,
          ret._id.toString(),
        );
      }

      if (ret.type === ReturnType.RETURN) {
        ret.refundAmount = ret.items.reduce((sum, item) => {
          const orderItem = order.items.find(
            (oi) =>
              oi.productId.toString() === item.productId.toString() &&
              oi.size === item.size &&
              oi.color === item.color,
          );
          return sum + (orderItem?.unitPrice ?? 0) * item.quantity;
        }, 0);
      }
    }

    ret.status = status;
    ret.statusHistory.push({ status, changedAt: new Date(), changedBy: adminUserId });
    await ret.save();

    await this.notificationsService.create({
      userId: ret.userId.toString(),
      type: 'return_status',
      message: `Your ${ret.type} request is now "${status}"`,
      link: '/retours',
    });

    return ret;
  }

  async findOneForUser(userId: string, id: string): Promise<ReturnDocument> {
    const ret = await this.returnModel.findById(id).exec();
    if (!ret) {
      throw new NotFoundException('Return not found');
    }
    if (ret.userId.toString() !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return ret;
  }
}
