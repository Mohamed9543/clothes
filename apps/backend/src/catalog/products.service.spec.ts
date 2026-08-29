import { BadRequestException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Product } from './schemas/product.schema';
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
