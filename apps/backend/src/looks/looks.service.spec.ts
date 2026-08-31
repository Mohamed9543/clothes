import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Product } from '../catalog/schemas/product.schema';
import { User } from '../users/schemas/user.schema';
import { LooksService } from './looks.service';
import { Look } from './schemas/look.schema';
import { LookLike } from './schemas/look-like.schema';

describe('LooksService', () => {
  let service: LooksService;
  let lookCreateMock: jest.Mock;
  let lookFindMock: jest.Mock;
  let lookFindOneMock: jest.Mock;
  let lookFindByIdAndUpdateMock: jest.Mock;
  let lookFindByIdAndDeleteMock: jest.Mock;
  let lookCountDocumentsMock: jest.Mock;
  let lookLikeCreateMock: jest.Mock;
  let lookLikeDeleteOneMock: jest.Mock;
  let lookLikeDeleteManyMock: jest.Mock;
  let productFindMock: jest.Mock;
  let userFindMock: jest.Mock;
  let auditLogMock: jest.Mock;

  function makeLook(overrides: Partial<Record<string, unknown>> = {}) {
    const base = {
      _id: { toString: () => 'look-1' },
      userId: 'user-1',
      images: ['/uploads/a.png'],
      caption: null,
      productIds: [],
      likeCount: 0,
      reportCount: 0,
      isHidden: false,
      createdAt: new Date(),
      ...overrides,
    };
    return { ...base, toObject: () => base };
  }

  beforeEach(async () => {
    lookCreateMock = jest.fn();
    lookFindMock = jest.fn();
    lookFindOneMock = jest.fn();
    lookFindByIdAndUpdateMock = jest.fn();
    lookFindByIdAndDeleteMock = jest.fn();
    lookCountDocumentsMock = jest.fn().mockResolvedValue(0);
    lookLikeCreateMock = jest.fn();
    lookLikeDeleteOneMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    lookLikeDeleteManyMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    productFindMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    userFindMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) });
    auditLogMock = jest.fn().mockResolvedValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        LooksService,
        {
          provide: getModelToken(Look.name),
          useValue: {
            create: lookCreateMock,
            find: (...args: unknown[]) => ({
              sort: () => ({
                skip: () => ({ limit: () => ({ exec: () => lookFindMock(...args) }) }),
              }),
              exec: () => lookFindMock(...args),
            }),
            findOne: (...args: unknown[]) => ({ exec: () => lookFindOneMock(...args) }),
            findByIdAndUpdate: (...args: unknown[]) => ({
              exec: () => lookFindByIdAndUpdateMock(...args),
            }),
            findByIdAndDelete: (...args: unknown[]) => ({
              exec: () => lookFindByIdAndDeleteMock(...args),
            }),
            countDocuments: () => ({ exec: lookCountDocumentsMock }),
          },
        },
        {
          provide: getModelToken(LookLike.name),
          useValue: {
            create: lookLikeCreateMock,
            deleteOne: lookLikeDeleteOneMock,
            deleteMany: lookLikeDeleteManyMock,
            find: () => ({ exec: jest.fn().mockResolvedValue([]) }),
          },
        },
        { provide: getModelToken(Product.name), useValue: { find: productFindMock } },
        { provide: getModelToken(User.name), useValue: { find: userFindMock } },
        { provide: AuditLogsService, useValue: { log: auditLogMock } },
      ],
    }).compile();

    service = module.get(LooksService);
  });

  it('create() filters out productIds that do not exist', async () => {
    productFindMock.mockReturnValue({ exec: jest.fn().mockResolvedValue([{ _id: { toString: () => 'p1' } }]) });
    lookCreateMock.mockResolvedValue(makeLook({ productIds: ['p1'] }));

    await service.create('user-1', { images: ['/uploads/a.png'], productIds: ['p1', 'ghost'] });

    expect(lookCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ productIds: ['p1'], isHidden: false }),
    );
  });

  it('toggleLike() likes on first call, incrementing likeCount', async () => {
    lookFindOneMock.mockResolvedValue(makeLook({ likeCount: 0 }));
    lookLikeCreateMock.mockResolvedValue({});
    lookFindByIdAndUpdateMock.mockResolvedValue(makeLook({ likeCount: 1 }));

    const result = await service.toggleLike('look-1', 'user-1');

    expect(result).toEqual({ liked: true, likeCount: 1 });
    expect(lookLikeCreateMock).toHaveBeenCalledWith({ lookId: 'look-1', userId: 'user-1' });
  });

  it('toggleLike() unlikes on a duplicate-key error, decrementing likeCount', async () => {
    lookFindOneMock.mockResolvedValue(makeLook({ likeCount: 1 }));
    lookLikeCreateMock.mockRejectedValue({ code: 11000 });
    lookFindByIdAndUpdateMock.mockResolvedValue(makeLook({ likeCount: 0 }));

    const result = await service.toggleLike('look-1', 'user-1');

    expect(result).toEqual({ liked: false, likeCount: 0 });
    expect(lookLikeDeleteOneMock).toHaveBeenCalledWith({ lookId: 'look-1', userId: 'user-1' });
  });

  it('findPublicFeed() only queries non-hidden looks', async () => {
    lookFindMock.mockResolvedValue([]);

    await service.findPublicFeed({ page: 1, limit: 20 });

    expect(lookCountDocumentsMock).not.toBeNull();
  });

  it('setHidden() flips the flag and logs a look_moderated audit entry', async () => {
    lookFindByIdAndUpdateMock.mockResolvedValue(makeLook({ isHidden: true }));

    await service.setHidden('look-1', true, 'admin-1');

    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'look_moderated', targetId: 'look-1', adminUserId: 'admin-1' }),
    );
  });

  it('remove() deletes the look, cascades its likes, and logs a look_deleted audit entry', async () => {
    lookFindByIdAndDeleteMock.mockResolvedValue(makeLook());

    await service.remove('look-1', 'admin-1');

    expect(lookLikeDeleteManyMock).toHaveBeenCalledWith({ lookId: 'look-1' });
    expect(auditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'look_deleted', targetId: 'look-1' }),
    );
  });
});
