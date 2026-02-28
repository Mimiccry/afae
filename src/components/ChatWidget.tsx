import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import {
  getOpenAIResponse,
  convertMessagesToOpenAIFormat,
  initializeCurrentUserEmail,
  type SearchProductResult,
} from "@/lib/openai";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  productResults?: SearchProductResult[];
}

interface BotReply {
  text: string;
  productResults?: SearchProductResult[];
}

const isMissingChatMessagesTableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const record = error as Record<string, unknown>;
  return record.code === "PGRST205";
};

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
    void initializeCurrentUserEmail();

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
        if (isMissingChatMessagesTableError(error)) {
          console.warn(
            "chat_messages 테이블이 없어 로컬 모드로 동작합니다. supabase_chat_setup.sql을 실행하세요."
          );
          const welcomeMessage: Message = {
            id: "welcome",
            text: "안녕하세요! Let's Go 고객센터입니다. 무엇을 도와드릴까요?",
            sender: "bot",
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
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

      const useLocalFallback = !!userError && isMissingChatMessagesTableError(userError);
      if (userError && !useLocalFallback) {
        console.error("메시지 저장 오류:", userError);
        toast.error("메시지 전송에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      if (useLocalFallback) {
        console.warn(
          "chat_messages 테이블이 없어 메시지를 DB에 저장하지 않고 로컬 UI에만 표시합니다."
        );
      }

      // 사용자 메시지를 UI에 추가
      const userMessage: Message = {
        id: userData?.id ?? `local_user_${Date.now()}`,
        text: userData?.message ?? userMessageText,
        sender: "user",
        timestamp: new Date(userData?.created_at ?? Date.now()),
      };
      setMessages((prev) => [...prev, userMessage]);

      // 봇 응답 생성 (OpenAI function calling)
      let botReply: BotReply;

      try {
        const conversationHistory = convertMessagesToOpenAIFormat(messages);
        const aiResponse = await getOpenAIResponse(conversationHistory, userMessageText);
        botReply = {
          text: aiResponse.text,
          productResults: aiResponse.productResults,
        };
      } catch (error) {
        console.error("OpenAI 응답 생성 오류:", error);
        botReply = {
          text: "AI 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };
      }

      // 봇 응답을 Supabase에 저장
      if (!useLocalFallback) {
        const { data: botData, error: botError } = await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            message: botReply.text,
            sender: "bot",
          })
          .select()
          .single();

        if (botError) {
          console.error("봇 메시지 저장 오류:", botError);
          if (isMissingChatMessagesTableError(botError)) {
            const botMessage: Message = {
              id: `local_bot_${Date.now()}`,
              text: botReply.text,
              sender: "bot",
              timestamp: new Date(),
              productResults: botReply.productResults,
            };
            setMessages((prev) => [...prev, botMessage]);
          }
        } else {
          // 봇 메시지를 UI에 추가
          const botMessage: Message = {
            id: botData.id,
            text: botData.message,
            sender: "bot",
            timestamp: new Date(botData.created_at),
            productResults: botReply.productResults,
          };
          setMessages((prev) => [...prev, botMessage]);
        }
      } else {
        const botMessage: Message = {
          id: `local_bot_${Date.now()}`,
          text: botReply.text,
          sender: "bot",
          timestamp: new Date(),
          productResults: botReply.productResults,
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

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("ko-KR").format(value);
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
                        {message.sender === "bot" && message.productResults && message.productResults.length > 0 && (
                          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {message.productResults.map((product, index) => (
                              <div
                                key={product.id}
                                className="rounded-md border border-border/70 bg-background p-2 text-foreground"
                              >
                                <p className="text-xs font-semibold text-primary mb-2">
                                  #{index + 1}
                                </p>
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-24 object-cover rounded-md mb-2"
                                  />
                                ) : (
                                  <div className="w-full h-24 rounded-md mb-2 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                    이미지 없음
                                  </div>
                                )}
                                <p className="text-sm font-semibold line-clamp-2">{product.name}</p>
                                <p className="text-sm mt-1">{formatNumber(product.price)}원</p>
                                <p className="text-xs mt-1 text-muted-foreground">
                                  재고 {product.stock}개
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
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

