import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
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
}
