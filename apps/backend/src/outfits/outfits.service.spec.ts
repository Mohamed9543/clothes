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
