import { IsIn } from 'class-validator';

export class SimulatePaymentDto {
  @IsIn(['paid', 'failed'])
  outcome: 'paid' | 'failed';
}
