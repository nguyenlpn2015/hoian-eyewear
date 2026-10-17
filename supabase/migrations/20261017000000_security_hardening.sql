-- ==============================================================================
-- HỘI AN EYEWEAR — MIGRATION 20261017000000: BẢO MẬT & TỐI ƯU HÓA PRODUCTION
-- ==============================================================================
-- Mục tiêu:
-- 1. Thiết lập `SET search_path = public, pg_temp` cho toàn bộ các hàm SECURITY DEFINER
--    ngăn chặn triệt để lỗ hổng chiếm quyền (Search Path Hijacking / Privilege Escalation).
-- 2. Thắt chặt quyền của thủ tục `cancel_order_and_release_stock`:
--    Loại bỏ tham số giả lập `p_actor_role = 'SYSTEM'` từ client; chỉ cho phép
--    STORE_MANAGER hoặc service_role thực thi.
-- 3. Bổ sung thủ tục tự động hủy đơn quá hạn 24h `expire_stale_orders_and_release_stock`.
-- ==============================================================================

-- 1. HÀM KIỂM TRA NHÂN VIÊN (Bảo mật search_path)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('CASHIER', 'STORE_MANAGER')
      AND is_active = true
  );
$$;

-- 2. HÀM KIỂM TRA QUẢN LÝ (Bảo mật search_path)
CREATE OR REPLACE FUNCTION public.is_store_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'STORE_MANAGER'
      AND is_active = true
  );
$$;

-- 3. HÀM BÁN HÀNG TẠI QUẦY (Bảo mật search_path)
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
SET search_path = public, pg_temp
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
    IF NOT public.is_staff() AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_NOT_STAFF');
    END IF;

    v_actual_actor_id := COALESCE(auth.uid(), p_actor_id);

    IF p_quantity <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'QUANTITY_MUST_BE_GREATER_THAN_ZERO');
    END IF;

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

    SELECT * INTO v_variant FROM public.product_variants WHERE id = p_variant_id;
    v_total_amount := v_variant.price_vnd * p_quantity;

    UPDATE public.inventory_balances
    SET quantity_on_hand = quantity_on_hand - p_quantity,
        updated_at = now()
    WHERE variant_id = p_variant_id AND location_id = 'HOI_AN_MAIN';

    v_order_ref := 'HAE-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 5 for 4));

    INSERT INTO public.inventory_movements (
        variant_id, location_id, movement_type, quantity_delta,
        balance_on_hand_after, balance_reserved_after, reference_id,
        actor_id, actor_role, reason
    ) VALUES (
        p_variant_id, 'HOI_AN_MAIN', 'SALE_IN_STORE', -p_quantity,
        v_balance.quantity_on_hand - p_quantity, v_balance.quantity_reserved, v_order_ref,
        v_actual_actor_id, v_actor_role, 'Bán hàng trực tiếp tại quầy Boutique Hội An'
    );

    INSERT INTO public.orders (
        order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
        customer_name, customer_phone, customer_phone_last4,
        subtotal_vnd, shipping_fee_vnd, total_amount_vnd, created_by_staff_id
    ) VALUES (
        v_order_ref, 'in_store', 'pickup', 'completed', p_payment_method, 'paid',
        p_customer_name, p_customer_phone, right(p_customer_phone, 4),
        v_total_amount, 0, v_total_amount, v_actual_actor_id
    ) RETURNING id INTO v_order_id;

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

-- 4. HÀM ĐẶT HÀNG TRỰC TUYẾN (Bảo mật search_path)
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
    p_items JSONB,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_ref TEXT;
    v_order_id UUID;
    v_subtotal INTEGER := 0;
    v_total_amount INTEGER;
    v_item RECORD;
    v_variant RECORD;
    v_balance RECORD;
    v_expires_at TIMESTAMPTZ := NULL;
BEGIN
    IF p_idempotency_key IS NOT NULL AND length(trim(p_idempotency_key)) > 0 THEN
        SELECT order_ref, id, total_amount_vnd INTO v_order_ref, v_order_id, v_total_amount
        FROM public.orders
        WHERE idempotency_key = trim(p_idempotency_key);

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

        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_item.variant_id;
        v_subtotal := v_subtotal + (v_variant.price_vnd * v_item.quantity);
    END LOOP;

    v_total_amount := v_subtotal + p_shipping_fee;

    IF p_payment_method = 'bank_transfer' THEN
        v_expires_at := now() + interval '24 hours';
    END IF;

    v_order_ref := 'HAE-' || upper(substring(md5(random()::text) from 1 for 4)) || '-' || upper(substring(md5(random()::text) from 5 for 4));

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

    FOR v_item IN
        SELECT (x->>'variant_id')::UUID AS variant_id, (x->>'quantity')::INTEGER AS quantity
        FROM jsonb_array_elements(p_items) x
    LOOP
        SELECT * INTO v_variant FROM public.product_variants WHERE id = v_item.variant_id;
        SELECT * INTO v_balance FROM public.inventory_balances WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN';

        UPDATE public.inventory_balances
        SET quantity_reserved = quantity_reserved + v_item.quantity,
            updated_at = now()
        WHERE variant_id = v_item.variant_id AND location_id = 'HOI_AN_MAIN';

        INSERT INTO public.inventory_movements (
            variant_id, location_id, movement_type, quantity_delta,
            balance_on_hand_after, balance_reserved_after, reference_id,
            actor_id, actor_role, reason
        ) VALUES (
            v_item.variant_id, 'HOI_AN_MAIN', 'ORDER_RESERVE', v_item.quantity,
            v_balance.quantity_on_hand, v_balance.quantity_reserved + v_item.quantity, v_order_ref,
            NULL, 'SYSTEM', 'Khách đặt hàng online - Giữ chỗ kho 24h'
        );

        INSERT INTO public.order_items (
            order_id, variant_id, sku, product_name, variant_description,
            unit_price_vnd, quantity, total_price_vnd, image_url
        ) VALUES (
            v_order_id, v_item.variant_id, v_variant.sku, v_variant.color_name_vi,
            v_variant.lens_type_vi || ' • ' || v_variant.size_label,
            v_variant.price_vnd, v_item.quantity, v_variant.price_vnd * v_item.quantity, v_variant.image_url
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

-- 5. HÀM HỦY ĐƠN & HOÀN KHO (THẮT CHẶT QUYỀN RBAC & BẢO MẬT search_path)
-- Sửa đổi quan trọng: Loại bỏ tham số kiểm tra string p_actor_role != 'SYSTEM'
-- Chỉ cho phép STORE_MANAGER hoặc service_role thực thi.
CREATE OR REPLACE FUNCTION public.cancel_order_and_release_stock(
    p_order_id UUID,
    p_actor_id UUID,
    p_actor_role TEXT,
    p_reason TEXT DEFAULT 'Khách yêu cầu hủy đơn hoặc quá hạn chuyển khoản 24h'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_balance RECORD;
BEGIN
    -- 0. Kiểm tra quyền nghiêm ngặt: Chỉ Quản lý cửa hàng (STORE_MANAGER) hoặc service_role được gọi
    IF NOT public.is_store_manager() AND auth.role() != 'service_role' THEN
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

-- 6. HÀM TRA CỨU ĐƠN HÀNG KHÁCH VÃNG LAI (Bảo mật search_path)
CREATE OR REPLACE FUNCTION public.verify_guest_order_tracking(
    p_order_ref TEXT,
    p_phone_last4 TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

-- 7. HÀM XÁC THỰC THANH TOÁN CHUYỂN KHOẢN (Bảo mật search_path)
CREATE OR REPLACE FUNCTION public.verify_bank_transfer_payment(
    p_order_id UUID,
    p_transaction_ref TEXT,
    p_note TEXT DEFAULT 'Xác nhận khớp giao dịch chuyển khoản VietQR'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

    UPDATE public.orders
    SET payment_status = 'verified',
        order_status = CASE WHEN order_status = 'pending' THEN 'confirmed' ELSE order_status END,
        updated_at = now()
    WHERE id = p_order_id;

    INSERT INTO public.payment_status_history (
        order_id, from_status, to_status, actor_id, actor_role, amount_vnd, transaction_reference, note
    ) VALUES (
        p_order_id, v_order.payment_status, 'verified', v_actor_id, 'STORE_MANAGER',
        v_order.total_amount_vnd, p_transaction_ref, p_note
    );

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

-- 8. THỦ TỤC MỚI: TỰ ĐỘNG HỦY CÁC ĐƠN HÀNG QUÁ HẠN 24H VÀ HOÀN KHO AN TOÀN
CREATE OR REPLACE FUNCTION public.expire_stale_orders_and_release_stock()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_count INTEGER := 0;
    v_expired_refs TEXT[] := '{}';
BEGIN
    -- Chỉ cho phép Quản lý cửa hàng hoặc tiến trình hệ thống (service_role) thực thi
    IF NOT public.is_store_manager() AND auth.role() != 'service_role' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UNAUTHORIZED_STORE_MANAGER_ONLY');
    END IF;

    FOR v_order IN
        SELECT id, order_ref
        FROM public.orders
        WHERE order_status = 'pending'
          AND payment_method = 'bank_transfer'
          AND bank_transfer_expires_at < now()
        FOR UPDATE SKIP LOCKED
    LOOP
        PERFORM public.cancel_order_and_release_stock(
            v_order.id,
            '00000000-0000-0000-0000-000000000000'::UUID,
            'SYSTEM',
            'Tự động hủy và hoàn trả tồn kho do quá hạn thanh toán chuyển khoản VietQR 24h'
        );
        v_count := v_count + 1;
        v_expired_refs := array_append(v_expired_refs, v_order.order_ref);
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'expired_count', v_count,
        'expired_order_refs', v_expired_refs
    );
END;
$$;

-- Phân quyền cho thủ tục mới
REVOKE EXECUTE ON FUNCTION public.expire_stale_orders_and_release_stock FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.expire_stale_orders_and_release_stock TO authenticated, service_role;

