import {
  Body,
  Controller,
  ForbiddenException,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { SimulatePaymentDto } from './dto/simulate-payment.dto';
import { MockPaymentProvider } from './providers/mock-payment.provider';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mockProvider: MockPaymentProvider,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {}

  // Real gateways sign their webhook payload; the mock stand-in instead checks
  // a shared-secret header, set via PAYMENT_MOCK_WEBHOOK_SECRET.
  @Post('webhook/mock')
  async mockWebhook(
    @Headers('x-mock-webhook-secret') secret: string,
    @Body() payload: { reference: string; outcome: 'paid' | 'failed' },
  ) {
    const expected = this.configService.get('PAYMENT_MOCK_WEBHOOK_SECRET', { infer: true });
    if (secret !== expected) {
      throw new ForbiddenException('Invalid webhook secret');
    }
    const result = await this.mockProvider.handleWebhook(payload);
    await this.paymentsService.confirmPayment(result.reference, result.status);
    return { received: true };
  }

  // Dev-only: drives the mock confirmation page's "simulate success/failure"
  // button. Never exposed by a real payment gateway.
  @Post('mock/:reference/simulate')
  async simulate(@Param('reference') reference: string, @Body() dto: SimulatePaymentDto) {
    if (this.configService.get('NODE_ENV', { infer: true }) === 'production') {
      throw new ForbiddenException('Mock payment simulation is disabled in production');
    }
    const result = await this.mockProvider.simulateConfirm(reference, dto.outcome);
    const payment = await this.paymentsService.confirmPayment(result.reference, result.status);
    return payment;
  }
}
