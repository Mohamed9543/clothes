import { IsInt, IsString, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  size: string;

  @IsString()
  color: string;
}
