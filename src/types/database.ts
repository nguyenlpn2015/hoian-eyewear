// ==============================================================================
// HỘI AN EYEWEAR — SUPABASE DATABASE TYPE DEFINITIONS
// Database: PostgreSQL 16 (Strict integer VND, Bilingual VI/EN)
// Compatible with @supabase/supabase-js v2.118+ GenericSchema
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StaffRole = 'CASHIER' | 'STORE_MANAGER';
export type OrderChannel = 'online' | 'in_store';
export type FulfillmentType = 'delivery' | 'pickup';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'shipped'
  | 'ready_for_pickup'
  | 'completed'
  | 'cancelled'
  | 'returned';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'cash';
export type PaymentStatus =
  | 'pending'
  | 'verified'
  | 'paid'
  | 'failed'
  | 'refunded'
  | 'partially_refunded';

export type MovementType =
  | 'SALE_IN_STORE'
  | 'ORDER_RESERVE'
  | 'ORDER_FULFILL'
  | 'ORDER_CANCEL_RESTORE'
  | 'MANUAL_ADJUSTMENT'
  | 'RETURN_RESTOCK';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: StaffRole;
          phone: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: StaffRole;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: StaffRole;
          phone?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi: string | null;
          description_en: string | null;
          image_url: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi?: string | null;
          description_en?: string | null;
          image_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name_vi?: string;
          name_en?: string;
          description_vi?: string | null;
          description_en?: string | null;
          image_url?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi: string;
          description_en: string;
          frame_material_vi: string;
          frame_material_en: string;
          lens_width_mm: number;
          bridge_width_mm: number;
          temple_length_mm: number;
          is_featured: boolean;
          is_active: boolean;
          tag_vi: string | null;
          tag_en: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          slug: string;
          name_vi: string;
          name_en: string;
          description_vi: string;
          description_en: string;
          frame_material_vi: string;
          frame_material_en: string;
          lens_width_mm: number;
          bridge_width_mm: number;
          temple_length_mm: number;
          is_featured?: boolean;
          is_active?: boolean;
          tag_vi?: string | null;
          tag_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          slug?: string;
          name_vi?: string;
          name_en?: string;
          description_vi?: string;
          description_en?: string;
          frame_material_vi?: string;
          frame_material_en?: string;
          lens_width_mm?: number;
          bridge_width_mm?: number;
          temple_length_mm?: number;
          is_featured?: boolean;
          is_active?: boolean;
          tag_vi?: string | null;
          tag_en?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          color_name_vi: string;
          color_name_en: string;
          color_hex: string;
          size_label: string;
          lens_type: 'polarized' | 'uv400';
          lens_type_vi: string;
          lens_type_en: string;
          is_polarized: boolean;
          price_vnd: number;
          compare_at_price_vnd: number | null;
          image_url: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku: string;
          color_name_vi: string;
          color_name_en: string;
          color_hex: string;
          size_label: string;
          lens_type: 'polarized' | 'uv400';
          lens_type_vi: string;
          lens_type_en: string;
          is_polarized?: boolean;
          price_vnd: number;
          compare_at_price_vnd?: number | null;
          image_url: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          sku?: string;
          color_name_vi?: string;
          color_name_en?: string;
          color_hex?: string;
          size_label?: string;
          lens_type?: 'polarized' | 'uv400';
          lens_type_vi?: string;
          lens_type_en?: string;
          is_polarized?: boolean;
          price_vnd?: number;
          compare_at_price_vnd?: number | null;
          image_url?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          image_url: string;
          display_order: number;
          alt_text_vi: string | null;
          alt_text_en: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          image_url: string;
          display_order?: number;
          alt_text_vi?: string | null;
          alt_text_en?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          image_url?: string;
          display_order?: number;
          alt_text_vi?: string | null;
          alt_text_en?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          }
        ];
      };
      stock_locations: {
        Row: {
          id: string;
          name: string;
          address: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          address: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_balances: {
        Row: {
          variant_id: string;
          location_id: string;
          quantity_on_hand: number;
          quantity_reserved: number;
          quantity_available: number;
          updated_at: string;
        };
        Insert: {
          variant_id: string;
          location_id: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          updated_at?: string;
        };
        Update: {
          variant_id?: string;
          location_id?: string;
          quantity_on_hand?: number;
          quantity_reserved?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_balances_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_balances_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "stock_locations";
            referencedColumns: ["id"];
          }
        ];
      };
      inventory_movements: {
        Row: {
          id: string;
          variant_id: string;
          location_id: string;
          movement_type: MovementType;
          quantity_delta: number;
          balance_on_hand_after: number;
          balance_reserved_after: number;
          reference_id: string;
          actor_id: string | null;
          actor_role: string;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          variant_id: string;
          location_id: string;
          movement_type: MovementType;
          quantity_delta: number;
          balance_on_hand_after: number;
          balance_reserved_after: number;
          reference_id: string;
          actor_id?: string | null;
          actor_role: string;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          variant_id?: string;
          location_id?: string;
          movement_type?: MovementType;
          quantity_delta?: number;
          balance_on_hand_after?: number;
          balance_reserved_after?: number;
          reference_id?: string;
          actor_id?: string | null;
          actor_role?: string;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_ref: string;
          channel: OrderChannel;
          fulfillment_type: FulfillmentType;
          order_status: OrderStatus;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          customer_name: string;
          customer_phone: string;
          customer_phone_last4: string;
          customer_email: string | null;
          shipping_province: string | null;
          shipping_district: string | null;
          shipping_ward: string | null;
          shipping_street: string | null;
          shipping_full_address: string | null;
          shipping_carrier: string | null;
          tracking_code: string | null;
          subtotal_vnd: number;
          shipping_fee_vnd: number;
          total_amount_vnd: number;
          customer_notes: string | null;
          idempotency_key: string | null;
          bank_transfer_expires_at: string | null;
          created_by_staff_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_ref: string;
          channel: OrderChannel;
          fulfillment_type: FulfillmentType;
          order_status?: OrderStatus;
          payment_method: PaymentMethod;
          payment_status?: PaymentStatus;
          customer_name: string;
          customer_phone: string;
          customer_phone_last4: string;
          customer_email?: string | null;
          shipping_province?: string | null;
          shipping_district?: string | null;
          shipping_ward?: string | null;
          shipping_street?: string | null;
          shipping_full_address?: string | null;
          shipping_carrier?: string | null;
          tracking_code?: string | null;
          subtotal_vnd: number;
          shipping_fee_vnd?: number;
          total_amount_vnd: number;
          customer_notes?: string | null;
          idempotency_key?: string | null;
          bank_transfer_expires_at?: string | null;
          created_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_ref?: string;
          channel?: OrderChannel;
          fulfillment_type?: FulfillmentType;
          order_status?: OrderStatus;
          payment_method?: PaymentMethod;
          payment_status?: PaymentStatus;
          customer_name?: string;
          customer_phone?: string;
          customer_phone_last4?: string;
          customer_email?: string | null;
          shipping_province?: string | null;
          shipping_district?: string | null;
          shipping_ward?: string | null;
          shipping_street?: string | null;
          shipping_full_address?: string | null;
          shipping_carrier?: string | null;
          tracking_code?: string | null;
          subtotal_vnd?: number;
          shipping_fee_vnd?: number;
          total_amount_vnd?: number;
          customer_notes?: string | null;
          idempotency_key?: string | null;
          bank_transfer_expires_at?: string | null;
          created_by_staff_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          sku: string;
          product_name: string;
          variant_description: string;
          unit_price_vnd: number;
          quantity: number;
          total_price_vnd: number;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          sku: string;
          product_name: string;
          variant_description: string;
          unit_price_vnd: number;
          quantity: number;
          total_price_vnd: number;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string;
          sku?: string;
          product_name?: string;
          variant_description?: string;
          unit_price_vnd?: number;
          quantity?: number;
          total_price_vnd?: number;
          image_url?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          }
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          actor_id: string | null;
          actor_role: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          actor_id?: string | null;
          actor_role: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: string | null;
          to_status?: string;
          actor_id?: string | null;
          actor_role?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
      payment_status_history: {
        Row: {
          id: string;
          order_id: string;
          from_status: string | null;
          to_status: string;
          actor_id: string | null;
          actor_role: string;
          amount_vnd: number;
          transaction_reference: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: string | null;
          to_status: string;
          actor_id?: string | null;
          actor_role: string;
          amount_vnd: number;
          transaction_reference?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: string | null;
          to_status?: string;
          actor_id?: string | null;
          actor_role?: string;
          amount_vnd?: number;
          transaction_reference?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payment_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_in_store_sale: {
        Args: {
          p_variant_id: string;
          p_quantity: number;
          p_payment_method: string;
          p_actor_id: string;
          p_customer_name?: string;
          p_customer_phone?: string;
        };
        Returns: Json;
      };
      create_online_order: {
        Args: {
          p_customer_name: string;
          p_customer_phone: string;
          p_customer_email: string | null;
          p_fulfillment_type: string;
          p_payment_method: string;
          p_shipping_province: string | null;
          p_shipping_district: string | null;
          p_shipping_ward: string | null;
          p_shipping_street: string | null;
          p_shipping_full_address: string | null;
          p_shipping_fee: number;
          p_customer_notes: string | null;
          p_items: Json;
          p_idempotency_key?: string | null;
        };
        Returns: Json;
      };
      cancel_order_and_release_stock: {
        Args: {
          p_order_id: string;
          p_actor_id: string;
          p_actor_role: string;
          p_reason?: string;
        };
        Returns: Json;
      };
      verify_guest_order_tracking: {
        Args: {
          p_order_ref: string;
          p_phone_last4: string;
        };
        Returns: Json;
      };
      verify_bank_transfer_payment: {
        Args: {
          p_order_id: string;
          p_transaction_ref: string;
          p_note?: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
