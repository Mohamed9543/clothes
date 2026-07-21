import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ProductAudience, ProductType } from '../schemas/product.schema';
import { LocalizedTextDto } from './localized-text.dto';

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
  @IsString({ each: true })
  sizes: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  colors?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsNumber()
  @Min(0)
  stock: number;
}
