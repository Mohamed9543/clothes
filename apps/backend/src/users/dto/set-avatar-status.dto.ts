import { IsBoolean } from 'class-validator';

export class SetAvatarStatusDto {
  @IsBoolean()
  disabled: boolean;
}
