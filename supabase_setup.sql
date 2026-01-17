-- ============================================
-- Supabase Orders 테이블 생성 SQL
-- ============================================
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요
-- https://app.supabase.com/project/YOUR_PROJECT_ID/sql/new

-- 1. orders 테이블 생성
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT '주문완료',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. 사용자는 자신의 주문만 볼 수 있는 정책 생성
CREATE POLICY "Users can view their own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. 사용자는 자신의 주문만 생성할 수 있는 정책 생성
CREATE POLICY "Users can insert their own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. updated_at 자동 업데이트를 위한 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. updated_at 트리거 생성
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ============================================
-- 사용법:
-- 1. Supabase Dashboard에 로그인
-- 2. SQL Editor 메뉴로 이동
-- 3. 위의 SQL 전체를 복사하여 붙여넣기
-- 4. "Run" 버튼 클릭하여 실행
-- ============================================

