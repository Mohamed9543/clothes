import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AnalyticsEvent, AnalyticsEventDocument, AnalyticsEventType } from './schemas/analytics-event.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(AnalyticsEvent.name)
    private readonly analyticsEventModel: Model<AnalyticsEventDocument>,
  ) {}

  async track(type: AnalyticsEventType, userId: string | null): Promise<void> {
    await this.analyticsEventModel.create({ type, userId });
  }

  countSince(type: AnalyticsEventType, since: Date): Promise<number> {
    return this.analyticsEventModel.countDocuments({ type, createdAt: { $gte: since } }).exec();
  }
}
