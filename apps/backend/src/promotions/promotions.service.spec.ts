import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { PromotionsService } from './promotions.service';
import { Coupon, DiscountType } from './schemas/coupon.schema';

describe('PromotionsService — validateCoupon', () => {
  let service: PromotionsService;
  let findOneMock: jest.Mock;

  function makeCoupon(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      code: 'PROMO10',
      discountType: DiscountType.PERCENT,
      value: 10,
      isActive: true,
      expiresAt: null,
      minOrderAmount: 0,
      ...overrides,
    };
  }

  beforeEach(async () => {
    findOneMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        PromotionsService,
        {
          provide: getModelToken(Coupon.name),
          useValue: { findOne: (...args: unknown[]) => ({ exec: () => findOneMock(...args) }) },
        },
      ],
    }).compile();
    service = module.get(PromotionsService);
  });

  it('applies a percent discount correctly', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ discountType: DiscountType.PERCENT, value: 10 }));
    const result = await service.validateCoupon('promo10', 100);
    expect(result.discountAmount).toBe(10);
  });

  it('applies a fixed discount correctly', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ discountType: DiscountType.FIXED, value: 15 }));
    const result = await service.validateCoupon('PROMO10', 100);
    expect(result.discountAmount).toBe(15);
  });

  it('caps the discount at the subtotal (never negative order total)', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ discountType: DiscountType.FIXED, value: 999 }));
    const result = await service.validateCoupon('PROMO10', 50);
    expect(result.discountAmount).toBe(50);
  });

  it('rejects an unknown coupon code', async () => {
    findOneMock.mockResolvedValue(null);
    await expect(service.validateCoupon('NOPE', 100)).rejects.toThrow(BadRequestException);
  });

  it('rejects an inactive coupon', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ isActive: false }));
    await expect(service.validateCoupon('PROMO10', 100)).rejects.toThrow(BadRequestException);
  });

  it('rejects an expired coupon', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ expiresAt: new Date('2020-01-01') }));
    await expect(service.validateCoupon('PROMO10', 100)).rejects.toThrow(BadRequestException);
  });

  it('rejects when the subtotal is below the minimum order amount', async () => {
    findOneMock.mockResolvedValue(makeCoupon({ minOrderAmount: 200 }));
    await expect(service.validateCoupon('PROMO10', 100)).rejects.toThrow(BadRequestException);
  });
});
