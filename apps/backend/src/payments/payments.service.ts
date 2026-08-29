import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus } from '@libas/shared';
import {
  OrderStatusHistory,
  OrderStatusHistoryDocument,
} from '../orders/schemas/order-status-history.schema';
import { Order, OrderDocument, OrderStatus } from '../orders/schemas/order.schema';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import type { PaymentProvider } from './interfaces/payment-provider.interface';
import { Payment, PaymentDocument } from './schemas/payment.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(OrderStatusHistory.name)
    private readonly statusHistoryModel: Model<OrderStatusHistoryDocument>,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async initiateForOrder(order: OrderDocument) {
    return this.provider.initiate(order);
  }

  /**
   * Applies a webhook (or dev-simulated) payment result: updates the Payment
   * record and mirrors the outcome onto the Order. Idempotent — a webhook
   * replayed for an already-confirmed reference is a no-op (no double
   * OrderStatusHistory entries).
   */
  async confirmPayment(reference: string, status: PaymentStatus): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ reference }).exec();
    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      // Already settled — idempotent no-op, matches the current stored state.
      return payment;
    }

    payment.status = status;
    payment.confirmedAt = new Date();
    await payment.save();

    const order = await this.orderModel.findById(payment.orderId).exec();
    if (order) {
      const previousStatus = order.status;
      order.paymentStatus = status;
      if (status === PaymentStatus.PAID) {
        order.status = OrderStatus.PAID;
      }
      await order.save();

      if (status === PaymentStatus.PAID && previousStatus !== OrderStatus.PAID) {
        await this.statusHistoryModel.create({
          orderId: order._id.toString(),
          fromStatus: previousStatus,
          toStatus: OrderStatus.PAID,
          changedBy: null,
        });
      }
    }

    return payment;
  }
}
