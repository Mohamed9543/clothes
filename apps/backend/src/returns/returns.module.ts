import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { CatalogModule } from '../catalog/catalog.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { ReturnsController } from './returns.controller';
import { ReturnsService } from './returns.service';
import { Return, ReturnSchema } from './schemas/return.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Return.name, schema: ReturnSchema }]),
    CatalogModule,
    NotificationsModule,
    OrdersModule,
    AuditLogsModule,
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}
