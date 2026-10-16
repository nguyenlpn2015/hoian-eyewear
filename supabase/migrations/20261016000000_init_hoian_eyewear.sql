-- ==============================================================================
-- HỘI AN EYEWEAR — SUPABASE POSTGRESQL DATABASE MIGRATION
-- Migration Version: 20261016000000_init_hoian_eyewear.sql
-- Database Engine: PostgreSQL 16
-- Currency Standard: VND (Integer amounts, no floating points)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. SCHEMA TABLES
-- ==============================================================================

-- 2.1. BẢNG PROFILES (Hồ sơ nhân viên & Phân quyền RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('CASHIER', 'STORE_MANAGER')),
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.2. BẢNG CATEGORIES (Danh mục kính mát di sản)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT,
    description_en TEXT,
    image_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.3. BẢNG PRODUCTS (Sản phẩm kính mát)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    slug TEXT NOT NULL UNIQUE,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    frame_material_vi TEXT NOT NULL,
    frame_material_en TEXT NOT NULL,
    lens_width_mm INTEGER NOT NULL CHECK (lens_width_mm > 0),
    bridge_width_mm INTEGER NOT NULL CHECK (bridge_width_mm > 0),
    temple_length_mm INTEGER NOT NULL CHECK (temple_length_mm > 0),
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    tag_vi TEXT,
    tag_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.4. BẢNG PRODUCT_VARIANTS (Biến thể SKU cụ thể)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL UNIQUE,
    color_name_vi TEXT NOT NULL,
    color_name_en TEXT NOT NULL,
    color_hex TEXT NOT NULL CHECK (color_hex ~ '^#([A-Fa-f0-9]{6})$'),
    size_label TEXT NOT NULL,
    lens_type TEXT NOT NULL CHECK (lens_type IN ('polarized', 'uv400')),
    lens_type_vi TEXT NOT NULL,
    lens_type_en TEXT NOT NULL,
    is_polarized BOOLEAN NOT NULL DEFAULT false,
    price_vnd INTEGER NOT NULL CHECK (price_vnd >= 0),
    compare_at_price_vnd INTEGER CHECK (compare_at_price_vnd >= price_vnd OR compare_at_price_vnd IS NULL),
    image_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.5. BẢNG PRODUCT_IMAGES (Thư viện hình ảnh sản phẩm)
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
    image_url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    alt_text_vi TEXT,
    alt_text_en TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.6. BẢNG STOCK_LOCATIONS (Địa điểm kho hàng)
CREATE TABLE IF NOT EXISTS public.stock_locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.7. BẢNG INVENTORY_BALANCES (Số dư tồn kho thời gian thực)
CREATE TABLE IF NOT EXISTS public.inventory_balances (
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    location_id TEXT NOT NULL REFERENCES public.stock_locations(id) ON DELETE RESTRICT,
    quantity_on_hand INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (variant_id, location_id),
    CONSTRAINT check_no_oversell CHECK (quantity_on_hand >= quantity_reserved)
);

-- 2.8. BẢNG INVENTORY_MOVEMENTS (Sổ nhật ký biến động kho bất biến)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    location_id TEXT NOT NULL REFERENCES public.stock_locations(id) ON DELETE RESTRICT,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('SALE_IN_STORE', 'ORDER_RESERVE', 'ORDER_FULFILL', 'ORDER_CANCEL_RESTORE', 'MANUAL_ADJUSTMENT', 'RETURN_RESTOCK')),
    quantity_delta INTEGER NOT NULL,
    balance_on_hand_after INTEGER NOT NULL CHECK (balance_on_hand_after >= 0),
    balance_reserved_after INTEGER NOT NULL CHECK (balance_reserved_after >= 0),
    reference_id TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.9. BẢNG ORDERS (Đơn hàng đa kênh)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_ref TEXT NOT NULL UNIQUE CHECK (order_ref ~ '^HAE-[A-Z0-9]{4}-[A-Z0-9]{4}$'),
    channel TEXT NOT NULL CHECK (channel IN ('online', 'in_store')),
    fulfillment_type TEXT NOT NULL CHECK (fulfillment_type IN ('delivery', 'pickup')),
    order_status TEXT NOT NULL CHECK (order_status IN ('pending', 'confirmed', 'preparing', 'shipped', 'ready_for_pickup', 'completed', 'cancelled', 'returned')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'bank_transfer', 'cash')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('pending', 'verified', 'paid', 'failed', 'refunded', 'partially_refunded')),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL CHECK (customer_phone ~ '^(0|84)(3|5|7|8|9)[0-9]{8}$'),
    customer_phone_last4 TEXT NOT NULL CHECK (length(customer_phone_last4) = 4),
    customer_email TEXT,
    shipping_province TEXT,
    shipping_district TEXT,
    shipping_ward TEXT,
    shipping_street TEXT,
    shipping_full_address TEXT,
    shipping_carrier TEXT,
    tracking_code TEXT,
    subtotal_vnd INTEGER NOT NULL CHECK (subtotal_vnd >= 0),
    shipping_fee_vnd INTEGER NOT NULL DEFAULT 0 CHECK (shipping_fee_vnd >= 0),
    total_amount_vnd INTEGER NOT NULL CHECK (total_amount_vnd = subtotal_vnd + shipping_fee_vnd),
    customer_notes TEXT,
    idempotency_key TEXT UNIQUE,
    bank_transfer_expires_at TIMESTAMPTZ,
    created_by_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.10. BẢNG ORDER_ITEMS (Chi tiết sản phẩm với snapshot giá & thông số)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    variant_description TEXT NOT NULL,
    unit_price_vnd INTEGER NOT NULL CHECK (unit_price_vnd >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_price_vnd INTEGER NOT NULL CHECK (total_price_vnd = unit_price_vnd * quantity),
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.11. BẢNG ORDER_STATUS_HISTORY (Lịch sử chuyển trạng thái đơn hàng)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2.12. BẢNG PAYMENT_STATUS_HISTORY (Lịch sử kiểm toán thanh toán)
CREATE TABLE IF NOT EXISTS public.payment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL,
    amount_vnd INTEGER NOT NULL,
    transaction_reference TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. CHỈ MỤC HIỆU NĂNG (PERFORMANCE INDEXES)
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories (slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug);
CREATE INDEX IF NOT EXISTS idx_products_active_featured ON public.products (is_active, is_featured);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON public.product_variants (product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants (sku);
CREATE INDEX IF NOT EXISTS idx_inventory_balances_location ON public.inventory_balances (location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements (variant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_ref ON public.orders (order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (order_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_guest_lookup ON public.orders (order_ref, customer_phone_last4);
CREATE INDEX IF NOT EXISTS idx_orders_idempotency ON public.orders (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant ON public.order_items (variant_id);

-- ==============================================================================
-- 4. BẢO MẬT CẤP DÒNG (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

-- Kích hoạt RLS trên tất cả các bảng
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_status_history ENABLE ROW LEVEL SECURITY;

-- 4.1. Helper Functions
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('CASHIER', 'STORE_MANAGER')
      AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_store_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'STORE_MANAGER'
      AND is_active = true
  );
$$;

-- 4.2. RLS: PROFILES
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR public.is_store_manager());

CREATE POLICY "Store Managers can update profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_store_manager());

CREATE POLICY "Store Managers can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_store_manager());

-- 4.3. RLS: CATALOG (Categories, Products, Variants, Images)
CREATE POLICY "Public can read active categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Managers manage categories"
    ON public.categories FOR ALL
    USING (public.is_store_manager());

CREATE POLICY "Public can read active products"
    ON public.products FOR SELECT
    USING (is_active = true OR public.is_staff());

CREATE POLICY "Managers manage products"
    ON public.products FOR ALL
    USING (public.is_store_manager());

CREATE POLICY "Public can read active variants"
    ON public.product_variants FOR SELECT
    USING (is_active = true OR public.is_staff());

CREATE POLICY "Managers manage variants"
    ON public.product_variants FOR ALL
    USING (public.is_store_manager());

CREATE POLICY "Public can read product images"
    ON public.product_images FOR SELECT
    USING (true);

CREATE POLICY "Managers manage images"
    ON public.product_images FOR ALL
    USING (public.is_store_manager());

-- 4.4. RLS: INVENTORY (Balances & Movements)
CREATE POLICY "Public can view available stock"
    ON public.inventory_balances FOR SELECT
    USING (true);

CREATE POLICY "Staff can view all inventory balances"
    ON public.inventory_balances FOR SELECT
    USING (public.is_staff());

CREATE POLICY "Managers can update inventory directly"
    ON public.inventory_balances FOR UPDATE
    USING (public.is_store_manager());

CREATE POLICY "Staff can read inventory movements"
    ON public.inventory_movements FOR SELECT
    USING (public.is_staff());

-- 4.5. RLS: ORDERS & ITEMS
CREATE POLICY "Staff can view orders"
    ON public.orders FOR SELECT
    USING (public.is_staff());

CREATE POLICY "Managers can update orders"
    ON public.orders FOR UPDATE
    USING (public.is_store_manager());

CREATE POLICY "Staff can view order items"
    ON public.order_items FOR SELECT
    USING (public.is_staff());

CREATE POLICY "Staff can view status histories"
    ON public.order_status_history FOR SELECT
    USING (public.is_staff());

CREATE POLICY "Staff can view payment histories"
    ON public.payment_status_history FOR SELECT
    USING (public.is_staff());

-- ==============================================================================
-- 5. CÁC HÀM THỦ TỤC NGUYÊN TỬ (ATOMIC CONCURRENCY PROCEDURES)
-- ==============================================================================

-- 5.1. BÁN HÀNG TẠI QUẦY (POS)
CREATE OR REPLACE FUNCTION public.record_in_store_sale(
    p_variant_id UUID,
    p_quantity INTEGER,
    p_payment_method TEXT,
    p_actor_id UUID,
    p_customer_name TEXT DEFAULT 'Khách Mua Tại Quầy',
    p_customer_phone TEXT DEFAULT '0900000000'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance RECORD;
    v_variant RECORD;
    v_order_ref TEXT;
    v_order_id UUID;
    v_total_amount INTEGER;
    v_actual_actor_id UUID;
    v_actor_role TEXT := 'CASHIER';
BEGIN
    -- 0. Kiểm tra quyền hạn: Chỉ nhân viên (CASHIER hoặc STORE_MANAGER) hoặc service_role được gọi
    IF NOT public.is_staff() AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_NOT_STAFF');
    END IF;

    v_actual_actor_id := COALESCE(auth.uid(), p_actor_id);

    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'QUANTITY_MUST_BE_GREATER_THAN_ZERO');
    END IF;

    -- 1. Khóa dòng kiểm tra tồn kho (Pessimistic Locking)
    SELECT * INTO v_balance
    FROM public.inventory_balances
    WHERE variant_id = p_variant_id AND location_id = 'HOI_AN_MAIN'
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'VARIANT_NOT_FOUND_IN_LOCATION');
    END IF;

    IF v_balance.quantity_available < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'INSUFFICIENT_STOCK',
            'available', v_balance.quantity_available,
            'requested', p_quantity
        );
    END IF;

    -- 2. Lấy thông tin biến thể & giá bán
    SELECT * INTO v_variant FROM public.product_variants WHERE id = p_variant_id;
    v_total_amount := v_variant.price_vnd * p_quantity;

    -- 3. Trừ kho thực tế tức thời
    UPDATE public.inventory_balances
    SET quantity_on_hand = quantity_on_hand - p_quantity,
        updated_at = now()
    WHERE variant_id = p_variant_id AND location_id = 'HOI_AN_MAIN';

    -- 4. Tạo mã đơn hàng duy nhất HAE-XXXX-XXXX
    v_order_ref := 'HAE-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 5 for 4));

    -- 5. Ghi nhật ký biến động kiểm toán
    INSERT INTO public.inventory_movements (
        variant_id, location_id, movement_type, quantity_delta,
        balance_on_hand_after, balance_reserved_after, reference_id,
        actor_id, actor_role, reason
    ) VALUES (
        p_variant_id, 'HOI_AN_MAIN', 'SALE_IN_STORE', -p_quantity,
        v_balance.quantity_on_hand - p_quantity, v_balance.quantity_reserved, v_order_ref,
        v_actual_actor_id, v_actor_role, 'Bán hàng trực tiếp tại quầy Boutique Hội An'
    );

    -- 6. Tạo đơn hàng hoàn tất
    INSERT INTO public.orders (
        order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
        customer_name, customer_phone, customer_phone_last4,
        subtotal_vnd, shipping_fee_vnd, total_amount_vnd, created_by_staff_id
    ) VALUES (
        v_order_ref, 'in_store', 'pickup', 'completed', p_payment_method, 'paid',
        p_customer_name, p_customer_phone, right(p_customer_phone, 4),
        v_total_amount, 0, v_total_amount, v_actual_actor_id
    ) RETURNING id INTO v_order_id;

    -- 7. Lưu snapshot sản phẩm
    INSERT INTO public.order_items (
        order_id, variant_id, sku, product_name, variant_description,
        unit_price_vnd, quantity, total_price_vnd, image_url
    ) VALUES (
        v_order_id, p_variant_id, v_variant.sku, v_variant.color_name_vi,
        v_variant.lens_type_vi || ' • ' || v_variant.size_label,
        v_variant.price_vnd, p_quantity, v_total_amount, v_variant.image_url
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_ref', v_order_ref,
        'order_id', v_order_id,
        'total_amount', v_total_amount
    );
END;
$$;

-- 5.2. ĐẶT HÀNG TRỰC TUYẾN & GIỮ CHỖ KHO (ONLINE ORDER & RESERVATION)
CREATE OR REPLACE FUNCTION public.create_online_order(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_customer_email TEXT,
    p_fulfillment_type TEXT,
    p_payment_method TEXT,
    p_shipping_province TEXT,
    p_shipping_district TEXT,
    p_shipping_ward TEXT,
    p_shipping_street TEXT,
    p_shipping_full_address TEXT,
    p_shipping_fee INTEGER,
    p_customer_notes TEXT,
    p_items JSONB, -- Mảng object: [{ "variant_id": "...", "quantity": 1 }]
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_item RECORD;
    v_balance RECORD;
    v_variant RECORD;
    v_order_ref TEXT;
    v_order_id UUID;
    v_subtotal INTEGER := 0;
    v_total_amount INTEGER := 0;
    v_expires_at TIMESTAMPTZ := NULL;
BEGIN
    -- 0. Kiểm tra Idempotency: Nếu idempotency_key đã tồn tại, trả về đơn hàng cũ để tránh trừ kho trùng lặp
    IF p_idempotency_key IS NOT NULL THEN
        SELECT id, order_ref, total_amount_vnd INTO v_order_id, v_order_ref, v_total_amount
        FROM public.orders
        WHERE idempotency_key = p_idempotency_key;

        IF FOUND THEN
            RETURN jsonb_build_object(
                'success', true,
                'order_ref', v_order_ref,
                'order_id', v_order_id,
                'total_amount', v_total_amount,
                'idempotent_replayed', true
            );
        END IF;
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'CART_IS_EMPTY');
    END IF;

    -- 1. Khóa các dòng tồn kho theo thứ tự variant_id tăng dần để TRÁNH DEADLOCK
    FOR v_item IN
        SELECT (x->>'variant_id')::UUID AS variant_id, (x->>'quantity')::INTEGER AS quantity
        FROM jsonb_array_elements(p_items) x
        ORDER BY 1 ASC
    LOOP
        SELECT * INTO v_balance
        FROM public.inventory_balances
        WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN'
        FOR UPDATE;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('success', false, 'error', 'VARIANT_NOT_FOUND', 'variant_id', v_item.variant_id);
        END IF;

        IF v_balance.quantity_available < v_item.quantity THEN
            RETURN jsonb_build_object(
                'success', false,
                'error', 'INSUFFICIENT_STOCK',
                'variant_id', v_item.variant_id,
                'available', v_balance.quantity_available,
                'requested', v_item.quantity
            );
        END IF;

        -- Lấy giá chính thức từ database (chống sửa giá từ client)
        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_item.variant_id;
        v_subtotal := v_subtotal + (v_variant.price_vnd * v_item.quantity);
    END LOOP;

    v_total_amount := v_subtotal + p_shipping_fee;

    -- 2. Hạn thanh toán 24h đối với VietQR
    IF p_payment_method = 'bank_transfer' THEN
        v_expires_at := now() + interval '24 hours';
    END IF;

    -- 3. Tạo mã đơn hàng duy nhất
    v_order_ref := 'HAE-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 5 for 4));

    -- 4. Tạo bản ghi đơn hàng
    INSERT INTO public.orders (
        order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
        customer_name, customer_phone, customer_phone_last4, customer_email,
        shipping_province, shipping_district, shipping_ward, shipping_street, shipping_full_address,
        subtotal_vnd, shipping_fee_vnd, total_amount_vnd, customer_notes, idempotency_key, bank_transfer_expires_at
    ) VALUES (
        v_order_ref, 'online', p_fulfillment_type, 'pending', p_payment_method, 'pending',
        trim(p_customer_name), regexp_replace(p_customer_phone, '\D', '', 'g'),
        right(regexp_replace(p_customer_phone, '\D', '', 'g'), 4), p_customer_email,
        p_shipping_province, p_shipping_district, p_shipping_ward, p_shipping_street, p_shipping_full_address,
        v_subtotal, p_shipping_fee, v_total_amount, p_customer_notes, p_idempotency_key, v_expires_at
    ) RETURNING id INTO v_order_id;

    -- 5. Cập nhật giữ chỗ kho & tạo chi tiết đơn hàng
    FOR v_item IN
        SELECT (x->>'variant_id')::UUID AS variant_id, (x->>'quantity')::INTEGER AS quantity
        FROM jsonb_array_elements(p_items) x
    LOOP
        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_item.variant_id;
        SELECT * INTO v_balance FROM public.inventory_balances WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN';

        -- Tăng quantity_reserved
        UPDATE public.inventory_balances
        SET quantity_reserved = quantity_reserved + v_item.quantity,
            updated_at = now()
        WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN';

        -- Ghi nhật ký biến động
        INSERT INTO public.inventory_movements (
            variant_id, location_id, movement_type, quantity_delta,
            balance_on_hand_after, balance_reserved_after, reference_id,
            actor_id, actor_role, reason
        ) VALUES (
            v_item.variant_id, 'HOI_AN_MAIN', 'ORDER_RESERVE', v_item.quantity,
            v_balance.quantity_on_hand, v_balance.quantity_reserved + v_item.quantity, v_order_ref,
            NULL, 'SYSTEM', 'Khách đặt hàng online - Giữ chỗ kho 24h'
        );

        -- Tạo snapshot dòng order_items
        INSERT INTO public.order_items (
            order_id, variant_id, sku, product_name, variant_description,
            unit_price_vnd, quantity, total_price_vnd, image_url
        ) VALUES (
            v_order_id, v_item.variant_id, v_variant.sku, v_variant.color_name_vi,
            v_variant.lens_type_vi || ' • ' || v_variant.size_label,
            v_variant.price_vnd, v_item.quantity, (v_variant.price_vnd * v_item.quantity), v_variant.image_url
        );
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'order_ref', v_order_ref,
        'order_id', v_order_id,
        'total_amount', v_total_amount
    );
END;
$$;

-- 5.3. HỦY ĐƠN HÀNG & HOÀN KHO AN TOÀN (IDEMPOTENT CANCEL & RESTORE)
CREATE OR REPLACE FUNCTION public.cancel_order_and_release_stock(
    p_order_id UUID,
    p_actor_id UUID,
    p_actor_role TEXT,
    p_reason TEXT DEFAULT 'Khách yêu cầu hủy đơn hoặc quá hạn chuyển khoản 24h'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_balance RECORD;
BEGIN
    -- 0. Kiểm tra quyền: Chỉ Quản lý cửa hàng (STORE_MANAGER) hoặc tiến trình tự động SYSTEM / service_role được hủy đơn
    IF NOT public.is_store_manager() AND p_actor_role != 'SYSTEM' AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_STORE_MANAGER_ONLY');
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', true, 'message', 'ALREADY_CANCELLED');
    END IF;

    IF v_order.order_status = 'completed' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_CANCEL_COMPLETED_ORDER');
    END IF;

    -- Hoàn lại kho nếu đơn đang ở trạng thái pending hoặc confirmed
    IF v_order.order_status IN ('pending', 'confirmed', 'preparing') THEN
        FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
            SELECT * INTO v_balance FROM public.inventory_balances WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN' FOR UPDATE;

            UPDATE public.inventory_balances
            SET quantity_reserved = GREATEST(0, quantity_reserved - v_item.quantity),
                updated_at = now()
            WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN';

            INSERT INTO public.inventory_movements (
                variant_id, location_id, movement_type, quantity_delta,
                balance_on_hand_after, balance_reserved_after, reference_id,
                actor_id, actor_role, reason
            ) VALUES (
                v_item.variant_id, 'HOI_AN_MAIN', 'ORDER_CANCEL_RESTORE', -v_item.quantity,
                v_balance.quantity_on_hand, GREATEST(0, v_balance.quantity_reserved - v_item.quantity), v_order.order_ref,
                p_actor_id, p_actor_role, p_reason
            );
        END LOOP;
    END IF;

    UPDATE public.orders
    SET order_status = 'cancelled',
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.order_status_history (
        order_id, from_status, to_status, actor_id, actor_role, note
    ) VALUES (
        p_order_id, v_order.order_status, 'cancelled', p_actor_id, p_actor_role, p_reason
    );

    RETURN jsonb_build_object('success', true, 'order_ref', v_order.order_ref);
END;
$$;

-- 5.4. XÁC THỰC TRA CỨU ĐƠN KHÁCH VÃNG LAI (GUEST TRACKING VERIFICATION)
CREATE OR REPLACE FUNCTION public.verify_guest_order_tracking(
    p_order_ref TEXT,
    p_phone_last4 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_items JSONB;
BEGIN
    SELECT * INTO v_order
    FROM public.orders
    WHERE order_ref = upper(trim(p_order_ref))
      AND customer_phone_last4 = trim(p_phone_last4);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND_OR_PHONE_MISMATCH');
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'sku', oi.sku,
            'product_name', oi.product_name,
            'variant_description', oi.variant_description,
            'unit_price', oi.unit_price_vnd,
            'quantity', oi.quantity,
            'total_price', oi.total_price_vnd,
            'image_url', oi.image_url
        )
    ) INTO v_items
    FROM public.order_items oi
    WHERE oi.order_id = v_order.id;

    RETURN jsonb_build_object(
        'success', true,
        'order', jsonb_build_object(
            'order_ref', v_order.order_ref,
            'order_status', v_order.order_status,
            'payment_status', v_order.payment_status,
            'fulfillment_type', v_order.fulfillment_type,
            'masked_name', left(v_order.customer_name, 2) || '***** ' || right(v_order.customer_name, 2),
            'masked_phone', left(v_order.customer_phone, 2) || '****' || v_order.customer_phone_last4,
            'masked_address', '***, ' || coalesce(v_order.shipping_ward, '') || ', ' || coalesce(v_order.shipping_district, '') || ', ' || coalesce(v_order.shipping_province, ''),
            'shipping_carrier', v_order.shipping_carrier,
            'tracking_code', v_order.tracking_code,
            'total_amount', v_order.total_amount_vnd,
            'created_at', v_order.created_at,
            'items', coalesce(v_items, '[]'::jsonb)
        )
    );
END;
$$;

-- 5.5. XÁC MINH THANH TOÁN CHUYỂN KHOẢN VIETQR (CHỈ STORE_MANAGER)
CREATE OR REPLACE FUNCTION public.verify_bank_transfer_payment(
    p_order_id UUID,
    p_transaction_ref TEXT,
    p_note TEXT DEFAULT 'Xác nhận khớp giao dịch chuyển khoản VietQR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_actor_id UUID := auth.uid();
BEGIN
    IF NOT public.is_store_manager() AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_STORE_MANAGER_ONLY');
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORDER_NOT_FOUND');
    END IF;

    IF v_order.order_status = 'cancelled' THEN
        RETURN jsonb_build_object('success', false, 'error', 'CANNOT_VERIFY_CANCELLED_ORDER');
    END IF;

    IF v_order.payment_status = 'verified' OR v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'ALREADY_VERIFIED', 'order_ref', v_order.order_ref);
    END IF;

    -- Cập nhật trạng thái thanh toán và chuyển đơn hàng sang confirmed
    UPDATE public.orders
    SET payment_status = 'verified',
        order_status = CASE WHEN order_status = 'pending' THEN 'confirmed' ELSE order_status END,
        updated_at = now()
    WHERE id = p_order_id;

    -- Ghi nhật ký kiểm toán thanh toán
    INSERT INTO public.payment_status_history (
        order_id, from_status, to_status, actor_id, actor_role, amount_vnd, transaction_reference, note
    ) VALUES (
        p_order_id, v_order.payment_status, 'verified', v_actor_id, 'STORE_MANAGER',
        v_order.total_amount_vnd, p_transaction_ref, p_note
    );

    -- Ghi nhật ký trạng thái đơn hàng nếu có chuyển đổi
    IF v_order.order_status = 'pending' THEN
        INSERT INTO public.order_status_history (
            order_id, from_status, to_status, actor_id, actor_role, note
        ) VALUES (
            p_order_id, 'pending', 'confirmed', v_actor_id, 'STORE_MANAGER', 'Đã nhận đủ thanh toán chuyển khoản'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_ref', v_order.order_ref,
        'payment_status', 'verified',
        'order_status', 'confirmed'
    );
END;
$$;

-- ==============================================================================
-- 6. PHÂN QUYỀN THỰC THI THỦ TỤC NGUYÊN TỬ (RPC FUNCTION SECURITY PRIVILEGES)
-- ==============================================================================
-- Cấm thực thi trực tiếp từ người dùng nặc danh (anon) đối với các thủ tục nhạy cảm
REVOKE EXECUTE ON FUNCTION public.record_in_store_sale FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_in_store_sale TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cancel_order_and_release_stock FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_release_stock TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_bank_transfer_payment FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_bank_transfer_payment TO authenticated, service_role;

-- Các thủ tục phục vụ khách mua hàng trực tuyến & tra cứu đơn hàng công khai
GRANT EXECUTE ON FUNCTION public.create_online_order TO PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.verify_guest_order_tracking TO PUBLIC, anon, authenticated, service_role;


