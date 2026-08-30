import { IsEnum, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from 'class-validator';
import { FitPreference, Gender } from '../schemas/user.schema';

export class UpdateProfileDto {
  @IsOptional()
  @IsUrl({ require_tld: false })
  avatarUrl?: string | null;

  @IsOptional()
  @IsInt()
  @Min(50)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(300)
  weightKg?: number;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(200)
  chestCm?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(200)
  waistCm?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(200)
  hipsCm?: number;

  @IsOptional()
  @IsInt()
  @Min(40)
  @Max(140)
  legLengthCm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  usualSize?: string;

  @IsOptional()
  @IsEnum(FitPreference)
  fitPreference?: FitPreference;
}
