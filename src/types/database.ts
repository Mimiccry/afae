// ============================================
// 데이터베이스 타입 정의
// ============================================

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  category: string;
  badge: 'SALE' | 'NEW' | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  address_detail: string | null;
  postal_code: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | '주문완료' 
  | '결제완료' 
  | '배송준비' 
  | '배송중' 
  | '배송완료' 
  | '취소' 
  | '환불';

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: OrderStatus;
  shipping_address: string | null;
  shipping_address_detail: string | null;
  shipping_postal_code: string | null;
  shipping_phone: string | null;
  shipping_name: string | null;
  payment_method: string | null;
  payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
  created_at: string;
}

// 주문과 주문 상품을 함께 조회할 때 사용하는 타입
export interface OrderWithItems extends Order {
  order_items: (OrderItem & { product: Product })[];
  customer?: Customer;
}

// 상품 생성/수정 시 사용하는 타입
export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  image?: string;
  category: string;
  badge?: 'SALE' | 'NEW';
  stock?: number;
  is_active?: boolean;
}

// 고객 생성/수정 시 사용하는 타입
export interface CustomerInput {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  address_detail?: string;
  postal_code?: string;
}

// 주문 생성 시 사용하는 타입
export interface OrderInput {
  customer_id: string;
  total_amount: number;
  status?: OrderStatus;
  shipping_address?: string;
  shipping_address_detail?: string;
  shipping_postal_code?: string;
  shipping_phone?: string;
  shipping_name?: string;
  payment_method?: string;
  payment_id?: string;
  items: OrderItemInput[];
}

// 주문 상품 생성 시 사용하는 타입
export interface OrderItemInput {
  product_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

