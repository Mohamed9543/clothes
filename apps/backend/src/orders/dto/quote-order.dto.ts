import { IsEnum } from 'class-validator';
import { Governorate } from '@libas/shared';

export class QuoteOrderDto {
  @IsEnum(Governorate)
  governorate: Governorate;
}
