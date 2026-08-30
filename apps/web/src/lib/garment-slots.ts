import type { ProductType } from '@/types';

export type GarmentSlot = 'upper' | 'lower' | 'feet' | 'accessory';

export const GARMENT_SLOTS: GarmentSlot[] = ['upper', 'lower', 'feet', 'accessory'];

// 'robe' is a full-body garment — it occupies both 'upper' and 'lower' at
// once rather than getting a 5th slot of its own.
export function slotsForType(type: ProductType): GarmentSlot[] {
  switch (type) {
    case 'pull':
    case 'chemise':
    case 'veste':
      return ['upper'];
    case 'robe':
      return ['upper', 'lower'];
    case 'pantalon':
      return ['lower'];
    case 'chaussure':
      return ['feet'];
    case 'accessoire':
    default:
      return ['accessory'];
  }
}
