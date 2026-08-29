import { IsInt, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ProductVariantDto {
  @IsString()
  @MinLength(1)
  sku: string;

  @IsString()
  @MinLength(1)
  size: string;

  @IsString()
  @MinLength(1)
  color: string;

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  priceOverride?: number | null;
}
