export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  RIDER = 'RIDER'
}

export enum OrderStatus {
  PLACED = 'PLACED',
  VERIFIED = 'VERIFIED',
  CONFIRMED = 'CONFIRMED',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  PACKED = 'PACKED',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number;
  discount: number;
  stock: number;
  unit: string;
  image: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber?: string; // Add this for display
  riderId?: string; // Assigned Rider ID
  items: CartItem[];
  total: number;
  status: OrderStatus;
  date: string;
  address: string;
  paymentMethod?: string;
  notes?: string;
  deliveryType?: 'INSTANT' | 'SCHEDULED';
  deliveryDate?: string;
  deliverySlot?: 'MORNING' | 'AFTERNOON' | 'EVENING';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: Role;
  addresses: string[];
  createdAt?: any; // Firestore Timestamp
  is_online?: boolean; // Rider status
  total_deliveries?: number; // Rider stats
  total_earnings?: number; // Rider stats
}

export interface Category {
  id: string;
  name: string;
  image: string;
}
