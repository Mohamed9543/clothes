import { Injectable } from '@nestjs/common';
import { Governorate, GOVERNORATE_ZONE_MAP, SHIPPING_FEE_BY_ZONE } from '@libas/shared';

@Injectable()
export class ShippingFeeService {
  computeShippingFee(governorate: Governorate): number {
    const zone = GOVERNORATE_ZONE_MAP[governorate];
    return SHIPPING_FEE_BY_ZONE[zone];
  }
}
