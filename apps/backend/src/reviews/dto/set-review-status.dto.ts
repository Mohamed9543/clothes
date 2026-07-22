import { IsBoolean } from 'class-validator';

export class SetReviewStatusDto {
  @IsBoolean()
  isHidden: boolean;
}
