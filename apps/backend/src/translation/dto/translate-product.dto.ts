import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export enum SourceLocale {
  AR = 'ar',
  TN = 'tn',
  FR = 'fr',
  EN = 'en',
}

export class TranslateProductDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description: string;

  @IsEnum(SourceLocale)
  sourceLocale: SourceLocale;
}
