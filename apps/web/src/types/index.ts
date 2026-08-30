import type { Governorate } from '@libas/shared';

export { Governorate, ALL_GOVERNORATES } from '@libas/shared';

export interface LocalizedText {
  ar: string;
  tn: string;
  fr: string;
  en: string;
}

export type ProductAudience = 'men' | 'women' | 'kids';
export type ProductType =
  | 'pull'
  | 'pantalon'
  | 'chemise'
  | 'robe'
  | 'veste'
  | 'chaussure'
  | 'accessoire';

export interface ProductVariant {
  sku: string;
  size: string;
  color: string;
  stock: number;
  priceOverride: number | null;
}

export interface Product {
  _id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  audience: ProductAudience;
  type: ProductType;
  variants: ProductVariant[];
  images: string[];
  isActive: boolean;
  tryOnEnabled: boolean;
  modelUrl: string | null;
}

export interface AdminProduct extends Product {
  totalStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

// Shape returned by the public GET /products and GET /products/:slug
// endpoints — includes availability flags but never the exact stock count.
export interface PublicProduct extends Product {
  isLowStock: boolean;
  isOutOfStock: boolean;
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc';

export interface ImportSummary {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}

export type StockMovementReason = 'order' | 'restock' | 'correction' | 'damage';

export interface StockMovement {
  _id: string;
  productId: string;
  size: string;
  color: string;
  quantityChange: number;
  reason: StockMovementReason;
  orderId: string | null;
  note: string;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Review {
  _id: string;
  productId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  fit: ReviewFit | null;
  photos: string[];
  reportCount: number;
  isHidden: boolean;
  createdAt: string;
}

export interface ReviewWithProduct extends Review {
  productName: LocalizedText;
  productSlug: string;
}

export interface ProductReviewsResult {
  reviews: Review[];
  avgRating: number;
  count: number;
}

export interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  preferredLanguage: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface TopProduct {
  productId: string;
  name: LocalizedText;
  quantity: number;
  revenue: number;
}

export interface CategorySales {
  type: ProductType;
  quantity: number;
  revenue: number;
}

export interface AudienceSales {
  audience: ProductAudience;
  quantity: number;
  revenue: number;
}

export interface LanguageDistributionEntry {
  language: string;
  count: number;
}

export interface ChatbotConversion {
  totalRecommendations: number;
  converted: number;
  rate: number;
}

export interface Outfit {
  _id: string;
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  coverImage: string;
  productIds: string[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export interface OutfitWithProducts extends Outfit {
  products: Product[];
  totalPrice: number;
}

export interface BulkAddResult {
  cart: Cart;
  skippedProductIds: string[];
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  revenueByMonth: MonthlyRevenue[];
  topProducts: TopProduct[];
  topCategories: CategorySales[];
  salesByAudience: AudienceSales[];
  languageDistribution: LanguageDistributionEntry[];
  chatbotConversion: ChatbotConversion;
}

export type Gender = 'male' | 'female' | 'other';
export type FitPreference = 'slim' | 'regular' | 'oversized';

export interface User {
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
  gender: Gender | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  legLengthCm: number | null;
  usualSize: string | null;
  fitPreference: FitPreference | null;
}

export type SizeConfidence = 'high' | 'medium' | 'low' | 'none';

export interface SizeRecommendation {
  recommendedSize: string | null;
  confidence: SizeConfidence;
  message: string;
}

export type AvatarAssetType = 'body' | 'hair';

export interface AvatarAsset {
  _id: string;
  type: AvatarAssetType;
  name: string;
  modelUrl: string;
  thumbnailUrl: string | null;
  isActive: boolean;
}

export interface AdminAvatarUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  avatarDisabled: boolean;
}

export interface CartItem {
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

export interface Cart {
  items: CartItem[];
  savedForLater: CartItem[];
  total: number;
}

export interface Wishlist {
  _id: string;
  userId: string;
  name: string;
  productIds: string[];
  isDefault: boolean;
  createdAt: string;
}

export type DiscountType = 'percent' | 'fixed';

export interface Coupon {
  _id: string;
  code: string;
  discountType: DiscountType;
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  minOrderAmount: number;
  createdAt: string;
}

export type ReviewFit = 'small' | 'true_to_size' | 'large';

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderStatusHistoryEntry {
  _id: string;
  orderId: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string | null;
  createdAt: string;
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
  // Optional because pre-Phase-1 orders only have the legacy `city` field.
  governorate?: Governorate;
  delegation?: string;
  country: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  shippingFee: number;
  couponCode: string | null;
  discountAmount: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'card';
  paymentStatus: PaymentStatus;
  shippingAddress: ShippingAddress;
  createdAt: string;
}

export interface OrderQuote {
  itemsSubtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
}

export interface CreateOrderResult {
  order: Order;
  paymentRedirectUrl?: string;
}

export interface ChatToolProduct {
  id: string;
  slug: string;
  name: LocalizedText;
  price: number;
  audience: string;
  type: string;
  image: string | null;
}

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatComposedOutfit {
  items: ChatToolProduct[];
  totalPrice: number;
  allInStock: boolean;
}

export interface ChatMessage {
  role: ChatMessageRole;
  content: string;
  createdAt: string;
}

export interface Conversation {
  _id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatReply {
  message: string;
  products: ChatToolProduct[];
  outfit?: ChatComposedOutfit;
}
