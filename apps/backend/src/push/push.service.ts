import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as webpush from 'web-push';
import { EnvConfig } from '../config/env.validation';
import { PushSubscription, PushSubscriptionDocument } from './schemas/push-subscription.schema';

export interface SubscribeInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string | null;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly enabled: boolean;

  constructor(
    @InjectModel(PushSubscription.name)
    private readonly subscriptionModel: Model<PushSubscriptionDocument>,
    private readonly configService: ConfigService<EnvConfig, true>,
  ) {
    const publicKey = this.configService.get('VAPID_PUBLIC_KEY', { infer: true });
    const privateKey = this.configService.get('VAPID_PRIVATE_KEY', { infer: true });
    this.enabled = Boolean(publicKey && privateKey);
    if (this.enabled) {
      webpush.setVapidDetails(
        this.configService.get('VAPID_SUBJECT', { infer: true }),
        publicKey,
        privateKey,
      );
    } else {
      this.logger.warn('VAPID keys are not configured — push notifications are disabled.');
    }
  }

  subscribe(userId: string, input: SubscribeInput): Promise<PushSubscriptionDocument> {
    return this.subscriptionModel
      .findOneAndUpdate(
        { endpoint: input.endpoint },
        { userId, endpoint: input.endpoint, keys: input.keys },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subscriptionModel.deleteOne({ endpoint }).exec();
  }

  async notifyUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.enabled) {
      return;
    }
    const subscriptions = await this.subscriptionModel.find({ userId }).exec();
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: subscription.keys,
            },
            JSON.stringify(payload),
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.subscriptionModel.deleteOne({ _id: subscription._id }).exec();
          } else {
            this.logger.error(`Failed to send push notification: ${(error as Error).message}`);
          }
        }
      }),
    );
  }
}
