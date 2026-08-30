import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ProductsService } from '../catalog/products.service';
import { CartService } from './cart.service';
import { Cart } from './schemas/cart.schema';

describe('CartService — saveForLater / moveToCart', () => {
  let service: CartService;
  let findOneMock: jest.Mock;
  let getVariantStockMock: jest.Mock;
  let findByIdMock: jest.Mock;

  const productId = new Types.ObjectId().toString();

  function makeCart(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      userId: 'user1',
      items: [],
      savedForLater: [],
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  beforeEach(async () => {
    findOneMock = jest.fn();
    getVariantStockMock = jest.fn().mockReturnValue(10);
    findByIdMock = jest.fn().mockResolvedValue({
      _id: productId,
      slug: 'p',
      name: { fr: 'x', en: 'x', ar: 'x', tn: 'x' },
      images: [],
      variants: [{ size: 'M', color: 'Rouge', stock: 10, priceOverride: null }],
    });

    const module = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: {
            findOne: (...args: unknown[]) => ({ exec: () => findOneMock(...args) }),
          },
        },
        {
          provide: ProductsService,
          useValue: {
            findById: findByIdMock,
            getVariantStock: getVariantStockMock,
          },
        },
      ],
    }).compile();

    service = module.get(CartService);
  });

  it('moves an item from items to savedForLater', async () => {
    const cart = makeCart({
      items: [{ productId: new Types.ObjectId(productId), quantity: 2, size: 'M', color: 'Rouge' }],
    });
    findOneMock.mockResolvedValue(cart);

    await service.saveForLater('user1', productId, 'M', 'Rouge');

    expect(cart.items).toHaveLength(0);
    expect(cart.savedForLater).toHaveLength(1);
    expect(cart.save).toHaveBeenCalled();
  });

  it('throws when saving an item that is not in the cart', async () => {
    findOneMock.mockResolvedValue(makeCart());
    await expect(service.saveForLater('user1', productId, 'M', 'Rouge')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('moves an item back to the cart when stock is sufficient', async () => {
    const cart = makeCart({
      savedForLater: [{ productId: new Types.ObjectId(productId), quantity: 1, size: 'M', color: 'Rouge' }],
    });
    findOneMock.mockResolvedValue(cart);
    getVariantStockMock.mockReturnValue(5);

    await service.moveToCart('user1', productId, 'M', 'Rouge');

    expect(cart.savedForLater).toHaveLength(0);
    expect(cart.items).toHaveLength(1);
  });

  it('refuses to move an item back to the cart when stock is now insufficient', async () => {
    const cart = makeCart({
      savedForLater: [{ productId: new Types.ObjectId(productId), quantity: 5, size: 'M', color: 'Rouge' }],
    });
    findOneMock.mockResolvedValue(cart);
    getVariantStockMock.mockReturnValue(0);

    await expect(service.moveToCart('user1', productId, 'M', 'Rouge')).rejects.toThrow(
      BadRequestException,
    );
    // The DB write never happened — nothing was persisted for the failed move.
    expect(cart.save).not.toHaveBeenCalled();
  });
});

describe('CartService — addManyFirstAvailable', () => {
  let service: CartService;
  let findOneMock: jest.Mock;
  let getVariantStockMock: jest.Mock;
  let findByIdMock: jest.Mock;

  const inStockId = new Types.ObjectId().toString();
  const outOfStockId = new Types.ObjectId().toString();
  const missingId = new Types.ObjectId().toString();

  function makeCart() {
    return { userId: 'user1', items: [], savedForLater: [], save: jest.fn().mockResolvedValue(undefined) };
  }

  beforeEach(async () => {
    findOneMock = jest.fn();
    getVariantStockMock = jest.fn(
      (product: { variants: { size: string; color: string; stock: number }[] }, size: string, color: string) => {
        const variant = product.variants.find((v) => v.size === size && v.color === color);
        return variant?.stock ?? 0;
      },
    );
    findByIdMock = jest.fn((id: string) => {
      if (id === inStockId) {
        return Promise.resolve({
          _id: inStockId,
          slug: 'p',
          name: { fr: 'x', en: 'x', ar: 'x', tn: 'x' },
          images: [],
          price: 10,
          isActive: true,
          variants: [{ size: 'M', color: 'Rouge', stock: 5, priceOverride: null }],
        });
      }
      if (id === outOfStockId) {
        return Promise.resolve({
          _id: outOfStockId,
          isActive: true,
          variants: [{ size: 'M', color: 'Rouge', stock: 0, priceOverride: null }],
        });
      }
      return Promise.resolve(null);
    });

    const module = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getModelToken(Cart.name),
          useValue: { findOne: (...args: unknown[]) => ({ exec: () => findOneMock(...args) }) },
        },
        { provide: ProductsService, useValue: { findById: findByIdMock, getVariantStock: getVariantStockMock } },
      ],
    }).compile();

    service = module.get(CartService);
    findOneMock.mockResolvedValue(makeCart());
  });

  it('adds available products and skips out-of-stock or missing ones without failing', async () => {
    const result = await service.addManyFirstAvailable('user1', [inStockId, outOfStockId, missingId]);

    expect(result.skippedProductIds).toEqual(expect.arrayContaining([outOfStockId, missingId]));
    expect(result.skippedProductIds).not.toContain(inStockId);
  });
});
