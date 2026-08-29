import { PaymentStatus } from '@libas/shared';
import { OrderDocument } from '../../orders/schemas/order.schema';

export interface PaymentInitiation {
  reference: string;
  redirectUrl?: string;
  status: PaymentStatus;
}

export interface PaymentWebhookResult {
  reference: string;
  status: PaymentStatus;
}

/**
 * Anything that can take money for an order. Controllers/services depend only
 * on this interface — swapping the mock stand-in for a real Konnect/Flouci
 * adapter later means adding a new class, not touching orders/payments
 * controllers.
 */
export interface PaymentProvider {
  initiate(order: OrderDocument): Promise<PaymentInitiation>;
  handleWebhook(payload: unknown): Promise<PaymentWebhookResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
