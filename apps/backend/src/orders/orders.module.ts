import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { OutfitsModule } from '../outfits/outfits.module';
import { PaymentsModule } from '../payments/payments.module';
import { PromotionsModule } from '../promotions/promotions.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { ShippingFeeService } from './shipping-fee.service';
import {
  OrderStatusHistory,
  OrderStatusHistorySchema,
} from './schemas/order-status-history.schema';
import { Order, OrderSchema } from './schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: OrderStatusHistory.name, schema: OrderStatusHistorySchema },
      { name: User.name, schema: UserSchema },
    ]),
    CartModule,
    CatalogModule,
    OutfitsModule,
    PaymentsModule,
    PromotionsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ShippingFeeService],
  exports: [OrdersService],
})
export class OrdersModule {}
