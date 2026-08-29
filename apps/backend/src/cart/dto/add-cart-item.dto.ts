import { IsInt, IsMongoId, IsString, Min } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  size: string;

  @IsString()
  color: string;
}
