import { IsIn, IsInt, IsOptional, IsString, MaxLength, MinLength, NotEquals } from 'class-validator';
import { StockMovementReason } from '../schemas/stock-movement.schema';

export type ManualStockReason = Exclude<StockMovementReason, StockMovementReason.ORDER>;

const MANUAL_REASONS: ManualStockReason[] = [
  StockMovementReason.RESTOCK,
  StockMovementReason.CORRECTION,
  StockMovementReason.DAMAGE,
];

export class AdjustStockDto {
  @IsString()
  @MinLength(1)
  size: string;

  @IsInt()
  @NotEquals(0)
  quantityChange: number;

  @IsIn(MANUAL_REASONS)
  reason: ManualStockReason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
