-- ==============================================================================
-- HỘI AN EYEWEAR — SEED DATA
-- Seed Version: 20261016_seed.sql
-- Description: Dữ liệu khởi tạo chuẩn cho Hội An Eyewear (Bilingual VI/EN, VND Integer)
-- ==============================================================================

-- 1. ĐỊA ĐIỂM KHO HÀNG (STOCK LOCATIONS)
INSERT INTO public.stock_locations (id, name, address, is_active)
VALUES (
    'HOI_AN_MAIN',
    'Boutique & Kho Tổng Hội An',
    '123 Trần Phú, Phường Minh An, TP. Hội An, Quảng Nam',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    is_active = EXCLUDED.is_active;

-- 2. TÀI KHOẢN VÀ HỒ SƠ NHÂN VIÊN MẪU (TEST STAFF AUTH & PROFILES)
-- Sử dụng UUID cố định để kiểm thử phân quyền RBAC
DO $$
DECLARE
    v_manager_id UUID := 'e0000000-0000-0000-0000-000000000001';
    v_cashier_id UUID := 'e0000000-0000-0000-0000-000000000002';
BEGIN
    -- Chỉ chèn vào auth.users nếu bảng tồn tại và có quyền
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES 
        (
            v_manager_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'manager@hoianeyewear.com',
            crypt('Manager@HoiAn2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Lê Quản Lý"}',
            now(),
            now()
        ),
        (
            v_cashier_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'cashier@hoianeyewear.com',
            crypt('Cashier@HoiAn2026', gen_salt('bf')),
            now(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Trần Thu Ngân"}',
            now(),
            now()
        )
        ON CONFLICT (id) DO NOTHING;

        -- Profiles tương ứng
        INSERT INTO public.profiles (id, full_name, role, phone, is_active)
        VALUES 
        (
            v_manager_id,
            'Lê Quản Lý (Store Manager)',
            'STORE_MANAGER',
            '0905111222',
            true
        ),
        (
            v_cashier_id,
            'Trần Thu Ngân (Cashier)',
            'CASHIER',
            '0905333444',
            true
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            phone = EXCLUDED.phone,
            is_active = EXCLUDED.is_active;
    END IF;
END $$;

-- 3. DANH MỤC SẢN PHẨM (CATEGORIES)
INSERT INTO public.categories (id, slug, name_vi, name_en, description_vi, description_en, image_url, display_order)
VALUES 
(
    'a0000000-0000-0000-0000-000000000001',
    'aviator',
    'Kính Phi Công (Aviator)',
    'Aviator Sunglasses',
    'Dáng kính giọt nước kinh điển, gọng kim loại thanh mảnh tôn nét góc cạnh khuôn mặt.',
    'Classic teardrop silhouette with sleek metal frames, complementing all face shapes.',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
    1
),
(
    'a0000000-0000-0000-0000-000000000002',
    'cat-eye',
    'Kính Mắt Mèo (Cat-Eye)',
    'Cat-Eye Sunglasses',
    'Đuôi kính vuốt cao kiêu kỳ, mang hơi thở cổ điển thập niên 60s cho phong cách quý phái.',
    'Chic upswept winged temples channeling 1960s vintage glamour with modern elegance.',
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80',
    2
),
(
    'a0000000-0000-0000-0000-000000000003',
    'square',
    'Kính Vuông Cổ Điển (Square)',
    'Square Sunglasses',
    'Khung vuông cá tính, bản rộng che chắn nắng biển miền Trung hoàn hảo.',
    'Bold geometric square frames offering maximum UV sun protection for tropical days.',
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80',
    3
),
(
    'a0000000-0000-0000-0000-000000000004',
    'round',
    'Kính Tròn Retro (Round)',
    'Retro Round Sunglasses',
    'Dáng tròn trí thức, phong thái lãng mạn hoài niệm dạo bước bên dòng sông Hoài.',
    'Artisanal rounded frames radiating bohemian charm along the historic streets of Hoi An.',
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80',
    4
)
ON CONFLICT (id) DO UPDATE SET
    slug = EXCLUDED.slug,
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    description_vi = EXCLUDED.description_vi,
    description_en = EXCLUDED.description_en,
    image_url = EXCLUDED.image_url,
    display_order = EXCLUDED.display_order;

-- 4. SẢN PHẨM KÍNH MÁT (PRODUCTS)
INSERT INTO public.products (
    id, category_id, slug, name_vi, name_en, description_vi, description_en,
    frame_material_vi, frame_material_en, lens_width_mm, bridge_width_mm, temple_length_mm,
    is_featured, is_active, tag_vi, tag_en
) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'classic-aviator',
    'Kính Mát Phi Công Cổ Điển',
    'Classic Aviator Sunglasses',
    'Biểu tượng thời trang vượt thời gian với gọng hợp kim mạ PVD vàng óng và tròng phân cực chống chói. Lựa chọn hoàn hảo khi lái xe dọc cung đường ven biển Đà Nẵng - Hội An.',
    'A timeless icon featuring PVD gold-plated alloy and anti-glare polarized lenses. Perfect for coastal drives between Da Nang and Hoi An.',
    'Hợp kim Monel cao cấp mạ PVD chống gỉ',
    'Premium Monel alloy with anti-corrosion PVD plating',
    58, 14, 140,
    true, true,
    'Bán chạy nhất', 'Best Seller'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002',
    'luxury-cat-eye',
    'Kính Mắt Mèo Nữ Sang Trọng',
    'Luxury Cat-Eye Sunglasses',
    'Gọng Acetate cao cấp lấy cảm hứng từ các quý cô thượng lưu dạo phố cổ. Viền mắt vát nhọn cá tính làm thon gọn khuôn mặt phái đẹp.',
    'Sculpted Italian Acetate frames inspired by refined vintage aesthetics, accentuating feminine facial contours.',
    'Acetate bóng hữu cơ nhẹ êm',
    'Handcrafted cellulose Acetate',
    54, 18, 145,
    true, true,
    'Bộ sưu tập mới', 'New Collection'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003',
    'an-bang-square',
    'Kính Râm Gọng Vuông An Bàng',
    'An Bang Square Sunglasses',
    'Thiết kế gọng vuông hiện đại đặt tên theo bãi biển An Bàng thơ mộng. Gọng dày chắc chắn, tròng polarized làm dịu mắt tuyệt đối dưới ánh nắng rực rỡ.',
    'Named after the tranquil An Bang beach. Chunky modern square frame with polarized lenses for ultimate comfort under tropical sun.',
    'Nhựa sinh học TR90 siêu đàn hồi',
    'Bio-based TR90 ultra-flexible polymer',
    56, 19, 148,
    true, true,
    'Đi biển khuyên dùng', 'Beach Essential'
),
(
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004',
    'hoi-an-retro-round',
    'Kính Mát Tròn Phố Cổ Hội An',
    'Hoi An Retro Round Sunglasses',
    'Chiếc kính tròn mang đậm chất nghệ sĩ, gợi nhớ không khí yên bình bên ly cà phê góc đường Nguyễn Thái Học. Cầu kính khắc họa tiết hoa văn đèn lồng.',
    'Bohemian artistic circular lenses with subtle lantern filigree engraved on the nose bridge.',
    'Hợp kim đồng thau Vintage cổ',
    'Vintage antique brass alloy',
    49, 21, 142,
    false, true,
    'Phong cách nghệ thuật', 'Artisanal'
),
(
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000003',
    'wayfarer-bridge',
    'Kính Mát Du Lịch Cầu Đôi',
    'Dual-Bridge Wayfarer Sunglasses',
    'Dáng kính gọng vuông kết hợp thanh cầu đôi thể thao, đệm mũi êm ái chống trượt mồ hôi khi tham gia các hoạt động chèo SUP, đạp xe quanh phố cổ.',
    'Sporty dual-bridge square sunglasses equipped with non-slip nose pads for active cycling and watersports.',
    'Khung hợp kim nhôm Magie siêu nhẹ',
    'Ultra-light Magnesium Aluminum alloy',
    55, 17, 145,
    false, true,
    'Thể thao ngoài trời', 'Outdoor Sport'
),
(
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'titanium-feather',
    'Kính Mát Gọng Titan Siêu Nhẹ',
    'Ultralight Titanium Polarized',
    'Tuyệt tác gọng kính Beta-Titanium chỉ nặng 14 gram. Đeo như không đeo, không gây hằn sống mũi dù dạo phố cả ngày dài.',
    'Masterpiece crafted from Japanese Beta-Titanium weighing only 14g. Featherweight comfort without pressure on the nose bridge.',
    '100% Beta-Titanium đàn hồi cao cấp',
    '100% Pure Japanese Beta-Titanium',
    57, 16, 142,
    true, true,
    'Dòng cao cấp', 'Flagship'
)
ON CONFLICT (id) DO UPDATE SET
    category_id = EXCLUDED.category_id,
    slug = EXCLUDED.slug,
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    description_vi = EXCLUDED.description_vi,
    description_en = EXCLUDED.description_en,
    frame_material_vi = EXCLUDED.frame_material_vi,
    frame_material_en = EXCLUDED.frame_material_en,
    lens_width_mm = EXCLUDED.lens_width_mm,
    bridge_width_mm = EXCLUDED.bridge_width_mm,
    temple_length_mm = EXCLUDED.temple_length_mm,
    is_featured = EXCLUDED.is_featured,
    is_active = EXCLUDED.is_active,
    tag_vi = EXCLUDED.tag_vi,
    tag_en = EXCLUDED.tag_en;

-- 5. BIẾN THỂ SẢN PHẨM & SKU (PRODUCT VARIANTS)
INSERT INTO public.product_variants (
    id, product_id, sku, color_name_vi, color_name_en, color_hex, size_label,
    lens_type, lens_type_vi, lens_type_en, is_polarized, price_vnd, compare_at_price_vnd,
    image_url, is_active
) VALUES
-- prod-1 variants
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'HAE-AV01-GLD-STD-POL',
    'Vàng Ánh Kim', 'Gold Frame', '#D4AF37', 'Tiêu chuẩn (58-14-140)',
    'polarized', 'Tròng Polarized Chống Chói', 'Polarized Anti-Glare', true,
    450000, 550000,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'HAE-AV01-BLK-STD-UV',
    'Đen Mờ (Matte Black)', 'Matte Black', '#1C1C1C', 'Tiêu chuẩn (58-14-140)',
    'uv400', 'Tròng UV400 Khói Râm', 'UV400 Smoke Tint', false,
    390000, 490000,
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'HAE-AV01-SLV-STD-POL',
    'Bạc Ánh Thép', 'Silver Chrome', '#C0C0C0', 'Tiêu chuẩn (58-14-140)',
    'polarized', 'Tròng Polarized Tráng Gương', 'Polarized Mirror', true,
    480000, 590000,
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&q=80', true
),

-- prod-2 variants
(
    'c0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000002',
    'HAE-CAT02-BLK-OS-UV',
    'Đen Bóng Huyền Bí', 'Glossy Black', '#0D0D0D', 'Một cỡ (54-18-145)',
    'uv400', 'Tròng UV400 Khói Đậm', 'UV400 Deep Smoke', false,
    520000, 650000,
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000002',
    'HAE-CAT02-TRT-OS-POL',
    'Đồi Mồi Hổ Phách', 'Amber Tortoise', '#6B3E26', 'Một cỡ (54-18-145)',
    'polarized', 'Tròng Polarized Trà Nâu Chống Chói', 'Polarized Amber Tea', true,
    580000, 720000,
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', true
),

-- prod-3 variants
(
    'c0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000003',
    'HAE-SQ03-TRT-STD-POL',
    'Đồi Mồi Cổ Điển', 'Classic Havana Tortoise', '#543310', 'Tiêu chuẩn (56-19-148)',
    'polarized', 'Tròng Polarized Nâu Cà Phê', 'Polarized Espresso Brown', true,
    480000, 580000,
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000007',
    'b0000000-0000-0000-0000-000000000003',
    'HAE-SQ03-BLK-STD-UV',
    'Đen Tuyền Phong Cách', 'Jet Black', '#111111', 'Tiêu chuẩn (56-19-148)',
    'uv400', 'Tròng UV400 Khói Đen', 'UV400 Smoke Tint', false,
    430000, NULL,
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', true
),

-- prod-4 variants
(
    'c0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000004',
    'HAE-RD04-BRZ-STD-POL',
    'Đồng Rêu Cổ (Antique Bronze)', 'Antique Bronze', '#8C7853', 'Tiêu chuẩn (49-21-142)',
    'polarized', 'Tròng Polarized Xanh Rêu Phố Cổ', 'Polarized Moss Green', true,
    460000, 560000,
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000009',
    'b0000000-0000-0000-0000-000000000004',
    'HAE-RD04-GLD-STD-UV',
    'Vàng Đồng Ấm Áp', 'Warm Gold', '#E5A93C', 'Tiêu chuẩn (49-21-142)',
    'uv400', 'Tròng UV400 Trà Nắng', 'UV400 Warm Tea', false,
    420000, NULL,
    'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', true
),

-- prod-5 variants
(
    'c0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000005',
    'HAE-WF05-GUN-STD-POL',
    'Xám Xước Nòng Súng (Gunmetal)', 'Brushed Gunmetal', '#4A4E51', 'Tiêu chuẩn (55-17-145)',
    'polarized', 'Tròng Polarized Chống Chói Xám Khói', 'Polarized Smoke Grey', true,
    490000, NULL,
    'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&q=80', true
),

-- prod-6 variants
(
    'c0000000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000006',
    'HAE-TI06-GLD-STD-POL',
    'Vàng Champagne Titan', 'Titanium Champagne Gold', '#EAD7A1', 'Tiêu chuẩn (57-16-142)',
    'polarized', 'Tròng Polarized Triacetate 9 Lớp', '9-Layer Triacetate Polarized', true,
    850000, 1100000,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', true
),
(
    'c0000000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000006',
    'HAE-TI06-BLK-STD-POL',
    'Đen Titan Nhám', 'Matte Black Titanium', '#1F2022', 'Tiêu chuẩn (57-16-142)',
    'polarized', 'Tròng Polarized Triacetate 9 Lớp', '9-Layer Triacetate Polarized', true,
    850000, 1100000,
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80', true
)
ON CONFLICT (id) DO UPDATE SET
    sku = EXCLUDED.sku,
    color_name_vi = EXCLUDED.color_name_vi,
    color_name_en = EXCLUDED.color_name_en,
    color_hex = EXCLUDED.color_hex,
    size_label = EXCLUDED.size_label,
    lens_type = EXCLUDED.lens_type,
    lens_type_vi = EXCLUDED.lens_type_vi,
    lens_type_en = EXCLUDED.lens_type_en,
    is_polarized = EXCLUDED.is_polarized,
    price_vnd = EXCLUDED.price_vnd,
    compare_at_price_vnd = EXCLUDED.compare_at_price_vnd,
    image_url = EXCLUDED.image_url,
    is_active = EXCLUDED.is_active;

-- 6. THƯ VIỆN ẢNH SẢN PHẨM (PRODUCT IMAGES)
INSERT INTO public.product_images (product_id, variant_id, image_url, display_order, alt_text_vi, alt_text_en)
VALUES
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', 1, 'Kính Aviator Vàng Ánh Kim', 'Classic Aviator Gold Frame'),
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 2, 'Kính Aviator Đen Mờ', 'Classic Aviator Matte Black'),
('b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&q=80', 3, 'Kính Aviator Bạc Ánh Thép', 'Classic Aviator Silver Chrome'),
('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80', 1, 'Kính Mắt Mèo Đen Bóng', 'Luxury Cat-Eye Glossy Black'),
('b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', 2, 'Kính Mắt Mèo Đồi Mồi', 'Luxury Cat-Eye Amber Tortoise'),
('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80', 1, 'Kính Vuông An Bàng Đồi Mồi', 'An Bang Square Havana Tortoise'),
('b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000007', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80', 2, 'Kính Vuông An Bàng Đen Tuyền', 'An Bang Square Jet Black'),
('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000008', 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', 1, 'Kính Tròn Retro Đồng Rêu', 'Hoi An Retro Round Antique Bronze'),
('b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000009', 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&q=80', 2, 'Kính Tròn Retro Vàng Đồng', 'Hoi An Retro Round Warm Gold'),
('b0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000010', 'https://images.unsplash.com/photo-1509695507497-903c140c43b0?w=800&q=80', 1, 'Kính Cầu Đôi Gunmetal', 'Wayfarer Gunmetal Frame'),
('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000011', 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80', 1, 'Kính Titan Vàng Champagne', 'Titanium Champagne Gold Frame'),
('b0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000012', 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80', 2, 'Kính Titan Đen Nhám', 'Titanium Matte Black Frame')
ON CONFLICT DO NOTHING;

-- 7. SỐ DƯ TỒN KHO THỜI GIAN THỰC (INVENTORY BALANCES)
INSERT INTO public.inventory_balances (variant_id, location_id, quantity_on_hand, quantity_reserved)
VALUES
('c0000000-0000-0000-0000-000000000001', 'HOI_AN_MAIN', 4, 1),
('c0000000-0000-0000-0000-000000000002', 'HOI_AN_MAIN', 12, 2),
('c0000000-0000-0000-0000-000000000003', 'HOI_AN_MAIN', 2, 1),
('c0000000-0000-0000-0000-000000000004', 'HOI_AN_MAIN', 3, 0),
('c0000000-0000-0000-0000-000000000005', 'HOI_AN_MAIN', 8, 1),
('c0000000-0000-0000-0000-000000000006', 'HOI_AN_MAIN', 10, 0),
('c0000000-0000-0000-0000-000000000007', 'HOI_AN_MAIN', 6, 0),
('c0000000-0000-0000-0000-000000000008', 'HOI_AN_MAIN', 5, 1),
('c0000000-0000-0000-0000-000000000009', 'HOI_AN_MAIN', 7, 0),
('c0000000-0000-0000-0000-000000000010', 'HOI_AN_MAIN', 9, 0),
('c0000000-0000-0000-0000-000000000011', 'HOI_AN_MAIN', 3, 1),
('c0000000-0000-0000-0000-000000000012', 'HOI_AN_MAIN', 5, 0)
ON CONFLICT (variant_id, location_id) DO UPDATE SET
    quantity_on_hand = EXCLUDED.quantity_on_hand,
    quantity_reserved = EXCLUDED.quantity_reserved;

-- 8. ĐƠN HÀNG MẪU (SAMPLE ORDERS)
-- Đơn hàng 1: Online - Giao hàng - Shipped - Đã xác minh chuyển khoản VietQR
INSERT INTO public.orders (
    id, order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
    customer_name, customer_phone, customer_phone_last4, customer_email,
    shipping_province, shipping_district, shipping_ward, shipping_street, shipping_full_address,
    shipping_carrier, tracking_code, subtotal_vnd, shipping_fee_vnd, total_amount_vnd,
    customer_notes, bank_transfer_expires_at, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'HAE-8K2M-9X4W',
    'online',
    'delivery',
    'shipped',
    'bank_transfer',
    'verified',
    'Nguyễn Văn An',
    '0905123456',
    '3456',
    'an.nguyen@example.com',
    'Đà Nẵng', 'Hải Châu', 'Thạch Thang', '123 Quang Trung',
    '123 Quang Trung, Phường Thạch Thang, Quận Hải Châu, TP. Đà Nẵng',
    'Giao Hàng Tiết Kiệm (GHTK)',
    'S218931.MN1.88',
    970000, 0, 970000,
    'Giao giờ hành chính giúp mình',
    now() + interval '24 hours',
    now() - interval '2 days',
    now() - interval '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (order_id, variant_id, sku, product_name, variant_description, unit_price_vnd, quantity, total_price_vnd, image_url)
VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'HAE-AV01-GLD-STD-POL',
    'Kính Mát Phi Công Cổ Điển',
    'Vàng Ánh Kim / Polarized',
    450000, 1, 450000,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80'
),
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000004',
    'HAE-CAT02-BLK-OS-UV',
    'Kính Mắt Mèo Nữ Sang Trọng',
    'Đen Bóng / UV400',
    520000, 1, 520000,
    'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- Đơn hàng 2: Online - Nhận tại cửa hàng - Ready for Pickup - COD
INSERT INTO public.orders (
    id, order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
    customer_name, customer_phone, customer_phone_last4,
    subtotal_vnd, shipping_fee_vnd, total_amount_vnd,
    customer_notes, created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000002',
    'HAE-4J7N-2P9Y',
    'online',
    'pickup',
    'ready_for_pickup',
    'cod',
    'pending',
    'Trần Mai Lan',
    '0988776655',
    '6655',
    480000, 0, 480000,
    'Chiều nay tầm 16h ghé qua lấy',
    now() - interval '5 hours',
    now() - interval '2 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (order_id, variant_id, sku, product_name, variant_description, unit_price_vnd, quantity, total_price_vnd, image_url)
VALUES
(
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000006',
    'HAE-SQ03-TRT-STD-POL',
    'Kính Râm Gọng Vuông An Bàng',
    'Đồi Mồi Cổ Điển / Polarized',
    480000, 1, 480000,
    'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- Đơn hàng 3: POS Tại quầy - Completed - Tiền mặt
INSERT INTO public.orders (
    id, order_ref, channel, fulfillment_type, order_status, payment_method, payment_status,
    customer_name, customer_phone, customer_phone_last4,
    subtotal_vnd, shipping_fee_vnd, total_amount_vnd,
    created_at, updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000003',
    'HAE-POS1-9812',
    'in_store',
    'pickup',
    'completed',
    'cash',
    'paid',
    'Khách Mua Tại Quầy',
    '0900000000',
    '0000',
    450000, 0, 450000,
    now() - interval '1 hour',
    now() - interval '1 hour'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_items (order_id, variant_id, sku, product_name, variant_description, unit_price_vnd, quantity, total_price_vnd, image_url)
VALUES
(
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'HAE-AV01-GLD-STD-POL',
    'Kính Mát Phi Công Cổ Điển',
    'Vàng Ánh Kim / Polarized',
    450000, 1, 450000,
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80'
)
ON CONFLICT DO NOTHING;

-- 9. GHI NHẬN LỊCH SỬ TRẠNG THÁI (STATUS HISTORIES)
INSERT INTO public.order_status_history (order_id, from_status, to_status, actor_role, note, created_at)
VALUES
('d0000000-0000-0000-0000-000000000001', NULL, 'pending', 'SYSTEM', 'Khách đặt hàng trực tuyến', now() - interval '2 days'),
('d0000000-0000-0000-0000-000000000001', 'pending', 'confirmed', 'STORE_MANAGER', 'Đã xác minh chuyển khoản VietQR', now() - interval '36 hours'),
('d0000000-0000-0000-0000-000000000001', 'confirmed', 'shipped', 'STORE_MANAGER', 'Bàn giao GHTK mã vận đơn S218931.MN1.88', now() - interval '1 day'),
('d0000000-0000-0000-0000-000000000002', NULL, 'pending', 'SYSTEM', 'Khách đặt nhận tại cửa hàng', now() - interval '5 hours'),
('d0000000-0000-0000-0000-000000000002', 'pending', 'ready_for_pickup', 'CASHIER', 'Đã soạn kính và đóng gói sẵn sàng', now() - interval '2 hours'),
('d0000000-0000-0000-0000-000000000003', NULL, 'completed', 'CASHIER', 'Thanh toán trực tiếp tại quầy Hội An', now() - interval '1 hour')
ON CONFLICT DO NOTHING;

