import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserAdminDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  lastName?: string;
}
