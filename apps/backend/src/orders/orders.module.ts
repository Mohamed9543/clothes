import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartModule } from '../cart/cart.module';
import { CatalogModule } from '../catalog/catalog.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
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
    ]),
    CartModule,
    CatalogModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
