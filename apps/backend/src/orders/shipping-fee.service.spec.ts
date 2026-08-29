import { ALL_GOVERNORATES, Governorate, GOVERNORATE_ZONE_MAP, SHIPPING_FEE_BY_ZONE } from '@libas/shared';
import { ShippingFeeService } from './shipping-fee.service';

describe('ShippingFeeService', () => {
  const service = new ShippingFeeService();

  it.each(ALL_GOVERNORATES)('maps %s to its expected zone fee', (governorate: Governorate) => {
    const expectedZone = GOVERNORATE_ZONE_MAP[governorate];
    const expectedFee = SHIPPING_FEE_BY_ZONE[expectedZone];
    expect(service.computeShippingFee(governorate)).toBe(expectedFee);
  });

  it('charges the cheapest rate for Grand Tunis', () => {
    expect(service.computeShippingFee(Governorate.TUNIS)).toBe(7);
  });

  it('charges the highest rate for remote southern governorates', () => {
    expect(service.computeShippingFee(Governorate.TATAOUINE)).toBe(10);
  });
});
