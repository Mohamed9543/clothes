import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedTextDto } from '../../catalog/dto/localized-text.dto';

export class CreateOutfitDto {
  @IsString()
  slug: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description: LocalizedTextDto;

  @IsString()
  coverImage: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  productIds: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bundleDiscountPercent?: number | null;
}
