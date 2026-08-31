import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { LooksController } from './looks.controller';
import { LooksService } from './looks.service';
import { Look, LookSchema } from './schemas/look.schema';
import { LookLike, LookLikeSchema } from './schemas/look-like.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Look.name, schema: LookSchema },
      { name: LookLike.name, schema: LookLikeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuditLogsModule,
  ],
  controllers: [LooksController],
  providers: [LooksService],
  exports: [LooksService],
})
export class LooksModule {}
