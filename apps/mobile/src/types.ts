// Local mirror of the API response shapes consumed by this app. `@libas/shared`
// stays enums-only by convention (see apps/web) — REST response shapes are
// duplicated per-client rather than adding a shared API-types package.

export interface LocalizedText {
  ar: string;
  tn: string;
  fr: string;
  en: string;
}

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride: number | null;
}

export interface PublicProduct {
  _id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  compareAtPrice: number | null;
  saleEndsAt: string | null;
  audience: string;
  type: string;
  variants: ProductVariant[];
  images: string[];
  isActive: boolean;
  tryOnEnabled: boolean;
  modelUrl: string | null;
  isLowStock: boolean;
  isOutOfStock: boolean;
  isOnSale: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  preferredLanguage: string;
  avatarUrl: string | null;
  avatarDisabled: boolean;
  heightCm: number | null;
  weightKg: number | null;
  gender: string | null;
  loyaltyPoints: number;
}

export interface AuthResult {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
}

export interface EnrichedCartItem {
  productId: string;
  slug: string;
  name: LocalizedText;
  image: string | null;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
  subtotal: number;
}

export interface EnrichedCart {
  items: EnrichedCartItem[];
  savedForLater: EnrichedCartItem[];
  total: number;
}

export interface OrderQuote {
  itemsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  discountSource: string | null;
  total: number;
}

export interface OrderItem {
  productId: string;
  name: LocalizedText;
  unitPrice: number;
  quantity: number;
  size: string;
  color: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  governorate: string;
  delegation: string;
  country: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'card';
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface CreateOrderResult {
  order: Order;
  paymentRedirectUrl?: string;
}

export interface Outfit {
  _id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  coverImage: string;
  productIds: string[];
  isFeatured: boolean;
  bundleDiscountPercent: number | null;
}

export interface OutfitWithProducts extends Outfit {
  products: PublicProduct[];
  totalPrice: number;
  bundlePrice: number | null;
}

export interface BulkAddResult {
  skippedProductIds: string[];
}

export interface Wishlist {
  _id: string;
  name: string;
  productIds: string[];
  isDefault: boolean;
}

export interface LookProductSummary {
  _id: string;
  slug: string;
  name: LocalizedText;
  image: string | null;
}

export interface Look {
  _id: string;
  authorName: string;
  images: string[];
  caption: string | null;
  productIds: string[];
  products: LookProductSummary[];
  likeCount: number;
  isHidden: boolean;
  createdAt: string;
}

export type ReviewFit = 'small' | 'true_to_size' | 'large';

export interface Review {
  _id: string;
  authorName: string;
  rating: number;
  comment: string;
  fit: ReviewFit | null;
  photos: string[];
  createdAt: string;
}

export interface ProductReviewsResult {
  reviews: Review[];
  avgRating: number;
  count: number;
}

export interface SizeRecommendation {
  recommendedSize: string | null;
  confidence: 'high' | 'medium' | 'none';
  message: string;
}

export type ReturnType = 'return' | 'exchange';
export type ReturnStatus =
  | 'requested'
  | 'accepted'
  | 'return_shipped'
  | 'received'
  | 'completed'
  | 'rejected';

export interface ReturnRequest {
  _id: string;
  orderId: string;
  type: ReturnType;
  items: {
    productId: string;
    size: string;
    color: string;
    quantity: number;
    exchangeSize: string | null;
    exchangeColor: string | null;
  }[];
  reason: string;
  status: ReturnStatus;
  refundAmount: number | null;
  createdAt: string;
}

export interface ChatToolProduct {
  id: string;
  slug: string;
  name: LocalizedText;
  price: number;
  image: string | null;
}

export interface ChatComposedOutfit {
  items: ChatToolProduct[];
  totalPrice: number;
  allInStock: boolean;
}

export interface ChatReply {
  message: string;
  products: ChatToolProduct[];
  outfit?: ChatComposedOutfit;
}

export interface Conversation {
  _id: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
}
