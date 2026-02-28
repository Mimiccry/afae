import { Link } from "react-router-dom";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { useCartStore } from "@/stores/cartStore";
import { formatPrice } from "@/data/products";
import { requestTossPayment } from "@/lib/tossPayments";
import { toast } from "react-hot-toast";

const Cart = () => {
  const items = useCartStore((state) => state.items || []);
  const clearCart = useCartStore((state) => state.clearCart);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeFromCart = useCartStore((state) => state.removeFromCart);
  const getTotalPrice = useCartStore((state) => state.getTotalPrice);
  const totalPrice = getTotalPrice ? (getTotalPrice() || 0) : 0;
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("장바구니가 비어있습니다.");
      return;
    }

    setIsProcessing(true);
    try {
      await requestTossPayment({
        amount: totalPrice,
        orderName: `장바구니 상품 ${items.length}건`,
        items,
      });
      // 결제창으로 이동 성공 시점에서는 장바구니를 비우지 않고,
      // 성공 페이지에서 최종 비우도록 유지
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("결제창 호출에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  };

  // items가 없거나 배열이 아닌 경우 처리
  const isEmpty = !items || !Array.isArray(items) || items.length === 0;

  if (isEmpty) {
    return (
      <>
        <Helmet>
          <title>장바구니 - Let's Go</title>
        </Helmet>
        <Layout>
          <div className="container mx-auto px-4 py-20 text-center">
            <ShoppingBag className="w-20 h-20 mx-auto text-muted-foreground mb-6" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              장바구니가 비어있습니다
            </h1>
            <p className="text-muted-foreground mb-8">
              마음에 드는 상품을 장바구니에 담아보세요
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/">
                쇼핑 계속하기
              </Link>
            </Button>
          </div>
        </Layout>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`장바구니 (${items.length}) - Let's Go`}</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8 md:mb-10">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                장바구니
              </h1>
            </div>
            <Button
              onClick={clearCart}
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
            >
              전체 삭제
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            {/* 상품 목록 */}
            <div className="lg:col-span-2 space-y-4">
              {items && Array.isArray(items) && items.map((item, index) => {
                if (!item || !item.id) return null;
                
                return (
                  <div
                    key={item.id}
                    className="flex gap-4 md:gap-6 p-4 md:p-6 bg-card shadow-card animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* 이미지 */}
                    <Link
                      to={`/product/${item.id}`}
                      className="shrink-0 w-24 h-24 md:w-32 md:h-32 bg-muted overflow-hidden rounded"
                    >
                      <img
                        src={item.image || '/placeholder.svg'}
                        alt={item.name || '상품'}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.svg';
                        }}
                      />
                    </Link>

                    {/* 정보 */}
                    <div className="flex-1 flex flex-col">
                      <Link
                        to={`/product/${item.id}`}
                        className="text-lg md:text-xl font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {item.name || '상품명 없음'}
                      </Link>
                      <p className="text-base md:text-lg font-bold text-foreground mt-1">
                        {item.price ? formatPrice(item.price) : '가격 정보 없음'}
                      </p>

                      {/* 수량 조절 */}
                    <div className="flex items-center justify-between mt-auto pt-4">
                      <div className="flex items-center border border-border">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                          aria-label="수량 감소"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                          aria-label="수량 증가"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* 주문 요약 */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 p-6 md:p-8 bg-card shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">주문 요약</h2>
                
                <div className="space-y-4 mb-6 pb-6 border-b border-border">
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">상품 금액</span>
                    <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-muted-foreground">배송비</span>
                    <span className="font-medium text-primary">무료</span>
                  </div>
                </div>

                <div className="flex justify-between text-lg md:text-xl font-bold mb-6">
                  <span className="text-foreground">총 결제 금액</span>
                  <span className="text-foreground">{formatPrice(totalPrice)}</span>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      처리 중...
                    </>
                  ) : (
                    "구매하기"
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center mt-4">
                  주문 시 이용약관에 동의하게 됩니다
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default Cart;
