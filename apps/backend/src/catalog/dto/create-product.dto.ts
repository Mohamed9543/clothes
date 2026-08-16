import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductAudience, ProductType } from '../schemas/product.schema';
import { LocalizedTextDto } from './localized-text.dto';
import { ProductVariantDto } from './product-variant.dto';

export class CreateProductDto {
  @IsString()
  slug: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  name: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description: LocalizedTextDto;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ProductAudience)
  audience: ProductAudience;

  @IsEnum(ProductType)
  type: ProductType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  tryOnEnabled?: boolean;

  @IsString()
  @IsOptional()
  modelUrl?: string;
}
