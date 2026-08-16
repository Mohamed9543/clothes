import { IsEnum, IsInt, IsOptional, IsUrl, Max, Min } from 'class-validator';
import { Gender } from '../schemas/user.schema';

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
}
