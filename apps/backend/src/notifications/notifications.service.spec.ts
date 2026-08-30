import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';

describe('NotificationsService — scoping', () => {
  let service: NotificationsService;
  let findMock: jest.Mock;
  let updateManyMock: jest.Mock;
  let capturedFilter: unknown;

  beforeEach(async () => {
    findMock = jest.fn();
    updateManyMock = jest.fn().mockResolvedValue({});

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: {
            find: (filter: unknown) => {
              capturedFilter = filter;
              return {
                sort: () => ({ limit: () => ({ exec: () => findMock() }) }),
              };
            },
            updateMany: (filter: unknown, ...rest: unknown[]) => {
              capturedFilter = filter;
              return { exec: () => updateManyMock(filter, ...rest) };
            },
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  it('scopes a customer to only their own notifications', async () => {
    findMock.mockResolvedValue([]);
    await service.findForUser('user1', false);
    expect(capturedFilter).toEqual({ userId: 'user1' });
  });

  it('scopes an admin to their own notifications plus broadcasts', async () => {
    findMock.mockResolvedValue([]);
    await service.findForUser('admin1', true);
    expect(capturedFilter).toEqual({ $or: [{ userId: 'admin1' }, { userId: null }] });
  });

  it('markAllRead only touches the caller\'s own scope', async () => {
    await service.markAllRead('user1', false);
    expect(capturedFilter).toEqual({ userId: 'user1' });
  });
});
