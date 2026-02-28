-- ============================================
-- 상품 데이터 INSERT SQL
-- product_json.json 기반
-- ============================================
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 기존 데이터 삭제 (선택사항 - 필요시 주석 해제)
-- DELETE FROM public.products;

-- 상품 데이터 삽입
INSERT INTO public.products (id, name, description, price, image, category, badge, stock, is_active) VALUES
    (
        '00000000-0000-0000-0000-000000000001'::uuid,
        '모듈 소파',
        '내 공간에 맞춰 자유롭게 조립하고, 구름처럼 따뜻하게 몸을 감싸는 휴식의 중심',
        1890000,
        '/src/assets/products/sofa.jpg',
        '거실',
        'SALE',
        10,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000002'::uuid,
        '원목 식탁',
        '결이 고운 나무 위에 매일의 온기를 담아내는, 우리 가족의 가장 다정한 대화 창구',
        980000,
        '/src/assets/products/table.png',
        '다이닝',
        'NEW',
        5,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000003'::uuid,
        '시스템 수납장',
        '복잡한 짐은 깔끔하게 비우고, 나만의 취향만 예쁘게 채워넣는 영리한 공간 활용',
        720000,
        '/src/assets/products/storage.jpg',
        '수납',
        NULL,
        8,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000004'::uuid,
        '인테리어 조명',
        '차가운 방 안을 한순간에 아늑한 영화 속 장면으로 바꿔주는 마법 같은 빛 한 방울',
        289000,
        '/src/assets/products/lamp.jpg',
        '조명',
        'NEW',
        15,
        true
    ),
    (
        '00000000-0000-0000-0000-000000000005'::uuid,
        '디자인 사이드 테이블',
        '어느 곳에 두어도 당신의 동선을 따라 안락함을 완성하는, 작지만 가장 완벽한 곁',
        189000,
        '/src/assets/products/sidetable.jpg',
        '테이블',
        'SALE',
        12,
        true
    )
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image = EXCLUDED.image,
    category = EXCLUDED.category,
    badge = EXCLUDED.badge,
    stock = EXCLUDED.stock,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- ============================================
-- 또는 UUID 자동 생성 버전 (id를 지정하지 않음)
-- ============================================
/*
INSERT INTO public.products (name, description, price, image, category, badge, stock, is_active) VALUES
    (
        '모듈 소파',
        '내 공간에 맞춰 자유롭게 조립하고, 구름처럼 따뜻하게 몸을 감싸는 휴식의 중심',
        1890000,
        '/src/assets/products/sofa.jpg',
        '거실',
        'SALE',
        10,
        true
    ),
    (
        '원목 식탁',
        '결이 고운 나무 위에 매일의 온기를 담아내는, 우리 가족의 가장 다정한 대화 창구',
        980000,
        '/src/assets/products/table.png',
        '다이닝',
        'NEW',
        5,
        true
    ),
    (
        '시스템 수납장',
        '복잡한 짐은 깔끔하게 비우고, 나만의 취향만 예쁘게 채워넣는 영리한 공간 활용',
        720000,
        '/src/assets/products/storage.jpg',
        '수납',
        NULL,
        8,
        true
    ),
    (
        '인테리어 조명',
        '차가운 방 안을 한순간에 아늑한 영화 속 장면으로 바꿔주는 마법 같은 빛 한 방울',
        289000,
        '/src/assets/products/lamp.jpg',
        '조명',
        'NEW',
        15,
        true
    ),
    (
        '디자인 사이드 테이블',
        '어느 곳에 두어도 당신의 동선을 따라 안락함을 완성하는, 작지만 가장 완벽한 곁',
        189000,
        '/src/assets/products/sidetable.jpg',
        '테이블',
        'SALE',
        12,
        true
    );
*/

-- ============================================
-- 2. 고객(customers) 샘플 데이터 삽입
-- ============================================
-- 주의: customers 테이블은 auth.users(id)를 참조하므로,
-- 먼저 auth.users에 테스트 사용자를 생성해야 합니다.
-- 
-- 방법 1: Supabase Dashboard > Authentication > Users에서 수동으로 사용자 생성
-- 방법 2: 아래 DO 블록을 사용하여 자동 생성 (권한이 있는 경우)

-- auth.users에 테스트 사용자 생성 시도
DO $$
DECLARE
    test_user_ids UUID[] := ARRAY[
        '11111111-1111-1111-1111-111111111111'::uuid,
        '22222222-2222-2222-2222-222222222222'::uuid,
        '33333333-3333-3333-3333-333333333333'::uuid
    ];
    user_id UUID;
    user_email TEXT;
    user_emails TEXT[] := ARRAY[
        'kim.chulsoo@example.com',
        'lee.younghee@example.com',
        'park.minsu@example.com'
    ];
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(test_user_ids, 1) LOOP
        user_id := test_user_ids[i];
        user_email := user_emails[i];
        
        -- auth.users에 사용자가 없으면 생성 시도
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
            BEGIN
                INSERT INTO auth.users (
                    id,
                    instance_id,
                    email,
                    encrypted_password,
                    email_confirmed_at,
                    created_at,
                    updated_at,
                    raw_app_meta_data,
                    raw_user_meta_data,
                    is_super_admin,
                    role
                ) VALUES (
                    user_id,
                    (SELECT id FROM auth.instances LIMIT 1),
                    user_email,
                    crypt('test123456', gen_salt('bf')),
                    NOW(),
                    NOW(),
                    NOW(),
                    '{"provider":"email","providers":["email"]}'::jsonb,
                    '{}'::jsonb,
                    false,
                    'authenticated'
                );
                RAISE NOTICE '사용자 생성 성공: %', user_email;
            EXCEPTION
                WHEN insufficient_privilege THEN
                    RAISE NOTICE 'auth.users 테이블에 접근 권한이 없습니다. Supabase Dashboard > Authentication > Users에서 수동으로 사용자를 생성하세요.';
                WHEN OTHERS THEN
                    RAISE NOTICE '사용자 생성 실패 (%): %', user_email, SQLERRM;
            END;
        ELSE
            RAISE NOTICE '사용자 이미 존재: %', user_email;
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '사용자 생성 프로세스 오류: %', SQLERRM;
END $$;

-- customers 테이블에 고객 데이터 삽입
-- auth.users에 해당 사용자가 존재하는 경우에만 삽입
INSERT INTO public.customers (id, name, email, phone, address, address_detail, postal_code) 
SELECT 
    v.id,
    v.name,
    v.email,
    v.phone,
    v.address,
    v.address_detail,
    v.postal_code
FROM (VALUES
    (
        '11111111-1111-1111-1111-111111111111'::uuid,
        '김철수',
        'kim.chulsoo@example.com',
        '010-1234-5678',
        '서울특별시 강남구 테헤란로 123',
        '456호',
        '06234'
    ),
    (
        '22222222-2222-2222-2222-222222222222'::uuid,
        '이영희',
        'lee.younghee@example.com',
        '010-2345-6789',
        '서울특별시 서초구 서초대로 456',
        '789호',
        '06578'
    ),
    (
        '33333333-3333-3333-3333-333333333333'::uuid,
        '박민수',
        'park.minsu@example.com',
        '010-3456-7890',
        '경기도 성남시 분당구 정자일로 789',
        '101호',
        '13579'
    )
) AS v(id, name, email, phone, address, address_detail, postal_code)
WHERE EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = v.id)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    address_detail = EXCLUDED.address_detail,
    postal_code = EXCLUDED.postal_code,
    updated_at = NOW();

-- ============================================
-- 3. 주문(orders) 샘플 데이터 삽입
-- ============================================
-- orders 테이블에 필요한 컬럼이 없으면 추가
DO $$
BEGIN
    -- shipping_address 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_address'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_address TEXT;
    END IF;

    -- shipping_address_detail 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_address_detail'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_address_detail TEXT;
    END IF;

    -- shipping_postal_code 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_postal_code'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_postal_code TEXT;
    END IF;

    -- shipping_phone 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_phone'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_phone TEXT;
    END IF;

    -- shipping_name 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'shipping_name'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN shipping_name TEXT;
    END IF;

    -- payment_method 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN payment_method TEXT;
    END IF;

    -- payment_id 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'payment_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN payment_id TEXT;
    END IF;

    -- user_id 컬럼이 없으면 추가 (customer_id와 같은 값 사용)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.orders ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '컬럼 추가 중 오류 발생: %', SQLERRM;
END $$;

-- 주문 데이터 삽입
-- user_id 컬럼이 있으면 customer_id와 같은 값으로 설정
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_customer_id BOOLEAN;
BEGIN
    -- 컬럼 존재 여부 확인
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'user_id'
    ) INTO has_user_id;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'customer_id'
    ) INTO has_customer_id;

    -- user_id와 customer_id 모두 있는 경우
    IF has_user_id AND has_customer_id THEN
        INSERT INTO public.orders (
            id, user_id, customer_id, total_amount, status,
            shipping_address, shipping_address_detail, shipping_postal_code,
            shipping_phone, shipping_name, payment_method, payment_id
        ) VALUES
            (
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                2368000,
                '결제완료',
                '서울특별시 강남구 테헤란로 123',
                '456호',
                '06234',
                '010-1234-5678',
                '김철수',
                '카드결제',
                'PAY_20240101_001'
            ),
            (
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
                '22222222-2222-2222-2222-222222222222'::uuid,
                '22222222-2222-2222-2222-222222222222'::uuid,
                1700000,
                '배송준비',
                '서울특별시 서초구 서초대로 456',
                '789호',
                '06578',
                '010-2345-6789',
                '이영희',
                '계좌이체',
                'TRANSFER_20240102_001'
            )
        ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            customer_id = EXCLUDED.customer_id,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            shipping_address_detail = EXCLUDED.shipping_address_detail,
            shipping_postal_code = EXCLUDED.shipping_postal_code,
            shipping_phone = EXCLUDED.shipping_phone,
            shipping_name = EXCLUDED.shipping_name,
            payment_method = EXCLUDED.payment_method,
            payment_id = EXCLUDED.payment_id,
            updated_at = NOW();
    -- user_id만 있는 경우
    ELSIF has_user_id THEN
        INSERT INTO public.orders (
            id, user_id, total_amount, status,
            shipping_address, shipping_address_detail, shipping_postal_code,
            shipping_phone, shipping_name, payment_method, payment_id
        ) VALUES
            (
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                2368000,
                '결제완료',
                '서울특별시 강남구 테헤란로 123',
                '456호',
                '06234',
                '010-1234-5678',
                '김철수',
                '카드결제',
                'PAY_20240101_001'
            ),
            (
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
                '22222222-2222-2222-2222-222222222222'::uuid,
                1700000,
                '배송준비',
                '서울특별시 서초구 서초대로 456',
                '789호',
                '06578',
                '010-2345-6789',
                '이영희',
                '계좌이체',
                'TRANSFER_20240102_001'
            )
        ON CONFLICT (id) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            shipping_address_detail = EXCLUDED.shipping_address_detail,
            shipping_postal_code = EXCLUDED.shipping_postal_code,
            shipping_phone = EXCLUDED.shipping_phone,
            shipping_name = EXCLUDED.shipping_name,
            payment_method = EXCLUDED.payment_method,
            payment_id = EXCLUDED.payment_id,
            updated_at = NOW();
    -- customer_id만 있는 경우 (기존 코드)
    ELSIF has_customer_id THEN
        INSERT INTO public.orders (
            id, customer_id, total_amount, status,
            shipping_address, shipping_address_detail, shipping_postal_code,
            shipping_phone, shipping_name, payment_method, payment_id
        ) VALUES
            (
                'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
                '11111111-1111-1111-1111-111111111111'::uuid,
                2368000,
                '결제완료',
                '서울특별시 강남구 테헤란로 123',
                '456호',
                '06234',
                '010-1234-5678',
                '김철수',
                '카드결제',
                'PAY_20240101_001'
            ),
            (
                'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
                '22222222-2222-2222-2222-222222222222'::uuid,
                1700000,
                '배송준비',
                '서울특별시 서초구 서초대로 456',
                '789호',
                '06578',
                '010-2345-6789',
                '이영희',
                '계좌이체',
                'TRANSFER_20240102_001'
            )
        ON CONFLICT (id) DO UPDATE SET
            customer_id = EXCLUDED.customer_id,
            total_amount = EXCLUDED.total_amount,
            status = EXCLUDED.status,
            shipping_address = EXCLUDED.shipping_address,
            shipping_address_detail = EXCLUDED.shipping_address_detail,
            shipping_postal_code = EXCLUDED.shipping_postal_code,
            shipping_phone = EXCLUDED.shipping_phone,
            shipping_name = EXCLUDED.shipping_name,
            payment_method = EXCLUDED.payment_method,
            payment_id = EXCLUDED.payment_id,
            updated_at = NOW();
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '주문 데이터 삽입 중 오류 발생: %', SQLERRM;
END $$;

-- ============================================
-- 4. 주문 상품(order_items) 샘플 데이터 삽입
-- ============================================
-- 주문 1: 김철수의 주문 (모듈 소파, 인테리어 조명, 디자인 사이드 테이블)
INSERT INTO public.order_items (order_id, product_id, quantity, price, subtotal) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        '00000000-0000-0000-0000-000000000001'::uuid,  -- 모듈 소파
        1,
        1890000,
        1890000
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        '00000000-0000-0000-0000-000000000004'::uuid,  -- 인테리어 조명
        1,
        289000,
        289000
    ),
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
        '00000000-0000-0000-0000-000000000005'::uuid,  -- 디자인 사이드 테이블
        1,
        189000,
        189000
    )
ON CONFLICT DO NOTHING;

-- 주문 2: 이영희의 주문 (원목 식탁, 시스템 수납장)
INSERT INTO public.order_items (order_id, product_id, quantity, price, subtotal) VALUES
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        '00000000-0000-0000-0000-000000000002'::uuid,  -- 원목 식탁
        1,
        980000,
        980000
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid,
        '00000000-0000-0000-0000-000000000003'::uuid,  -- 시스템 수납장
        1,
        720000,
        720000
    )
ON CONFLICT DO NOTHING;

-- ============================================
-- 삽입된 데이터 확인
-- ============================================
-- 상품 확인
-- SELECT * FROM public.products ORDER BY created_at DESC;

-- 고객 확인
-- SELECT * FROM public.customers ORDER BY created_at DESC;

-- 주문 확인
-- SELECT * FROM public.orders ORDER BY created_at DESC;

-- 주문 상세 확인 (주문 + 주문 상품 + 상품 정보)
-- SELECT 
--     o.id as order_id,
--     o.status,
--     o.total_amount,
--     c.name as customer_name,
--     c.email as customer_email,
--     oi.quantity,
--     oi.price,
--     oi.subtotal,
--     p.name as product_name,
--     p.category
-- FROM public.orders o
-- JOIN public.customers c ON o.customer_id = c.id
-- JOIN public.order_items oi ON o.id = oi.order_id
-- JOIN public.products p ON oi.product_id = p.id
-- ORDER BY o.created_at DESC;

