import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as webpush from 'web-push';
import { PushService } from './push.service';
import { PushSubscription } from './schemas/push-subscription.schema';

jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn(),
}));

describe('PushService', () => {
  let service: PushService;
  let findOneAndUpdateMock: jest.Mock;
  let deleteOneMock: jest.Mock;
  let findMock: jest.Mock;
  const config: Record<string, string> = {
    VAPID_PUBLIC_KEY: 'pub',
    VAPID_PRIVATE_KEY: 'priv',
    VAPID_SUBJECT: 'mailto:contact@libas.tn',
  };
  const configService = { get: (key: string) => config[key] } as never;

  beforeEach(async () => {
    findOneAndUpdateMock = jest.fn();
    deleteOneMock = jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) });
    findMock = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        PushService,
        {
          provide: getModelToken(PushSubscription.name),
          useValue: {
            findOneAndUpdate: (...args: unknown[]) => ({
              exec: () => findOneAndUpdateMock(...args),
            }),
            deleteOne: deleteOneMock,
            find: (...args: unknown[]) => ({ exec: () => findMock(...args) }),
          },
        },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(PushService);
  });

  it('subscribe() upserts by endpoint', async () => {
    findOneAndUpdateMock.mockResolvedValue({ endpoint: 'ep-1' });

    await service.subscribe('user1', { endpoint: 'ep-1', keys: { p256dh: 'a', auth: 'b' } });

    expect(findOneAndUpdateMock).toHaveBeenCalled();
  });

  it('notifyUser sends a push to every subscription for that user', async () => {
    findMock.mockResolvedValue([
      { endpoint: 'ep-1', keys: { p256dh: 'a', auth: 'b' }, _id: '1' },
      { endpoint: 'ep-2', keys: { p256dh: 'c', auth: 'd' }, _id: '2' },
    ]);
    (webpush.sendNotification as jest.Mock).mockResolvedValue(undefined);

    await service.notifyUser('user1', { title: 'Titre', body: 'Corps' });

    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
  });

  it('notifyUser prunes a subscription that responds 410 Gone', async () => {
    findMock.mockResolvedValue([{ endpoint: 'ep-1', keys: { p256dh: 'a', auth: 'b' }, _id: 'sub-1' }]);
    (webpush.sendNotification as jest.Mock).mockRejectedValue({ statusCode: 410 });

    await service.notifyUser('user1', { title: 'Titre', body: 'Corps' });

    expect(deleteOneMock).toHaveBeenCalledWith({ _id: 'sub-1' });
  });
});
