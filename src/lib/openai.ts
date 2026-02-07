/**
 * OpenAI API 클라이언트
 * GPT-4o-mini 모델 사용
 */

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  message: string;
  error?: string;
}

/**
 * OpenAI API를 호출하여 챗봇 응답 생성
 * @param messages - 대화 히스토리
 * @param userMessage - 사용자 메시지
 * @returns 봇 응답 메시지
 */
export const getOpenAIResponse = async (
  messages: ChatMessage[],
  userMessage: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OpenAI API 키가 설정되지 않았습니다.");
    return "죄송합니다. AI 서비스가 현재 사용할 수 없습니다. 일반 상담으로 도와드리겠습니다.";
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `당신은 Let's Go 가구 쇼핑몰의 친절한 고객 서비스 상담원입니다. 
다음 정보를 참고하여 고객에게 도움을 제공하세요:
- 상품: 모듈 소파, 원목 식탁, 시스템 수납장, 인테리어 조명, 디자인 사이드 테이블
- 주문, 배송, 반품, 교환, 환불 관련 문의를 도와드립니다
- 친절하고 전문적인 톤으로 답변하세요
- 한국어로 답변하세요
- 간결하고 명확하게 답변하세요`,
          },
          ...messages,
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API 오류:", errorData);
      throw new Error(errorData.error?.message || "OpenAI API 호출 실패");
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("응답 메시지를 받지 못했습니다.");
    }

    return assistantMessage.trim();
  } catch (error) {
    console.error("OpenAI API 호출 오류:", error);
    
    // 에러 타입에 따라 다른 메시지 반환
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return "API 키가 유효하지 않습니다. 설정을 확인해주세요.";
      } else if (error.message.includes("429") || error.message.includes("rate limit")) {
        return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
      } else if (error.message.includes("500") || error.message.includes("server")) {
        return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
      }
    }
    
    return "AI 응답 생성 중 오류가 발생했습니다. 일반 상담으로 도와드리겠습니다.";
  }
};

/**
 * 대화 히스토리를 OpenAI 형식으로 변환
 */
export const convertMessagesToOpenAIFormat = (
  messages: Array<{ text: string; sender: "user" | "bot" }>
): ChatMessage[] => {
  return messages
    .filter((msg) => msg.sender !== "bot" || !msg.text.includes("welcome")) // 환영 메시지 제외
    .map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))
    .slice(-10); // 최근 10개 메시지만 전송 (토큰 절약)
};

