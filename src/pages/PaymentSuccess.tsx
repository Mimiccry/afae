import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { TOSS_PENDING_ORDER_KEY } from "@/lib/tossPayments";
import { useCartStore } from "@/stores/cartStore";
import { toast } from "react-hot-toast";

interface PendingOrder {
  orderId: string;
  amount: number;
  orderName: string;
  items: unknown[];
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSaving, setIsSaving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const clearCart = useCartStore((state) => state.clearCart);

  useEffect(() => {
    const persistOrder = async () => {
      setIsSaving(true);
      setError(null);

      try {
        const pendingRaw = sessionStorage.getItem(TOSS_PENDING_ORDER_KEY);
        if (!pendingRaw) {
          setError("결제 정보가 없습니다. 다시 시도해주세요.");
          return;
        }

        const pending: PendingOrder & { savedAt?: string } = JSON.parse(pendingRaw);

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError("로그인이 만료되었습니다. 다시 로그인해주세요.");
          navigate("/signin");
          return;
        }

        const { error: insertError } = await supabase.from("orders").insert([
          {
            user_id: user.id,
            total_amount: pending.amount,
            status: "주문완료",
            items: pending.items || [],
          },
        ]);

        if (insertError) {
          console.error("Order insert error:", insertError);
          setError("주문 내역 저장에 실패했습니다. 고객센터로 문의해주세요.");
          return;
        }

        // 성공 시 장바구니 비우기 및 pending 제거
        clearCart();
        sessionStorage.removeItem(TOSS_PENDING_ORDER_KEY);
        toast.success("주문이 완료되었습니다!");
      } catch (err) {
        console.error("Payment success handling error:", err);
        setError("예상치 못한 오류가 발생했습니다. 고객센터로 문의해주세요.");
      } finally {
        setIsSaving(false);
      }
    };

    persistOrder();
  }, [navigate, clearCart, searchParams]);

  return (
    <>
      <Helmet>
        <title>결제 완료 - Let's Go</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl mx-auto text-center">
            {isSaving ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-lg text-muted-foreground">주문 정보를 저장하고 있습니다...</p>
              </div>
            ) : error ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <AlertTriangle className="w-12 h-12 text-destructive" />
                  <h1 className="text-2xl font-bold">결제 완료 처리 중 오류</h1>
                  <p className="text-muted-foreground">{error}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link to="/cart">장바구니로 돌아가기</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/">메인으로</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                  <h1 className="text-3xl font-bold">결제가 완료되었습니다!</h1>
                  <p className="text-muted-foreground">마이페이지에서 결제 내역을 확인할 수 있습니다.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild variant="outline">
                    <Link to="/mypage">마이페이지</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/">쇼핑 계속하기</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentSuccess;


