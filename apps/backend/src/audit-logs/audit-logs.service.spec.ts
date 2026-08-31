import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { AuditLog } from './schemas/audit-log.schema';
import { User } from '../users/schemas/user.schema';

describe('AuditLogsService', () => {
  let service: AuditLogsService;
  let createMock: jest.Mock;
  let findMock: jest.Mock;
  let countMock: jest.Mock;
  let userFindMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue(undefined);
    findMock = jest.fn();
    countMock = jest.fn().mockResolvedValue(1);
    userFindMock = jest.fn().mockResolvedValue([
      { _id: { toString: () => 'admin1' }, firstName: 'Ada', lastName: 'Min' },
    ]);

    const module = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: getModelToken(AuditLog.name),
          useValue: {
            create: createMock,
            find: () => ({
              sort: () => ({
                skip: () => ({ limit: () => ({ exec: () => findMock() }) }),
              }),
            }),
            countDocuments: () => ({ exec: () => countMock() }),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: { find: () => ({ exec: () => userFindMock() }) },
        },
      ],
    }).compile();

    service = module.get(AuditLogsService);
  });

  it('log persists the expected fields', async () => {
    await service.log({
      adminUserId: 'admin1',
      action: 'product_deleted',
      targetType: 'product',
      targetId: 'p1',
      details: 'some-slug',
    });

    expect(createMock).toHaveBeenCalledWith({
      adminUserId: 'admin1',
      action: 'product_deleted',
      targetType: 'product',
      targetId: 'p1',
      details: 'some-slug',
    });
  });

  it('findAllAdmin enriches each entry with the admin\'s name', async () => {
    findMock.mockResolvedValue([
      {
        _id: { toString: () => 'log1' },
        adminUserId: { toString: () => 'admin1' },
        action: 'product_deleted',
        targetType: 'product',
        targetId: 'p1',
        details: null,
        createdAt: new Date('2026-01-01'),
      },
    ]);

    const result = await service.findAllAdmin(1, 50);

    expect(result.items[0].adminName).toBe('Ada Min');
    expect(result.total).toBe(1);
  });
});
