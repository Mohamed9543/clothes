import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { TranslationModule } from '../translation/translation.module';
import { Product, ProductSchema } from './schemas/product.schema';
import { StockMovement, StockMovementSchema } from './schemas/stock-movement.schema';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
    ]),
    TranslationModule,
    AuditLogsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class CatalogModule {}
