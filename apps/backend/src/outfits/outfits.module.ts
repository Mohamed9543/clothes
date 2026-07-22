import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../catalog/schemas/product.schema';
import { OutfitsController } from './outfits.controller';
import { OutfitsService } from './outfits.service';
import { Outfit, OutfitSchema } from './schemas/outfit.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Outfit.name, schema: OutfitSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
  ],
  controllers: [OutfitsController],
  providers: [OutfitsService],
})
export class OutfitsModule {}
