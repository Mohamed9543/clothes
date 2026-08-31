import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { PushService } from '../push/push.service';
import { NotificationsService } from './notifications.service';
import { Notification } from './schemas/notification.schema';

describe('NotificationsService — scoping', () => {
  let service: NotificationsService;
  let findMock: jest.Mock;
  let updateManyMock: jest.Mock;
  let createMock: jest.Mock;
  let notifyUserMock: jest.Mock;
  let capturedFilter: unknown;

  beforeEach(async () => {
    findMock = jest.fn();
    updateManyMock = jest.fn().mockResolvedValue({});
    createMock = jest.fn().mockImplementation((doc: unknown) => Promise.resolve(doc));
    notifyUserMock = jest.fn().mockResolvedValue(undefined);

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
            create: createMock,
          },
        },
        { provide: PushService, useValue: { notifyUser: notifyUserMock } },
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

  it('create() triggers a push for a per-user notification', async () => {
    await service.create({ userId: 'user1', type: 'order_status', message: 'Commande expédiée', link: '/commandes/1' });

    expect(notifyUserMock).toHaveBeenCalledWith('user1', {
      title: expect.any(String),
      body: 'Commande expédiée',
      url: '/commandes/1',
    });
  });

  it('create() does not push for a broadcast (userId null) notification', async () => {
    await service.create({ userId: null, type: 'return_requested', message: 'Nouveau retour' });

    expect(notifyUserMock).not.toHaveBeenCalled();
  });
});
