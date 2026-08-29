import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { WishlistService } from './wishlist.service';
import { Wishlist } from './schemas/wishlist.schema';

describe('WishlistService — ownership isolation', () => {
  let service: WishlistService;
  let findByIdMock: jest.Mock;

  function makeList(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      _id: 'list1',
      userId: { toString: () => 'owner-user' },
      productIds: [],
      isDefault: false,
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  beforeEach(async () => {
    findByIdMock = jest.fn();
    const module = await Test.createTestingModule({
      providers: [
        WishlistService,
        {
          provide: getModelToken(Wishlist.name),
          useValue: { findById: (...args: unknown[]) => ({ exec: () => findByIdMock(...args) }) },
        },
      ],
    }).compile();
    service = module.get(WishlistService);
  });

  it('lets the owner add an item to their own list', async () => {
    const list = makeList();
    findByIdMock.mockResolvedValue(list);

    await service.addItem('owner-user', 'list1', 'product1');

    expect(list.productIds).toContain('product1');
    expect(list.save).toHaveBeenCalled();
  });

  it('does not duplicate an already-present product', async () => {
    const list = makeList({ productIds: ['product1'] });
    findByIdMock.mockResolvedValue(list);

    await service.addItem('owner-user', 'list1', 'product1');

    expect(list.productIds).toEqual(['product1']);
  });

  it('refuses to let a different user modify the list (isolation)', async () => {
    const list = makeList();
    findByIdMock.mockResolvedValue(list);

    await expect(service.addItem('someone-else', 'list1', 'product1')).rejects.toThrow(
      ForbiddenException,
    );
    expect(list.save).not.toHaveBeenCalled();
  });

  it('throws NotFoundException for a non-existent list', async () => {
    findByIdMock.mockResolvedValue(null);
    await expect(service.addItem('owner-user', 'missing', 'product1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
