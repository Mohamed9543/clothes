import { IsString } from 'class-validator';

export class MoveCartItemDto {
  @IsString()
  size: string;

  @IsString()
  color: string;
}
