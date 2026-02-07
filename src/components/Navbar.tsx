import { Link, useNavigate } from "react-router-dom";
import { Home, ShoppingCart, User, Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const navigate = useNavigate();
  const count = useCartStore((state) => state.count);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    setMounted(true);

    // 현재 사용자 확인
    const checkUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
    };

    checkUser();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error(error.message || "로그아웃 중 오류가 발생했습니다.");
        return;
      }

      toast.success("로그아웃되었습니다.");
      navigate("/");
    } catch (error) {
      toast.error("예상치 못한 오류가 발생했습니다.");
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-card/95 backdrop-blur-sm border-b border-border">
      <nav className="container mx-auto flex items-center justify-between h-16 md:h-20 px-4">
        {/* 로고 */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold text-foreground hover:text-primary transition-colors"
        >
          Let's Go
        </Link>

        {/* 네비게이션 아이콘 */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            to="/"
            className="flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="홈"
          >
            <Home className="w-6 h-6" />
          </Link>

          <Link
            to="/cart"
            className="relative flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label="장바구니"
          >
            <ShoppingCart className="w-6 h-6" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold bg-primary text-primary-foreground">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center justify-center w-11 h-11 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                aria-label="사용자 메뉴"
              >
                <User className="w-6 h-6" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/mypage" className="cursor-pointer">
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link to="/signin" className="cursor-pointer">
                      로그인
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/signup" className="cursor-pointer">
                      회원가입
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
