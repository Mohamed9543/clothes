import { randomUUID } from 'crypto';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentStatus } from '@libas/shared';
import { EnvConfig } from '../../config/env.validation';
import { OrderDocument } from '../../orders/schemas/order.schema';
import {
  PaymentInitiation,
  PaymentProvider,
  PaymentWebhookResult,
} from '../interfaces/payment-provider.interface';
import { Payment, PaymentDocument } from '../schemas/payment.schema';

/**
 * STAND-IN for a real gateway — replace with KonnectPaymentProvider /
 * FloucciPaymentProvider before production. It behaves like an async gateway
 * (creates a pending Payment, exposes a "confirm" step) rather than marking
 * anything paid synchronously, so swapping it out later doesn't change how
 * callers use PaymentProvider.
 */
@Injectable()
export class MockPaymentProvider implements PaymentProvider {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  async initiate(order: OrderDocument): Promise<PaymentInitiation> {
    const reference = randomUUID();
    await this.paymentModel.create({
      orderId: order._id,
      provider: 'mock',
      status: PaymentStatus.PENDING,
      amount: order.totalAmount,
      reference,
    });

    const webAppUrl = this.configService.get('WEB_APP_URL', { infer: true });
    return {
      reference,
      redirectUrl: `${webAppUrl}/payments/mock/${reference}`,
      status: PaymentStatus.PENDING,
    };
  }

  /**
   * Dev-only: flips a pending mock payment to paid/failed, simulating what a
   * real gateway's webhook would report. Called from the mock confirmation
   * page's "simulate" button — never exposed to a real payment gateway.
   */
  async simulateConfirm(
    reference: string,
    outcome: 'paid' | 'failed',
  ): Promise<PaymentWebhookResult> {
    const payment = await this.paymentModel.findOne({ reference }).exec();
    if (!payment) {
      throw new NotFoundException('Payment reference not found');
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Payment is no longer pending');
    }

    return this.handleWebhook({ reference, outcome });
  }

  async handleWebhook(payload: unknown): Promise<PaymentWebhookResult> {
    const { reference, outcome } = payload as { reference: string; outcome: 'paid' | 'failed' };
    if (!reference || !outcome) {
      throw new BadRequestException('Invalid mock webhook payload');
    }
    return {
      reference,
      status: outcome === 'paid' ? PaymentStatus.PAID : PaymentStatus.FAILED,
    };
  }
}
