import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AnalyticsEvent } from '../analytics/schemas/analytics-event.schema';
import { Conversation } from '../chat/schemas/conversation.schema';
import { Product } from '../catalog/schemas/product.schema';
import { Order } from '../orders/schemas/order.schema';
import { Outfit } from '../outfits/schemas/outfit.schema';
import { Return, ReturnStatus } from '../returns/schemas/return.schema';
import { Review } from '../reviews/schemas/review.schema';
import { User } from '../users/schemas/user.schema';
import { StatsService, bucketOrdersByPeriod } from './stats.service';

describe('bucketOrdersByPeriod', () => {
  it('buckets orders into 30 daily points for period=day', () => {
    const now = new Date('2026-01-30T12:00:00Z');
    const orders = [
      { totalAmount: 10, createdAt: new Date('2026-01-30T08:00:00Z') },
      { totalAmount: 5, createdAt: new Date('2026-01-30T09:00:00Z') },
      { totalAmount: 20, createdAt: new Date('2026-01-01T08:00:00Z') },
    ];

    const result = bucketOrdersByPeriod(orders, 'day', now);

    expect(result).toHaveLength(30);
    const last = result[result.length - 1];
    expect(last.label).toBe('2026-01-30');
    expect(last.revenue).toBe(15);
    const first = result[0];
    expect(first.label).toBe('2026-01-01');
    expect(first.revenue).toBe(20);
  });

  it('buckets orders into 12 monthly points for period=month, matching legacy behaviour', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const orders = [
      { totalAmount: 100, createdAt: new Date('2026-06-01T00:00:00Z') },
      { totalAmount: 50, createdAt: new Date('2026-05-20T00:00:00Z') },
    ];

    const result = bucketOrdersByPeriod(orders, 'month', now);

    expect(result).toHaveLength(12);
    expect(result[result.length - 1]).toEqual({ label: '2026-06', revenue: 100 });
    expect(result[result.length - 2]).toEqual({ label: '2026-05', revenue: 50 });
  });

  it('buckets orders into 5 yearly points for period=year', () => {
    const now = new Date('2026-03-01T00:00:00Z');
    const orders = [
      { totalAmount: 30, createdAt: new Date('2024-01-01T00:00:00Z') },
      { totalAmount: 70, createdAt: new Date('2026-01-01T00:00:00Z') },
    ];

    const result = bucketOrdersByPeriod(orders, 'year', now);

    expect(result).toHaveLength(5);
    expect(result.map((r) => r.label)).toEqual(['2022', '2023', '2024', '2025', '2026']);
    expect(result.find((r) => r.label === '2024')?.revenue).toBe(30);
    expect(result.find((r) => r.label === '2026')?.revenue).toBe(70);
  });

  it('never drops revenue when re-aggregated across all buckets', () => {
    const now = new Date('2026-01-30T00:00:00Z');
    const orders = [
      { totalAmount: 10, createdAt: new Date('2026-01-05T00:00:00Z') },
      { totalAmount: 15, createdAt: new Date('2026-01-20T00:00:00Z') },
    ];
    const result = bucketOrdersByPeriod(orders, 'week', now);
    const total = result.reduce((sum, point) => sum + point.revenue, 0);
    expect(total).toBe(25);
  });
});

describe('StatsService — getReturnsStats / getPopularVariant', () => {
  let service: StatsService;
  let returnCountMock: jest.Mock;
  let returnAggregateMock: jest.Mock;
  let orderAggregateMock: jest.Mock;

  function emptyModel() {
    return { aggregate: () => ({ exec: () => Promise.resolve([]) }), countDocuments: () => ({ exec: () => Promise.resolve(0) }) };
  }

  beforeEach(async () => {
    returnCountMock = jest.fn().mockResolvedValue(7);
    returnAggregateMock = jest.fn().mockResolvedValue([{ count: 3, refundedAmount: 150 }]);
    orderAggregateMock = jest.fn().mockResolvedValue([
      { _id: 'M', quantity: 10 },
      { _id: 'L', quantity: 4 },
    ]);

    const module = await Test.createTestingModule({
      providers: [
        StatsService,
        { provide: getModelToken(Order.name), useValue: { aggregate: (...args: unknown[]) => ({ exec: () => orderAggregateMock(...args) }) } },
        { provide: getModelToken(Product.name), useValue: emptyModel() },
        { provide: getModelToken(User.name), useValue: emptyModel() },
        { provide: getModelToken(Conversation.name), useValue: { find: () => ({ select: () => ({ exec: () => Promise.resolve([]) }) }) } },
        {
          provide: getModelToken(Return.name),
          useValue: {
            countDocuments: (...args: unknown[]) => ({ exec: () => returnCountMock(...args) }),
            aggregate: (...args: unknown[]) => ({ exec: () => returnAggregateMock(...args) }),
          },
        },
        { provide: getModelToken(Review.name), useValue: emptyModel() },
        { provide: getModelToken(Outfit.name), useValue: emptyModel() },
        { provide: getModelToken(AnalyticsEvent.name), useValue: emptyModel() },
      ],
    }).compile();

    service = module.get(StatsService);
  });

  it('getReturnsStats only counts the refund total from completed returns', async () => {
    const result = await (service as unknown as { getReturnsStats: () => Promise<unknown> }).getReturnsStats();

    expect(returnAggregateMock).toHaveBeenCalled();
    const pipeline = returnAggregateMock.mock.calls[0][0] as { $match?: Record<string, unknown> }[];
    expect(pipeline[0].$match).toMatchObject({ status: ReturnStatus.COMPLETED });
    expect(result).toEqual({ requestedCount: 7, completedCount: 3, refundedAmount: 150 });
  });

  it('getPopularVariant aggregates order items by the given field, sorted by quantity', async () => {
    const result = await (
      service as unknown as { getPopularVariant: (field: 'size' | 'color') => Promise<{ value: string; quantity: number }[]> }
    ).getPopularVariant('size');

    expect(result).toEqual([
      { value: 'M', quantity: 10 },
      { value: 'L', quantity: 4 },
    ]);
  });
});
