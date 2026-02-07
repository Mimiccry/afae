-- ============================================
-- 채팅 메시지 테이블 생성 SQL
-- ============================================
-- 이 SQL을 Supabase Dashboard의 SQL Editor에서 실행하세요

-- 채팅 메시지 테이블 생성
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    message TEXT NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'bot')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 채팅 세션 테이블 생성 (선택사항)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- RLS 활성화
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 모든 사용자가 메시지를 조회할 수 있음
DROP POLICY IF EXISTS "Anyone can view chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can view chat messages"
    ON public.chat_messages
    FOR SELECT
    USING (true);

-- 정책 생성: 모든 사용자가 메시지를 추가할 수 있음
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.chat_messages;
CREATE POLICY "Anyone can insert chat messages"
    ON public.chat_messages
    FOR INSERT
    WITH CHECK (true);

-- 정책 생성: 채팅 세션 조회
DROP POLICY IF EXISTS "Anyone can view chat sessions" ON public.chat_sessions;
CREATE POLICY "Anyone can view chat sessions"
    ON public.chat_sessions
    FOR SELECT
    USING (true);

-- 정책 생성: 채팅 세션 생성
DROP POLICY IF EXISTS "Anyone can insert chat sessions" ON public.chat_sessions;
CREATE POLICY "Anyone can insert chat sessions"
    ON public.chat_sessions
    FOR INSERT
    WITH CHECK (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();

