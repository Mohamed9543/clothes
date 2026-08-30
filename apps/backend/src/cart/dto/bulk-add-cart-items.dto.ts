import { ArrayMinSize, IsArray, IsMongoId } from 'class-validator';

export class BulkAddCartItemsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsMongoId({ each: true })
  productIds: string[];
}
