import { IsBoolean } from 'class-validator';

export class SetLookStatusDto {
  @IsBoolean()
  isHidden: boolean;
}
