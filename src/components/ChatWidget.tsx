import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { getOpenAIResponse, convertMessagesToOpenAIFormat } from "@/lib/openai";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 세션 ID 생성 또는 가져오기
  useEffect(() => {
    const storedSessionId = localStorage.getItem("chat_session_id");
    if (storedSessionId) {
      setSessionId(storedSessionId);
      loadMessages(storedSessionId);
    } else {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
      localStorage.setItem("chat_session_id", newSessionId);
      
      // 초기 환영 메시지
      const welcomeMessage: Message = {
        id: "welcome",
        text: "안녕하세요! Let's Go 고객센터입니다. 무엇을 도와드릴까요?",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  // 메시지 불러오기
  const loadMessages = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("메시지 불러오기 오류:", error);
        return;
      }

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map((msg) => ({
          id: msg.id,
          text: msg.message,
          sender: msg.sender as "user" | "bot",
          timestamp: new Date(msg.created_at),
        }));
        setMessages(loadedMessages);
      } else {
        // 메시지가 없으면 환영 메시지 표시
        const welcomeMessage: Message = {
          id: "welcome",
          text: "안녕하세요! Let's Go 고객센터입니다. 무엇을 도와드릴까요?",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error("메시지 불러오기 오류:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      // 채팅창이 열리면 입력창에 포커스
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async () => {
    if (!inputValue.trim() || !sessionId) return;

    setIsLoading(true);
    const userMessageText = inputValue.trim();
    setInputValue("");

    try {
      // 사용자 메시지를 Supabase에 저장
      const { data: userData, error: userError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          message: userMessageText,
          sender: "user",
        })
        .select()
        .single();

      if (userError) {
        console.error("메시지 저장 오류:", userError);
        toast.error("메시지 전송에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 사용자 메시지를 UI에 추가
      const userMessage: Message = {
        id: userData.id,
        text: userData.message,
        sender: "user",
        timestamp: new Date(userData.created_at),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 봇 응답 생성 (OpenAI 또는 키워드 기반)
      let botResponse: string;
      
      // "테스트" 키워드는 특별 처리
      if (userMessageText.toLowerCase().includes("테스트")) {
        botResponse = await generateBotResponse(userMessageText);
      } else {
        // OpenAI를 사용한 응답 생성
        try {
          const conversationHistory = convertMessagesToOpenAIFormat(messages);
          botResponse = await getOpenAIResponse(conversationHistory, userMessageText);
        } catch (error) {
          console.error("OpenAI 응답 생성 오류:", error);
          // OpenAI 실패 시 키워드 기반 응답으로 폴백
          botResponse = await generateBotResponse(userMessageText);
        }
      }

      // 봇 응답을 Supabase에 저장
      const { data: botData, error: botError } = await supabase
        .from("chat_messages")
        .insert({
          session_id: sessionId,
          message: botResponse,
          sender: "bot",
        })
        .select()
        .single();

      if (botError) {
        console.error("봇 메시지 저장 오류:", botError);
      } else {
        // 봇 메시지를 UI에 추가
        const botMessage: Message = {
          id: botData.id,
          text: botData.message,
          sender: "bot",
          timestamp: new Date(botData.created_at),
        };
        setMessages((prev) => [...prev, botMessage]);
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error);
      toast.error("메시지 전송에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 간단한 봇 응답 생성 함수 (실제로는 AI API나 더 복잡한 로직 사용)
  const generateBotResponse = async (userMessage: string): Promise<string> => {
    const lowerMessage = userMessage.toLowerCase();

    // "테스트" 입력 시 상품 목록 보여주기
    if (lowerMessage.includes("테스트")) {
      try {
        const { data: products, error } = await supabase
          .from("products")
          .select("name")
          .eq("is_active", true)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("상품 조회 오류:", error);
          return "상품 목록을 불러오는 중 오류가 발생했습니다.";
        }

        if (!products || products.length === 0) {
          return "현재 등록된 상품이 없습니다.";
        }

        const productNames = products.map((p) => `• ${p.name}`).join("\n");
        return `현재 판매 중인 상품 목록입니다:\n\n${productNames}\n\n원하시는 상품이 있으시면 상품명을 알려주세요!`;
      } catch (error) {
        console.error("상품 조회 오류:", error);
        return "상품 목록을 불러오는 중 오류가 발생했습니다.";
      }
    } else if (lowerMessage.includes("주문") || lowerMessage.includes("배송")) {
      return "주문 및 배송 관련 문의사항이시군요. 주문번호를 알려주시면 더 정확하게 도와드릴 수 있습니다.";
    } else if (lowerMessage.includes("반품") || lowerMessage.includes("교환") || lowerMessage.includes("환불")) {
      return "반품/교환/환불 관련 문의사항이시군요. 마이페이지에서 신청하실 수 있으며, 자세한 내용은 고객센터로 연락주시면 도와드리겠습니다.";
    } else if (lowerMessage.includes("가격") || lowerMessage.includes("할인") || lowerMessage.includes("쿠폰")) {
      return "가격 및 할인 관련 문의사항이시군요. 현재 진행 중인 프로모션은 메인 페이지에서 확인하실 수 있습니다.";
    } else if (lowerMessage.includes("상품") || lowerMessage.includes("제품")) {
      return "상품 관련 문의사항이시군요. 상품 상세 페이지에서 자세한 정보를 확인하실 수 있습니다.";
    } else {
      return "감사합니다. 문의사항을 확인했습니다. 담당자가 곧 연락드리겠습니다. 추가로 도움이 필요하시면 언제든지 말씀해주세요.";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsMinimized(!isMinimized);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 채팅 버튼 */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="w-14 h-14 rounded-full bg-[#FEE500] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="채팅하기"
        >
          <MessageCircle className="w-6 h-6 text-foreground group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* 채팅창 */}
      {isOpen && (
        <div
          className={`bg-background border border-border rounded-lg shadow-2xl transition-all duration-300 ${
            isMinimized ? "w-80 h-12" : "w-96 h-[600px]"
          } flex flex-col overflow-hidden`}
        >
          {/* 헤더 */}
          <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">고객센터</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setIsMinimized(!isMinimized)}
                aria-label={isMinimized ? "최대화" : "최소화"}
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                onClick={closeChat}
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* 메시지 영역 */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.sender === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === "user"
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground/70"
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* 입력 영역 */}
              <div className="border-t border-border p-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    size="icon"
                    className="shrink-0"
                    aria-label="전송"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;

