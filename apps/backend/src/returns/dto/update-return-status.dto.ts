import { IsEnum } from 'class-validator';
import { ReturnStatus } from '../schemas/return.schema';

export class UpdateReturnStatusDto {
  @IsEnum(ReturnStatus)
  status: ReturnStatus;
}
