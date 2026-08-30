import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Governorate } from '@libas/shared';

export class QuoteOrderDto {
  @IsEnum(Governorate)
  governorate: Governorate;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  usePoints?: number;
}
