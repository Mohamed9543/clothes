import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsEvent, AnalyticsEventSchema } from '../analytics/schemas/analytics-event.schema';
import { Conversation, ConversationSchema } from '../chat/schemas/conversation.schema';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Outfit, OutfitSchema } from '../outfits/schemas/outfit.schema';
import { Return, ReturnSchema } from '../returns/schemas/return.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Return.name, schema: ReturnSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: Outfit.name, schema: OutfitSchema },
      { name: AnalyticsEvent.name, schema: AnalyticsEventSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
