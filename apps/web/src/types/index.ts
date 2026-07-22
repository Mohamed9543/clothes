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
  size: string;
  stock: number;
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
  colors: string[];
  images: string[];
  isActive: boolean;
}

export interface AdminProduct extends Product {
  totalStock: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
}

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

export type Gender = 'male' | 'female' | 'other';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  preferredLanguage: string;
  avatarUrl: string | null;
  heightCm: number | null;
  weightKg: number | null;
  gender: Gender | null;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: LocalizedText;
  image: string | null;
  unitPrice: number;
  quantity: number;
  size: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

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
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: 'cod';
  shippingAddress: ShippingAddress;
  createdAt: string;
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
}
