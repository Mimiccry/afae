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
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
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

        const paymentKey = searchParams.get("paymentKey");
        if (!paymentKey) {
          setError("결제 확인 키가 없습니다. 다시 시도해주세요.");
          return;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const orderUserId = user?.id || pending.customerId;
        let customerId = pending.customerId || orderUserId;
        const customerEmail = pending.customerEmail || user?.email || null;
        const customerName = pending.customerName || "고객";

        if (!orderUserId || !customerId) {
          setError("로그인 정보가 없습니다. 다시 로그인 후 시도해주세요.");
          navigate("/signin");
          return;
        }

        // 고객 정보가 없으면 생성/갱신
        if (customerEmail) {
          const { error: customerUpsertError } = await supabase
            .from("customers")
            .upsert(
              {
                id: customerId,
                email: customerEmail,
                name: customerName,
              },
              { onConflict: "id" },
            );

          if (customerUpsertError) {
            console.error("Customer upsert error:", customerUpsertError);
          }
        }

        const baseOrderPayload = {
          user_id: orderUserId,
          total_amount: pending.amount,
          status: "결제완료",
          shipping_name: customerName,
          payment_method: "카드",
          payment_id: paymentKey,
        };

        let createdOrder: { id: string } | null = null;
        let insertError: { code?: string; message?: string } | null = null;

        const withCustomerId = await supabase
          .from("orders")
          .insert({
            ...baseOrderPayload,
            customer_id: customerId,
          })
          .select("id")
          .single();

        createdOrder = withCustomerId.data;
        insertError = withCustomerId.error as { code?: string; message?: string } | null;

        // 일부 DB는 customer_id 컬럼이 없을 수 있으므로 user_id 기반으로 재시도
        if (insertError && (insertError.message || "").includes("customer_id")) {
          const withoutCustomerId = await supabase
            .from("orders")
            .insert(baseOrderPayload)
            .select("id")
            .single();

          createdOrder = withoutCustomerId.data;
          insertError = withoutCustomerId.error as { code?: string; message?: string } | null;
        }

        if (insertError) {
          console.error("Order insert error:", insertError);
          setError("주문 내역 저장에 실패했습니다. 고객센터로 문의해주세요.");
          return;
        }

        if (pending.items?.length > 0) {
          const orderItemsPayload = pending.items.map((item) => ({
            order_id: createdOrder!.id,
            product_id: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          }));

          const { error: orderItemsError } = await supabase
            .from("order_items")
            .insert(orderItemsPayload);

          if (orderItemsError) {
            console.error("Order items insert error:", orderItemsError);
            setError("주문 상품 저장에 실패했습니다. 고객센터로 문의해주세요.");
            return;
          }

          // 결제 완료 후 재고 차감
          for (const item of pending.items) {
            const { data: currentProduct, error: productError } = await supabase
              .from("products")
              .select("stock")
              .eq("id", item.id)
              .maybeSingle();

            if (productError || !currentProduct) {
              console.error("Product lookup error:", productError);
              continue;
            }

            const nextStock = Math.max(0, currentProduct.stock - item.quantity);
            const { error: stockError } = await supabase
              .from("products")
              .update({ stock: nextStock })
              .eq("id", item.id);

            if (stockError) {
              console.error("Stock update error:", stockError);
            }
          }
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


