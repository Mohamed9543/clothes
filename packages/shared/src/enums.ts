/**
 * Tunisia's 24 governorates.
 */
export enum Governorate {
  ARIANA = 'ariana',
  BEJA = 'beja',
  BEN_AROUS = 'ben_arous',
  BIZERTE = 'bizerte',
  GABES = 'gabes',
  GAFSA = 'gafsa',
  JENDOUBA = 'jendouba',
  KAIROUAN = 'kairouan',
  KASSERINE = 'kasserine',
  KEBILI = 'kebili',
  KEF = 'kef',
  MAHDIA = 'mahdia',
  MANOUBA = 'manouba',
  MEDENINE = 'medenine',
  MONASTIR = 'monastir',
  NABEUL = 'nabeul',
  SFAX = 'sfax',
  SIDI_BOUZID = 'sidi_bouzid',
  SILIANA = 'siliana',
  SOUSSE = 'sousse',
  TATAOUINE = 'tataouine',
  TOZEUR = 'tozeur',
  TUNIS = 'tunis',
  ZAGHOUAN = 'zaghouan',
}

/**
 * Delivery pricing zones used to compute a flat shipping fee per governorate.
 * Kept coarse-grained on purpose (Phase 1) — tunable without touching order logic.
 */
export enum ShippingZone {
  GRAND_TUNIS = 'grand_tunis',
  COASTAL = 'coastal',
  INTERIOR = 'interior',
  REMOTE_SOUTH = 'remote_south',
}

export const GOVERNORATE_ZONE_MAP: Record<Governorate, ShippingZone> = {
  [Governorate.TUNIS]: ShippingZone.GRAND_TUNIS,
  [Governorate.ARIANA]: ShippingZone.GRAND_TUNIS,
  [Governorate.BEN_AROUS]: ShippingZone.GRAND_TUNIS,
  [Governorate.MANOUBA]: ShippingZone.GRAND_TUNIS,

  [Governorate.NABEUL]: ShippingZone.COASTAL,
  [Governorate.BIZERTE]: ShippingZone.COASTAL,
  [Governorate.SOUSSE]: ShippingZone.COASTAL,
  [Governorate.MONASTIR]: ShippingZone.COASTAL,
  [Governorate.MAHDIA]: ShippingZone.COASTAL,
  [Governorate.SFAX]: ShippingZone.COASTAL,

  [Governorate.BEJA]: ShippingZone.INTERIOR,
  [Governorate.JENDOUBA]: ShippingZone.INTERIOR,
  [Governorate.KEF]: ShippingZone.INTERIOR,
  [Governorate.SILIANA]: ShippingZone.INTERIOR,
  [Governorate.KAIROUAN]: ShippingZone.INTERIOR,
  [Governorate.KASSERINE]: ShippingZone.INTERIOR,
  [Governorate.SIDI_BOUZID]: ShippingZone.INTERIOR,
  [Governorate.GAFSA]: ShippingZone.INTERIOR,
  [Governorate.ZAGHOUAN]: ShippingZone.INTERIOR,

  [Governorate.GABES]: ShippingZone.REMOTE_SOUTH,
  [Governorate.MEDENINE]: ShippingZone.REMOTE_SOUTH,
  [Governorate.TATAOUINE]: ShippingZone.REMOTE_SOUTH,
  [Governorate.KEBILI]: ShippingZone.REMOTE_SOUTH,
  [Governorate.TOZEUR]: ShippingZone.REMOTE_SOUTH,
};

/**
 * Flat delivery fee (TND) per zone. Adjust freely — nothing else depends on
 * the numeric values, only on the zone/governorate mapping above.
 */
export const SHIPPING_FEE_BY_ZONE: Record<ShippingZone, number> = {
  [ShippingZone.GRAND_TUNIS]: 7,
  [ShippingZone.COASTAL]: 8,
  [ShippingZone.INTERIOR]: 8,
  [ShippingZone.REMOTE_SOUTH]: 10,
};

export const ALL_GOVERNORATES: Governorate[] = Object.values(Governorate);

/**
 * Lifecycle of a `Payment` record, distinct from `Order.status` (fulfillment).
 */
export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * "Libas Rewards" loyalty conversion rates — shared by the backend's discount
 * calculation and the frontend's points-value display so they never disagree.
 */
export const LOYALTY_POINTS_PER_TND_SPENT = 1;
export const LOYALTY_TND_PER_POINT_REDEEMED = 0.05; // 20 points = 1 TND

export type DiscountSource = 'coupon' | 'points' | 'bundle';
