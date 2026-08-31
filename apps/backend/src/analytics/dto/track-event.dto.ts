import { IsIn } from 'class-validator';
import type { AnalyticsEventType } from '../schemas/analytics-event.schema';

const KNOWN_EVENT_TYPES: AnalyticsEventType[] = ['tryon_opened'];

export class TrackEventDto {
  @IsIn(KNOWN_EVENT_TYPES)
  type: AnalyticsEventType;
}
