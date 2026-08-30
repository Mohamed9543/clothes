import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Product } from '../catalog/schemas/product.schema';
import { OutfitsService } from './outfits.service';
import { Outfit } from './schemas/outfit.schema';

describe('OutfitsService — findBySlug totalPrice', () => {
  let service: OutfitsService;
  let outfitFindOneMock: jest.Mock;
  let productFindMock: jest.Mock;

  const productA = { _id: new Types.ObjectId(), price: 50 };
  const productB = { _id: new Types.ObjectId(), price: 75 };

  beforeEach(async () => {
    outfitFindOneMock = jest.fn();
    productFindMock = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        OutfitsService,
        {
          provide: getModelToken(Outfit.name),
          useValue: { findOne: (...args: unknown[]) => ({ exec: () => outfitFindOneMock(...args) }) },
        },
        {
          provide: getModelToken(Product.name),
          useValue: { find: (...args: unknown[]) => ({ exec: () => productFindMock(...args) }) },
        },
      ],
    }).compile();

    service = module.get(OutfitsService);
  });

  it('sums the base product prices into totalPrice', async () => {
    const productIds = [productA._id.toString(), productB._id.toString()];
    outfitFindOneMock.mockResolvedValue({
      toObject: () => ({ slug: 'look', productIds }),
      productIds,
    });
    productFindMock.mockResolvedValue([
      { ...productA, toObject: () => productA },
      { ...productB, toObject: () => productB },
    ]);

    const result = await service.findBySlug('look');

    expect(result.totalPrice).toBe(125);
  });
});

describe('OutfitsService — findApplicableBundle', () => {
  let service: OutfitsService;
  let outfitFindMock: jest.Mock;

  beforeEach(async () => {
    outfitFindMock = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        OutfitsService,
        {
          provide: getModelToken(Outfit.name),
          useValue: { find: (...args: unknown[]) => ({ exec: () => outfitFindMock(...args) }) },
        },
        { provide: getModelToken(Product.name), useValue: {} },
      ],
    }).compile();

    service = module.get(OutfitsService);
  });

  it('returns the bundle when every one of its products is in the cart', async () => {
    outfitFindMock.mockResolvedValue([
      { slug: 'look-1', productIds: ['a', 'b'], bundleDiscountPercent: 15 },
    ]);

    const result = await service.findApplicableBundle(['a', 'b', 'c']);

    expect(result).toEqual({ outfitSlug: 'look-1', productIds: ['a', 'b'], percent: 15 });
  });

  it('returns null when even one bundle product is missing from the cart', async () => {
    outfitFindMock.mockResolvedValue([
      { slug: 'look-1', productIds: ['a', 'b'], bundleDiscountPercent: 15 },
    ]);

    const result = await service.findApplicableBundle(['a']);

    expect(result).toBeNull();
  });

  it('picks the highest discount when multiple bundles are fully in the cart', async () => {
    outfitFindMock.mockResolvedValue([
      { slug: 'look-low', productIds: ['a'], bundleDiscountPercent: 10 },
      { slug: 'look-high', productIds: ['b'], bundleDiscountPercent: 25 },
    ]);

    const result = await service.findApplicableBundle(['a', 'b']);

    expect(result?.outfitSlug).toBe('look-high');
    expect(result?.percent).toBe(25);
  });
});
