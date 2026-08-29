import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  OrderStatusHistory,
  OrderStatusHistorySchema,
} from '../orders/schemas/order-status-history.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { EnvConfig } from '../config/env.validation';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { Payment, PaymentSchema } from './schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatusHistory.name, schema: OrderStatusHistorySchema },
    ]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProvider,
    {
      provide: PAYMENT_PROVIDER,
      useFactory: (configService: ConfigService<EnvConfig, true>, mockProvider: MockPaymentProvider) => {
        const provider = configService.get('PAYMENT_PROVIDER', { infer: true });
        if (provider === 'mock') {
          return mockProvider;
        }
        // Loud failure on purpose — a misconfigured PAYMENT_PROVIDER should
        // never silently fall back to the mock stand-in.
        throw new Error(
          `PAYMENT_PROVIDER "${provider}" is not implemented yet. Only "mock" is available in Phase 1.`,
        );
      },
      inject: [ConfigService, MockPaymentProvider],
    },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
