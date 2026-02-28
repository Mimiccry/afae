/**
 * OpenAI API 클라이언트
 * GPT-4o-mini 모델 사용
 */
import { supabase } from "@/lib/supabase";
import { requestTossPayment } from "@/lib/tossPayments";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  message: string;
  error?: string;
}

export let currentUserEmail: string | null = null;
const FORCE_LOCAL_OPENAI_FUNCTION_CALLING = true;
let pendingOrderDraft: {
  product_id: number;
  quantity: number;
  customer_email?: string;
  customer_name?: string;
} | null = null;

export interface SearchProductResult {
  id: string;
  name: string;
  price: number;
  image: string | null;
  stock: number;
}

export let lastSearchResults: SearchProductResult[] = [];

export const updateLastSearchResults = (results: SearchProductResult[]): void => {
  lastSearchResults = results;
};

interface SearchProductsParams {
  keyword?: string;
  limit?: number;
}

export const search_products = async ({
  keyword = "",
  limit = 6,
}: SearchProductsParams = {}): Promise<SearchProductResult[]> => {
  const safeLimit = Math.max(1, Math.min(limit, 20));
  const trimmedKeyword = keyword.trim();

  let query = supabase
    .from("products")
    .select("id, name, price, image, stock")
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(safeLimit);

  if (trimmedKeyword) {
    query = query.ilike("name", `%${trimmedKeyword}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error("상품 검색 오류:", error);
    updateLastSearchResults([]);
    return [];
  }

  const results = (data ?? []) as SearchProductResult[];
  updateLastSearchResults(results);
  return results;
};

const getEmailFromParsedValue = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  if (typeof record.email === "string" && record.email.trim()) {
    return record.email;
  }

  const nestedUser = record.user as Record<string, unknown> | undefined;
  if (nestedUser && typeof nestedUser.email === "string" && nestedUser.email.trim()) {
    return nestedUser.email;
  }

  return null;
};

const getEmailFromStorage = (storage: Storage): string | null => {
  const candidates = ["user", "userInfo"];

  for (const key of candidates) {
    const rawValue = storage.getItem(key);
    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue);
      const email = getEmailFromParsedValue(parsed);
      if (email) return email;
    } catch {
      if (rawValue.includes("@")) return rawValue;
    }
  }

  return null;
};

export const initializeCurrentUserEmail = async (): Promise<void> => {
  const localStorageEmail = getEmailFromStorage(localStorage);
  if (localStorageEmail) {
    currentUserEmail = localStorageEmail;
    console.log(`로그인 이메일: ${currentUserEmail}`);
    return;
  }

  const sessionStorageEmail = getEmailFromStorage(sessionStorage);
  if (sessionStorageEmail) {
    currentUserEmail = sessionStorageEmail;
    console.log(`로그인 이메일: ${currentUserEmail}`);
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const supabaseEmail = session?.user?.email ?? null;

  if (supabaseEmail) {
    currentUserEmail = supabaseEmail;
    console.log(`로그인 이메일: ${currentUserEmail}`);
    return;
  }

  currentUserEmail = null;
  console.log("로그인 정보 없음");
};

const buildSystemPrompt = (): string => {
  const basePrompt = `당신은 Let's Go 가구 쇼핑몰의 친절한 고객 서비스 상담원입니다.
다음 정보를 참고하여 고객에게 도움을 제공하세요:
- 상품: 모듈 소파, 원목 식탁, 시스템 수납장, 인테리어 조명, 디자인 사이드 테이블
- 주문, 배송, 반품, 교환, 환불 관련 문의를 도와드립니다
- 친절하고 전문적인 톤으로 답변하세요
- 한국어로 답변하세요
- 간결하고 명확하게 답변하세요

[번호 인식 규칙]
- "1번" 또는 "첫 번째"는 lastSearchResults[0]의 id를 product_id로 사용합니다.
- "2번" 또는 "두 번째"는 lastSearchResults[1]의 id를 product_id로 사용합니다.

[수량 인식 규칙]
- "2개"는 quantity: 2로 해석합니다.
- "세 개"는 quantity: 3으로 해석합니다.

[예외 처리]
- lastSearchResults가 비어있으면 "먼저 상품을 검색해주세요"라고 안내하세요.`;

  if (currentUserEmail) {
    return `${basePrompt}
사용자 이메일은 이미 확인되었습니다: ${currentUserEmail}
이메일을 다시 묻지 마세요.
customers 테이블에 이 이메일이 없으면 이름만 물어보세요.`;
  }

  return `${basePrompt}
주문할 때 이메일을 먼저 물어보세요.
그 이메일로 customers 테이블을 조회해서
고객 정보가 없으면 이름도 물어보세요.`;
};

const parseProductIndexFromText = (text: string): number | null => {
  if (/첫\s*번째/.test(text)) return 1;
  if (/두\s*번째/.test(text)) return 2;
  const match = text.match(/(\d+)\s*번/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parseQuantityFromText = (text: string): number => {
  const digitMatch = text.match(/(\d+)\s*개/);
  if (digitMatch) {
    const parsed = Number(digitMatch[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (/세\s*개/.test(text)) return 3;
  if (/두\s*개/.test(text)) return 2;
  if (/한\s*개/.test(text)) return 1;
  return 1;
};

const parseEmailFromText = (text: string): string | undefined => {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
};

const parseNameFromText = (text: string): string | undefined => {
  const namePatterns = [
    /이름(?:은|는)?\s*([가-힣a-zA-Z]{2,20})/,
    /저는\s*([가-힣a-zA-Z]{2,20})/,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }

  const trimmed = text.trim();
  if (/^[가-힣a-zA-Z]{2,20}$/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
};

const runLocalFunctionCalling = async (
  userMessage: string
): Promise<{ text: string; productResults?: SearchProductResult[] }> => {
  const normalized = userMessage.replace(/\s+/g, "");
  const lower = userMessage.toLowerCase();
  const parsedEmail = parseEmailFromText(userMessage);
  const parsedName = parseNameFromText(userMessage);
  const isOrderIntent = /(주문|구매|결제)/.test(normalized);
  const isSearchIntent = /(검색|찾아|보여|상품|제품|테스트)/.test(lower);

  if (pendingOrderDraft) {
    // 새 주문 지시/검색 요청이 오면 이전 draft를 버리고 새 요청을 처리한다.
    if (isOrderIntent || isSearchIntent) {
      pendingOrderDraft = null;
    } else {
    const mergedDraft = {
      ...pendingOrderDraft,
      customer_email: parsedEmail || pendingOrderDraft.customer_email,
      customer_name: parsedName || pendingOrderDraft.customer_name,
    };

    const continuedOrderResult = await create_order(mergedDraft);
    if (!continuedOrderResult.success) {
      if (
        continuedOrderResult.error === "이메일을 알려주세요" ||
        continuedOrderResult.error === "이름을 알려주세요"
      ) {
        pendingOrderDraft = mergedDraft;
      } else {
        pendingOrderDraft = null;
      }
      return { text: continuedOrderResult.error || "주문 처리 중 오류가 발생했습니다." };
    }

    pendingOrderDraft = null;
    return { text: continuedOrderResult.message || "주문을 처리했습니다." };
    }
  }

  if (isOrderIntent) {
    if (lastSearchResults.length === 0) {
      return { text: "먼저 상품을 검색해주세요" };
    }

    const productIndex = parseProductIndexFromText(normalized);
    if (!productIndex) {
      return { text: "몇 번 상품을 주문할지 알려주세요. 예: 1번 상품 2개 주문" };
    }

    const quantity = parseQuantityFromText(normalized);
    const customerEmail = parsedEmail;
    const customerName = parsedName;
    const orderResult = await create_order({
      product_id: productIndex,
      quantity,
      customer_email: customerEmail,
      customer_name: customerName,
    });

    if (!orderResult.success) {
      if (
        orderResult.error === "이메일을 알려주세요" ||
        orderResult.error === "이름을 알려주세요"
      ) {
        pendingOrderDraft = {
          product_id: productIndex,
          quantity,
          customer_email: customerEmail,
          customer_name: customerName,
        };
      } else {
        pendingOrderDraft = null;
      }
      return { text: orderResult.error || "주문 처리 중 오류가 발생했습니다." };
    }

    pendingOrderDraft = null;
    return { text: orderResult.message || "주문을 처리했습니다." };
  }

  if (isSearchIntent) {
    const keyword = userMessage
      .replace(/상품|제품|검색|찾아줘|보여줘|추천|테스트/gi, "")
      .trim();
    const results = await search_products({
      keyword,
      limit: 6,
    });

    if (results.length === 0) {
      return { text: "검색 결과가 없습니다." };
    }

    return {
      text: keyword
        ? `"${keyword}" 검색 결과 ${results.length}개입니다.`
        : `상품 검색 결과 ${results.length}개입니다.`,
      productResults: results,
    };
  }

  return {
    text: "원하시는 상품을 검색하거나, 예: '1번 상품 2개 주문'처럼 입력해 주세요.",
  };
};

/**
 * OpenAI API를 호출하여 챗봇 응답 생성
 * @param messages - 대화 히스토리
 * @param userMessage - 사용자 메시지
 * @returns 봇 응답 메시지
 */
export const chatWithOpenAI = async (
  messages: ChatMessage[],
  userMessage: string
): Promise<{ text: string; productResults?: SearchProductResult[] }> => {
  if (FORCE_LOCAL_OPENAI_FUNCTION_CALLING) {
    return runLocalFunctionCalling(userMessage);
  }

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("OpenAI API 키가 설정되지 않았습니다.");
    return { text: "죄송합니다. AI 서비스가 현재 사용할 수 없습니다. 일반 상담으로 도와드리겠습니다." };
  }

  const tools = [
    {
      type: "function",
      function: {
        name: "search_products",
        description: "상품을 검색합니다.",
        parameters: {
          type: "object",
          properties: {
            keyword: {
              type: "string",
              description: "검색할 상품 키워드(선택사항)",
            },
            limit: {
              type: "number",
              description: "가져올 최대 개수(선택사항)",
            },
          },
        },
      },
    },
    {
      type: "function",
      function: {
        name: "create_order",
        description: "상품을 주문하고 결제를 진행합니다.",
        parameters: {
          type: "object",
          properties: {
            product_id: {
              type: "number",
              description: "주문할 상품 번호 또는 ID(선택사항)",
            },
            quantity: {
              type: "number",
              description: "주문 수량(선택사항)",
            },
            customer_email: {
              type: "string",
              description: "고객 이메일(선택사항)",
            },
            customer_name: {
              type: "string",
              description: "고객 이름(선택사항)",
            },
          },
        },
      },
    },
  ];

  const requestMessages: Array<Record<string, unknown>> = [
    { role: "system", content: buildSystemPrompt() },
    ...messages,
    { role: "user", content: userMessage },
  ];

  let latestProductResults: SearchProductResult[] | undefined;

  try {
    for (let i = 0; i < 5; i++) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini",
          tools,
          tool_choice: "auto",
          messages: requestMessages,
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
      const assistantMessage = data.choices?.[0]?.message;
      const toolCalls = assistantMessage?.tool_calls as
        | Array<{ id: string; function?: { name?: string; arguments?: string } }>
        | undefined;

      if (!assistantMessage) {
        throw new Error("응답 메시지를 받지 못했습니다.");
      }

      if (!toolCalls || toolCalls.length === 0) {
        const text = (assistantMessage.content || "").trim();
        return {
          text: text || "요청을 처리했습니다.",
          productResults: latestProductResults,
        };
      }

      requestMessages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: toolCalls,
      });

      for (const toolCall of toolCalls) {
        const functionName = toolCall.function?.name || "";
        const rawArgs = toolCall.function?.arguments || "{}";

        let parsedArgs: Record<string, unknown> = {};
        try {
          parsedArgs = JSON.parse(rawArgs) as Record<string, unknown>;
        } catch {
          parsedArgs = {};
        }

        let toolResult: unknown;
        if (functionName === "search_products") {
          const results = await search_products({
            keyword: typeof parsedArgs.keyword === "string" ? parsedArgs.keyword : "",
            limit: typeof parsedArgs.limit === "number" ? parsedArgs.limit : 6,
          });
          latestProductResults = results;
          toolResult = { success: true, results };
        } else if (functionName === "create_order") {
          toolResult = await create_order({
            product_id:
              typeof parsedArgs.product_id === "number" ? parsedArgs.product_id : Number(parsedArgs.product_id || 0),
            quantity: typeof parsedArgs.quantity === "number" ? parsedArgs.quantity : Number(parsedArgs.quantity || 1),
            customer_email: typeof parsedArgs.customer_email === "string" ? parsedArgs.customer_email : undefined,
            customer_name: typeof parsedArgs.customer_name === "string" ? parsedArgs.customer_name : undefined,
          });
        } else {
          toolResult = { success: false, error: `지원하지 않는 함수입니다: ${functionName}` };
        }

        requestMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    throw new Error("함수 호출 처리 횟수를 초과했습니다.");
  } catch (error) {
    console.error("OpenAI API 호출 오류:", error);
    
    // 에러 타입에 따라 다른 메시지 반환
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("Unauthorized")) {
        return { text: "API 키가 유효하지 않습니다. 설정을 확인해주세요." };
      } else if (error.message.includes("429") || error.message.includes("rate limit")) {
        return { text: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };
      } else if (error.message.includes("500") || error.message.includes("server")) {
        return { text: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
      }
    }
    
    return { text: "AI 응답 생성 중 오류가 발생했습니다. 일반 상담으로 도와드리겠습니다." };
  }
};

export const getOpenAIResponse = async (
  messages: ChatMessage[],
  userMessage: string
): Promise<{ text: string; productResults?: SearchProductResult[] }> => {
  return chatWithOpenAI(messages, userMessage);
};

interface CreateOrderParams {
  product_id: number;
  quantity: number;
  customer_email?: string;
  customer_name?: string;
}

interface CreateOrderResult {
  success: boolean;
  error?: string;
  message?: string;
  data?: {
    customer_name: string;
    customer_email: string;
    product_id: string;
    product_name: string;
    quantity: number;
    total_price: number;
    status: "pending";
  };
}

export const create_order = async ({
  product_id,
  quantity,
  customer_email,
  customer_name,
}: CreateOrderParams): Promise<CreateOrderResult> => {
  const parsedProductIndex = Number(product_id);
  const selectedFromSearch =
    Number.isInteger(parsedProductIndex) && parsedProductIndex > 0
      ? lastSearchResults[parsedProductIndex - 1]
      : null;

  const resolvedEmail = customer_email?.trim() || currentUserEmail;
  if (!resolvedEmail) {
    return { success: false, error: "이메일을 알려주세요" };
  }

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  const isLoggedInOrder = !!authUser && resolvedEmail === currentUserEmail;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, name, email")
    .eq("email", resolvedEmail)
    .maybeSingle();

  if (customerError) {
    console.error("고객 조회 오류:", customerError);
    return { success: false, error: "고객 정보 조회 중 오류가 발생했습니다." };
  }

  const fallbackNameFromEmail = resolvedEmail.split("@")[0] || "고객";
  const profileName =
    (authUser?.user_metadata?.name as string | undefined) ||
    (authUser?.user_metadata?.full_name as string | undefined);
  const resolvedName =
    customer?.name?.trim() ||
    customer_name?.trim() ||
    (isLoggedInOrder ? (profileName?.trim() || fallbackNameFromEmail) : undefined);
  if (!resolvedName) {
    return { success: false, error: "이름을 알려주세요" };
  }

  let resolvedCustomerId = customer?.id;
  if (!resolvedCustomerId && isLoggedInOrder && authUser?.id) {
    const { data: insertedCustomer, error: insertCustomerError } = await supabase
      .from("customers")
      .upsert(
        {
          id: authUser.id,
          email: resolvedEmail,
          name: resolvedName,
        },
        { onConflict: "id" },
      )
      .select("id")
      .single();

    if (insertCustomerError) {
      console.error("고객 생성 오류:", insertCustomerError);
      return { success: false, error: "고객 정보 저장 중 오류가 발생했습니다." };
    }

    resolvedCustomerId = insertedCustomer.id;
  }

  const productQuery = supabase
    .from("products")
    .select("id, name, price, stock");

  const { data: product, error: productError } = selectedFromSearch
    ? await productQuery.eq("id", selectedFromSearch.id).maybeSingle()
    : await productQuery.eq("id", String(product_id)).maybeSingle();

  if (productError) {
    console.error("상품 조회 오류:", productError);
    return { success: false, error: "상품 정보 조회 중 오류가 발생했습니다." };
  }

  if (!product) {
    return { success: false, error: "상품을 찾을 수 없어요" };
  }

  if (product.stock < quantity) {
    return { success: false, error: `재고가 부족해요 (현재 재고: ${product.stock}개)` };
  }

  const totalPrice = Number(product.price) * quantity;
  const orderName = `${product.name} ${quantity}개`;

  const orderPayload = {
    customer_name: resolvedName,
    customer_email: resolvedEmail,
    product_id: String(product.id),
    product_name: product.name,
    quantity,
    total_price: totalPrice,
    status: "pending" as const,
  };

  try {
    await requestTossPayment({
      amount: totalPrice,
      orderName,
      customerId: resolvedCustomerId,
      customerName: resolvedName,
      customerEmail: resolvedEmail,
      items: [
        {
          id: String(product.id),
          name: product.name,
          price: Number(product.price),
          quantity,
        },
      ],
    });
  } catch (error) {
    console.error("결제 취소/실패:", error);
    return { success: false, error: "결제가 취소되었습니다" };
  }

  return {
    success: true,
    message: `${product.name} ${quantity}개 결제를 진행합니다.`,
    data: {
      ...orderPayload,
    },
  };
};

/**
 * 대화 히스토리를 OpenAI 형식으로 변환
 */
export const convertMessagesToOpenAIFormat = (
  messages: Array<{ text: string; sender: "user" | "bot" }>
): ChatMessage[] => {
  return messages
    .filter((msg) => msg.sender !== "bot" || !msg.text.includes("welcome")) // 환영 메시지 제외
    .map((msg): ChatMessage => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }))
    .slice(-10); // 최근 10개 메시지만 전송 (토큰 절약)
};

