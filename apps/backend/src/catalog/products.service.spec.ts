import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Product, isProductOnSale } from './schemas/product.schema';
import { StockMovement } from './schemas/stock-movement.schema';
import { ProductsService } from './products.service';

describe('ProductsService — decrementStock (size×color variants)', () => {
  let service: ProductsService;
  let updateOneMock: jest.Mock;
  let createMovementMock: jest.Mock;

  beforeEach(async () => {
    updateOneMock = jest.fn();
    createMovementMock = jest.fn().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: {
            updateOne: (...args: unknown[]) => ({
              exec: () => updateOneMock(...args),
            }),
          },
        },
        {
          provide: getModelToken(StockMovement.name),
          useValue: {
            create: createMovementMock,
          },
        },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('decrements stock for the exact size+color match when stock is sufficient', async () => {
    updateOneMock.mockResolvedValue({ matchedCount: 1 });

    await service.decrementStock('prod1', 'M', 'Rouge', 2, 'order1');

    expect(updateOneMock).toHaveBeenCalledTimes(1);
    const [filter, update] = updateOneMock.mock.calls[0];
    expect(filter).toEqual({
      _id: 'prod1',
      variants: { $elemMatch: { size: 'M', color: 'Rouge', stock: { $gte: 2 } } },
    });
    expect(update).toEqual({ $inc: { 'variants.$.stock': -2 } });
    expect(createMovementMock).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 'prod1', size: 'M', color: 'Rouge', quantityChange: -2 }),
    );
  });

  it('throws BadRequestException when stock is insufficient for the size+color', async () => {
    updateOneMock.mockResolvedValue({ matchedCount: 0 });

    await expect(service.decrementStock('prod1', 'M', 'Rouge', 100, 'order1')).rejects.toThrow(
      BadRequestException,
    );
    expect(createMovementMock).not.toHaveBeenCalled();
  });

  it('does not touch a different color for the same size (isolation)', async () => {
    // The $elemMatch filter itself enforces isolation — this test documents the
    // exact filter shape used so a same-size-different-color variant is never matched.
    updateOneMock.mockResolvedValue({ matchedCount: 1 });

    await service.decrementStock('prod1', 'M', 'Bleu', 1, 'order1');

    const [filter] = updateOneMock.mock.calls[0];
    expect(filter.variants.$elemMatch.color).toBe('Bleu');
    expect(filter.variants.$elemMatch.color).not.toBe('Rouge');
  });

  it('fails cleanly on the second decrement once stock is exhausted (sequential race)', async () => {
    updateOneMock.mockResolvedValueOnce({ matchedCount: 1 }); // first decrement succeeds
    updateOneMock.mockResolvedValueOnce({ matchedCount: 0 }); // second decrement finds insufficient stock

    await service.decrementStock('prod1', 'M', 'Rouge', 5, 'order1');
    await expect(service.decrementStock('prod1', 'M', 'Rouge', 5, 'order2')).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('ProductsService — findAll (color/availability filter + sort)', () => {
  let service: ProductsService;
  let findMock: jest.Mock;
  let capturedFilter: unknown;
  let capturedSort: unknown;

  function fakeProductDoc(overrides: Partial<{ variants: { color: string; stock: number }[] }> = {}) {
    return {
      toObject: () => ({ _id: 'p1', variants: overrides.variants ?? [{ color: 'Rouge', stock: 3 }] }),
      variants: overrides.variants ?? [{ color: 'Rouge', stock: 3 }],
    };
  }

  beforeEach(async () => {
    findMock = jest.fn().mockReturnValue({
      skip: () => ({
        limit: () => ({
          sort: (sortArg: unknown) => {
            capturedSort = sortArg;
            return { exec: () => Promise.resolve([fakeProductDoc()]) };
          },
        }),
      }),
    });

    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: getModelToken(Product.name),
          useValue: {
            find: (filter: unknown) => {
              capturedFilter = filter;
              return findMock(filter);
            },
            countDocuments: () => ({ exec: () => Promise.resolve(1) }),
          },
        },
        { provide: getModelToken(StockMovement.name), useValue: {} },
      ],
    }).compile();

    service = module.get(ProductsService);
  });

  it('combines color and inStockOnly into a single $elemMatch (no cross-variant false match)', async () => {
    await service.findAll({ color: 'Rouge', inStockOnly: true } as never);

    expect(capturedFilter).toMatchObject({
      variants: { $elemMatch: { color: 'Rouge', stock: { $gt: 0 } } },
    });
  });

  it('sorts by price ascending when sort=price_asc', async () => {
    await service.findAll({ sort: 'price_asc' } as never);
    expect(capturedSort).toEqual({ price: 1 });
  });

  it('sorts by price descending when sort=price_desc', async () => {
    await service.findAll({ sort: 'price_desc' } as never);
    expect(capturedSort).toEqual({ price: -1 });
  });

  it('defaults to newest-first when no sort is given', async () => {
    await service.findAll({} as never);
    expect(capturedSort).toEqual({ createdAt: -1 });
  });
});

describe('isProductOnSale', () => {
  it('is false when compareAtPrice is not set', () => {
    expect(isProductOnSale({ price: 50, compareAtPrice: null, saleEndsAt: null })).toBe(false);
  });

  it('is false when compareAtPrice is not actually higher than price', () => {
    expect(isProductOnSale({ price: 50, compareAtPrice: 50, saleEndsAt: null })).toBe(false);
  });

  it('is true when compareAtPrice is higher than price and there is no end date', () => {
    expect(isProductOnSale({ price: 50, compareAtPrice: 70, saleEndsAt: null })).toBe(true);
  });

  it('is true while saleEndsAt is still in the future', () => {
    const future = new Date(Date.now() + 60_000);
    expect(isProductOnSale({ price: 50, compareAtPrice: 70, saleEndsAt: future })).toBe(true);
  });

  it('is false once saleEndsAt has passed', () => {
    const past = new Date(Date.now() - 60_000);
    expect(isProductOnSale({ price: 50, compareAtPrice: 70, saleEndsAt: past })).toBe(false);
  });
});
