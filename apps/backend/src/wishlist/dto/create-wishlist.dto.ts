import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWishlistDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;
}
