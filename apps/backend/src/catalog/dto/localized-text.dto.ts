import { IsString, MaxLength, MinLength } from 'class-validator';

export class LocalizedTextDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  ar: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  tn: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  fr: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  en: string;
}
