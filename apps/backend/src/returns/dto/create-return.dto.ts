import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ReturnType } from '../schemas/return.schema';

export class ReturnItemDto {
  @IsMongoId()
  productId: string;

  @IsString()
  @MinLength(1)
  size: string;

  @IsString()
  @MinLength(1)
  color: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  exchangeSize?: string;

  @IsOptional()
  @IsString()
  exchangeColor?: string;
}

export class CreateReturnDto {
  @IsMongoId()
  orderId: string;

  @IsEnum(ReturnType)
  type: ReturnType;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];

  @IsString()
  @MinLength(1)
  reason: string;
}
