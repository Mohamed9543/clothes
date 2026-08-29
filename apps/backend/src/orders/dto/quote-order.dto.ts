import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Governorate } from '@libas/shared';

export class QuoteOrderDto {
  @IsEnum(Governorate)
  governorate: Governorate;

  @IsOptional()
  @IsString()
  couponCode?: string;
}
