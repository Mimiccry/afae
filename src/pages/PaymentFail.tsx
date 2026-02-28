import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { TOSS_PENDING_ORDER_KEY } from "@/lib/tossPayments";

const PaymentFail = () => {
  // 실패 시 pending 정보는 남겨두어 사용자가 다시 결제할 때 활용 가능
  // 필요하면 여기서 sessionStorage.removeItem(TOSS_PENDING_ORDER_KEY)로 정리 가능

  return (
    <>
      <Helmet>
        <title>결제 실패 - Let's Go</title>
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="flex flex-col items-center gap-3">
              <AlertTriangle className="w-12 h-12 text-destructive" />
              <h1 className="text-3xl font-bold">결제에 실패했습니다</h1>
              <p className="text-muted-foreground">다시 시도하거나 장바구니로 돌아가주세요.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/cart">장바구니로 돌아가기</Link>
              </Button>
              <Button asChild>
                <Link to="/">메인으로</Link>
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              문제가 계속되면 고객센터로 문의해주세요. (pending key: {TOSS_PENDING_ORDER_KEY})
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PaymentFail;


