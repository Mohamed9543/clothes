import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ProductsService } from '../catalog/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/schemas/order.schema';
import { ReturnsService } from './returns.service';
import { Return, ReturnStatus, ReturnType } from './schemas/return.schema';

describe('ReturnsService', () => {
  let service: ReturnsService;
  let findOneForUserMock: jest.Mock;
  let returnFindMock: jest.Mock;
  let returnFindByIdMock: jest.Mock;
  let returnCreateMock: jest.Mock;
  let restockMock: jest.Mock;
  let decrementStockMock: jest.Mock;
  let notifyMock: jest.Mock;

  const productId = new Types.ObjectId().toString();
  const orderId = new Types.ObjectId().toString();

  function makeOrder(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      _id: orderId,
      userId: 'user1',
      status: OrderStatus.DELIVERED,
      items: [
        { productId: { toString: () => productId }, size: 'M', color: 'Rouge', unitPrice: 50, quantity: 2 },
      ],
      ...overrides,
    };
  }

  beforeEach(async () => {
    findOneForUserMock = jest.fn();
    returnFindMock = jest.fn().mockResolvedValue([]);
    returnFindByIdMock = jest.fn();
    returnCreateMock = jest.fn().mockImplementation((doc) => Promise.resolve(doc));
    restockMock = jest.fn().mockResolvedValue(undefined);
    decrementStockMock = jest.fn().mockResolvedValue(undefined);
    notifyMock = jest.fn().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        ReturnsService,
        {
          provide: getModelToken(Return.name),
          useValue: {
            find: (...args: unknown[]) => ({ exec: () => returnFindMock(...args) }),
            findById: (...args: unknown[]) => ({ exec: () => returnFindByIdMock(...args) }),
            create: returnCreateMock,
          },
        },
        { provide: OrdersService, useValue: { findOneForUser: findOneForUserMock } },
        {
          provide: ProductsService,
          useValue: { restock: restockMock, decrementStock: decrementStockMock },
        },
        { provide: NotificationsService, useValue: { create: notifyMock } },
      ],
    }).compile();

    service = module.get(ReturnsService);
  });

  describe('create', () => {
    it('refuses a return on a non-delivered order', async () => {
      findOneForUserMock.mockResolvedValue(makeOrder({ status: OrderStatus.SHIPPED }));

      await expect(
        service.create('user1', {
          orderId,
          type: ReturnType.RETURN,
          items: [{ productId, size: 'M', color: 'Rouge', quantity: 1 }],
          reason: 'too small',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses a return quantity exceeding what was purchased', async () => {
      findOneForUserMock.mockResolvedValue(makeOrder());

      await expect(
        service.create('user1', {
          orderId,
          type: ReturnType.RETURN,
          items: [{ productId, size: 'M', color: 'Rouge', quantity: 3 }],
          reason: 'too small',
        } as never),
      ).rejects.toThrow(BadRequestException);
    });

    it('accepts a valid return within the purchased quantity', async () => {
      findOneForUserMock.mockResolvedValue(makeOrder());

      await service.create('user1', {
        orderId,
        type: ReturnType.RETURN,
        items: [{ productId, size: 'M', color: 'Rouge', quantity: 2 }],
        reason: 'too small',
      } as never);

      expect(returnCreateMock).toHaveBeenCalled();
      expect(notifyMock).toHaveBeenCalledWith(expect.objectContaining({ userId: null }));
    });
  });

  describe('updateStatus — RECEIVED', () => {
    function makeReturn(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        _id: 'ret1',
        orderId,
        userId: { toString: () => 'user1' },
        type: ReturnType.RETURN,
        status: ReturnStatus.ACCEPTED,
        items: [{ productId: { toString: () => productId }, size: 'M', color: 'Rouge', quantity: 2 }],
        statusHistory: [],
        refundAmount: null,
        save: jest.fn().mockResolvedValue(undefined),
        ...overrides,
      };
    }

    it('computes refundAmount from the order\'s frozen unit price, not the catalogue price', async () => {
      const ret = makeReturn();
      returnFindByIdMock.mockResolvedValue(ret);
      findOneForUserMock.mockResolvedValue(makeOrder());

      await service.updateStatus('ret1', ReturnStatus.RECEIVED, 'admin1');

      expect(ret.refundAmount).toBe(100); // 50 (frozen unitPrice) * 2
      expect(restockMock).toHaveBeenCalledWith(productId, 'M', 'Rouge', 2, 'ret1');
    });

    it('does not restock twice if RECEIVED is applied again', async () => {
      const ret = makeReturn({ status: ReturnStatus.RECEIVED });
      returnFindByIdMock.mockResolvedValue(ret);
      findOneForUserMock.mockResolvedValue(makeOrder());

      await service.updateStatus('ret1', ReturnStatus.RECEIVED, 'admin1');

      expect(restockMock).not.toHaveBeenCalled();
    });
  });
});
