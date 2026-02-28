-- ============================================
-- Supabase 데이터베이스 테이블 생성 SQL
-- 상품, 고객, 주문 테이블
-- ============================================
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요
-- https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new






-- ============================================
-- 1. 상품(products) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    image TEXT,
    category TEXT NOT NULL,
    badge TEXT CHECK (badge IN ('SALE', 'NEW')),
    stock INTEGER DEFAULT 0 CHECK (stock >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 상품 테이블 RLS 활성화 (이미 활성화되어 있어도 에러 없음)
DO $$
BEGIN
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 모든 사용자가 상품을 조회할 수 있도록 정책 생성
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Products are viewable by everyone"
    ON public.products
    FOR SELECT
    USING (true);

-- 관리자만 상품을 추가/수정/삭제할 수 있도록 정책 생성 (필요시 수정)
DROP POLICY IF EXISTS "Only admins can insert products" ON public.products;
CREATE POLICY "Only admins can insert products"
    ON public.products
    FOR INSERT
    WITH CHECK (true); -- 실제로는 관리자 체크 로직 추가 필요

DROP POLICY IF EXISTS "Only admins can update products" ON public.products;
CREATE POLICY "Only admins can update products"
    ON public.products
    FOR UPDATE
    USING (true); -- 실제로는 관리자 체크 로직 추가 필요

DROP POLICY IF EXISTS "Only admins can delete products" ON public.products;
CREATE POLICY "Only admins can delete products"
    ON public.products
    FOR DELETE
    USING (true); -- 실제로는 관리자 체크 로직 추가 필요

-- 상품 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- ============================================
-- 2. 고객(customers) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    address_detail TEXT,
    postal_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 고객 테이블 RLS 활성화 (이미 활성화되어 있어도 에러 없음)
DO $$
BEGIN
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 사용자는 자신의 정보만 조회할 수 있는 정책 생성
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.customers;
CREATE POLICY "Users can view their own customer data"
    ON public.customers
    FOR SELECT
    USING (auth.uid() = id);

-- 사용자는 자신의 정보를 추가/수정할 수 있는 정책 생성
DROP POLICY IF EXISTS "Users can insert their own customer data" ON public.customers;
CREATE POLICY "Users can insert their own customer data"
    ON public.customers
    FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own customer data" ON public.customers;
CREATE POLICY "Users can update their own customer data"
    ON public.customers
    FOR UPDATE
    USING (auth.uid() = id);

-- 고객 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- ============================================
-- 3. 주문(orders) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT '주문완료' CHECK (status IN ('주문완료', '결제완료', '배송준비', '배송중', '배송완료', '취소', '환불')),
    shipping_address TEXT,
    shipping_address_detail TEXT,
    shipping_postal_code TEXT,
    shipping_phone TEXT,
    shipping_name TEXT,
    payment_method TEXT,
    payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- orders 테이블이 이미 존재하지만 customer_id 컬럼이 없는 경우 추가
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        -- customer_id 컬럼 추가 (customers 테이블이 존재하는 경우에만)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
            ALTER TABLE public.orders 
            ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE;
            
            -- NOT NULL 제약조건은 나중에 데이터가 있을 수 있으므로 주석 처리
            -- 필요시 데이터 마이그레이션 후 수동으로 추가
            -- ALTER TABLE public.orders ALTER COLUMN customer_id SET NOT NULL;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'customer_id 컬럼 추가 중 오류 발생: %', SQLERRM;
END $$;

-- 주문 테이블 RLS 활성화 (이미 활성화되어 있어도 에러 없음)
DO $$
BEGIN
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 사용자는 자신의 주문만 조회할 수 있는 정책 생성
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = customer_id);

-- 사용자는 자신의 주문만 생성할 수 있는 정책 생성
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
CREATE POLICY "Users can insert their own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- 사용자는 자신의 주문만 수정할 수 있는 정책 생성
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders"
    ON public.orders
    FOR UPDATE
    USING (auth.uid() = customer_id);

-- 주문 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================
-- 4. 주문 상품(order_items) 테이블 생성
-- ============================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 주문 상품 테이블 RLS 활성화 (이미 활성화되어 있어도 에러 없음)
DO $$
BEGIN
    ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 사용자는 자신의 주문에 속한 상품만 조회할 수 있는 정책 생성
-- orders 테이블이 존재하고 customer_id 컬럼이 있는지 확인 후 정책 생성
DO $$
BEGIN
    -- orders 테이블에 customer_id 컬럼이 있는지 확인
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'orders' 
        AND column_name = 'customer_id'
    ) THEN
        DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
        CREATE POLICY "Users can view their own order items"
            ON public.order_items
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.orders
                    WHERE orders.id = order_items.order_id
                    AND orders.customer_id = auth.uid()
                )
            );

        DROP POLICY IF EXISTS "Users can insert their own order items" ON public.order_items;
        CREATE POLICY "Users can insert their own order items"
            ON public.order_items
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.orders
                    WHERE orders.id = order_items.order_id
                    AND orders.customer_id = auth.uid()
                )
            );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '정책 생성 중 오류 발생: %', SQLERRM;
END $$;

-- 주문 상품 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- ============================================
-- 5. updated_at 자동 업데이트를 위한 함수 및 트리거
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 생성
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. 초기 상품 데이터 삽입 (선택사항)
-- ============================================
INSERT INTO public.products (name, description, price, category, badge) VALUES
    ('모듈 소파', '내 공간에 맞춰 자유롭게 조립하고, 구름처럼 따뜻하게 몸을 감싸는 휴식의 중심', 1890000, '거실', 'SALE'),
    ('원목 식탁', '결이 고운 나무 위에 매일의 온기를 담아내는, 우리 가족의 가장 다정한 대화 창구', 980000, '다이닝', 'NEW'),
    ('시스템 수납장', '복잡한 짐은 깔끔하게 비우고, 나만의 취향만 예쁘게 채워넣는 영리한 공간 활용', 720000, '수납', NULL),
    ('인테리어 조명', '차가운 방 안을 한순간에 아늑한 영화 속 장면으로 바꿔주는 마법 같은 빛 한 방울', 289000, '조명', 'NEW'),
    ('디자인 사이드 테이블', '어느 곳에 두어도 당신의 동선을 따라 안락함을 완성하는, 작지만 가장 완벽한 곁', 189000, '테이블', 'SALE')
ON CONFLICT DO NOTHING;

-- ============================================
-- 사용법:
-- 1. Supabase Dashboard에 로그인
-- 2. SQL Editor 메뉴로 이동
-- 3. 위의 SQL 전체를 복사하여 붙여넣기
-- 4. "Run" 버튼 클릭하여 실행
-- ============================================
