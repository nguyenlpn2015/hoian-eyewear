export type Language = 'vi' | 'en';

export type LensType = 'polarized' | 'uv400';

export interface Category {
  id: string;
  slug: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
  image: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  colorName_vi: string;
  colorName_en: string;
  colorHex: string;
  sizeLabel: string; // e.g. "Tiêu chuẩn (50-20-145)"
  lensType_vi: string;
  lensType_en: string;
  isPolarized: boolean;
  price: number; // in VND
  compareAtPrice?: number;
  imageUrl: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  slug: string;
  categoryId: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
  frameMaterial_vi: string;
  frameMaterial_en: string;
  dimensions: {
    lensWidth: number;
    bridgeWidth: number;
    templeLength: number;
  };
  featured: boolean;
  tag_vi?: string;
  tag_en?: string;
  images: string[];
  variants: ProductVariant[];
}

export interface InventoryBalance {
  variantId: string;
  locationId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number; // onHand - reserved
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  locationId: string;
  movementType: 'SALE_IN_STORE' | 'ORDER_RESERVE' | 'ORDER_FULFILL' | 'ORDER_CANCEL_RESTORE' | 'MANUAL_ADJUSTMENT' | 'RETURN_RESTOCK';
  quantityDelta: number;
  balanceOnHandAfter: number;
  balanceReservedAfter: number;
  referenceId: string;
  actor: string;
  reason: string;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type FulfillmentType = 'delivery' | 'pickup';
export type PaymentMethod = 'cod' | 'bank_transfer' | 'cash';
export type Channel = 'online' | 'in_store';
export type StaffRole = 'CASHIER' | 'STORE_MANAGER';

export interface StaffProfile {
  id: string;
  fullName: string;
  role: StaffRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  variantDescription: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderRef: string; // e.g. HAE-8K2M-9X4W
  channel: Channel;
  fulfillmentType: FulfillmentType;
  orderStatus: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress?: {
    province: string;
    district: string;
    ward: string;
    street: string;
    fullAddress: string;
  };
  shippingCarrier?: string;
  trackingCode?: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  customerNotes?: string;
  items: OrderItem[];
  bankTransferExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName_vi: string;
  productName_en: string;
  sku: string;
  colorName_vi: string;
  colorName_en: string;
  colorHex: string;
  sizeLabel: string;
  lensType_vi: string;
  lensType_en: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

