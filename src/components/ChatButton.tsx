import { MessageCircle } from "lucide-react";

const ChatButton = () => {
  return (
    <button
      className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-[#FEE500] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
      aria-label="상담하기"
    >
      <MessageCircle className="w-6 h-6 text-foreground" />
    </button>
  );
};

export default ChatButton;
