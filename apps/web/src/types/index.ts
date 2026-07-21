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

export interface Product {
  _id: string;
  slug: string;
  name: LocalizedText;
  description: LocalizedText;
  price: number;
  audience: ProductAudience;
  type: ProductType;
  sizes: string[];
  colors: string[];
  images: string[];
  stock: number;
  isActive: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  preferredLanguage: string;
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

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

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
