import { PaymentStatus } from '@libas/shared';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OrderStatusHistory } from '../orders/schemas/order-status-history.schema';
import { Order, OrderStatus } from '../orders/schemas/order.schema';
import { PAYMENT_PROVIDER } from './interfaces/payment-provider.interface';
import { PaymentsService } from './payments.service';
import { Payment } from './schemas/payment.schema';

describe('PaymentsService — confirmPayment', () => {
  let service: PaymentsService;
  let paymentFindOneMock: jest.Mock;
  let orderFindByIdMock: jest.Mock;
  let statusHistoryCreateMock: jest.Mock;

  function makePayment(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      reference: 'ref-1',
      orderId: 'order-1',
      status: PaymentStatus.PENDING,
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      _id: { toString: () => 'order-1' },
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  beforeEach(async () => {
    paymentFindOneMock = jest.fn();
    orderFindByIdMock = jest.fn();
    statusHistoryCreateMock = jest.fn().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: { findOne: (...args: unknown[]) => ({ exec: () => paymentFindOneMock(...args) }) },
        },
        {
          provide: getModelToken(Order.name),
          useValue: { findById: (...args: unknown[]) => ({ exec: () => orderFindByIdMock(...args) }) },
        },
        {
          provide: getModelToken(OrderStatusHistory.name),
          useValue: { create: statusHistoryCreateMock },
        },
        { provide: PAYMENT_PROVIDER, useValue: { initiate: jest.fn(), handleWebhook: jest.fn() } },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it('marks the payment and order paid on a pending -> paid confirmation', async () => {
    const payment = makePayment();
    const order = makeOrder();
    paymentFindOneMock.mockResolvedValue(payment);
    orderFindByIdMock.mockResolvedValue(order);

    await service.confirmPayment('ref-1', PaymentStatus.PAID);

    expect(payment.status).toBe(PaymentStatus.PAID);
    expect(payment.save).toHaveBeenCalled();
    expect(order.status).toBe(OrderStatus.PAID);
    expect(order.paymentStatus).toBe(PaymentStatus.PAID);
    expect(statusHistoryCreateMock).toHaveBeenCalledTimes(1);
  });

  it('does not mark the order paid on a pending -> failed confirmation', async () => {
    const payment = makePayment();
    const order = makeOrder();
    paymentFindOneMock.mockResolvedValue(payment);
    orderFindByIdMock.mockResolvedValue(order);

    await service.confirmPayment('ref-1', PaymentStatus.FAILED);

    expect(payment.status).toBe(PaymentStatus.FAILED);
    expect(order.status).toBe(OrderStatus.PENDING);
    expect(order.paymentStatus).toBe(PaymentStatus.FAILED);
    expect(statusHistoryCreateMock).not.toHaveBeenCalled();
  });

  it('is idempotent: replaying a webhook for an already-confirmed reference is a no-op', async () => {
    const payment = makePayment({ status: PaymentStatus.PAID });
    paymentFindOneMock.mockResolvedValue(payment);

    await service.confirmPayment('ref-1', PaymentStatus.PAID);

    expect(payment.save).not.toHaveBeenCalled();
    expect(orderFindByIdMock).not.toHaveBeenCalled();
    expect(statusHistoryCreateMock).not.toHaveBeenCalled();
  });
});
