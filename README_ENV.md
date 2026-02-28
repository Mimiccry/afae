# 환경 변수 설정 가이드

프로젝트를 실행하기 전에 환경 변수를 설정해야 합니다.

## 설정 방법

1. 프로젝트 루트에 `.env` 파일을 생성하세요.

2. `.env.example` 파일을 참고하여 필요한 환경 변수를 설정하세요:

```env
# Supabase 설정
VITE_SUPABASE_URL=https://wsbzhfeaxgpfppyacflj.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_UGdCipuzReiVa_eV_D_KtQ_87rnMp

# OpenAI API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Toss Payments (선택사항)
VITE_TOSS_CLIENT_KEY=test_ck_KNbdOvk5rkWX19R4L5Knrn07xlzm
```

## 환경 변수 설명

### 필수 환경 변수

- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key (공개 키)

### 선택적 환경 변수

- `VITE_OPENAI_API_KEY`: OpenAI API 키 (챗봇 기능 사용 시 필요)
- `VITE_OPENAI_MODEL`: OpenAI 모델 (기본값: gpt-4o-mini)
- `VITE_TOSS_CLIENT_KEY`: Toss Payments 클라이언트 키 (기본값: 테스트 키)
- `VITE_TOSS_SDK_URL`: Toss Payments SDK URL (기본값: https://js.tosspayments.com/v1)

## 주의사항

⚠️ **`.env` 파일은 절대 Git에 커밋하지 마세요!**

`.env` 파일에는 민감한 정보(API 키 등)가 포함되어 있으므로 반드시 `.gitignore`에 포함되어 있습니다.

## 환경 변수 확인

환경 변수가 제대로 설정되었는지 확인하려면:

1. 개발 서버를 재시작하세요:
   ```bash
   npm run dev
   ```

2. 브라우저 콘솔에서 오류 메시지를 확인하세요.

## 문제 해결

### "Supabase 환경 변수가 설정되지 않았습니다" 오류

`.env` 파일이 프로젝트 루트에 있는지 확인하고, 환경 변수 이름이 정확한지 확인하세요.

### "OpenAI API 키가 설정되지 않았습니다" 경고

OpenAI 기능을 사용하지 않는다면 무시해도 됩니다. 사용하려면 `.env` 파일에 `VITE_OPENAI_API_KEY`를 추가하세요.

