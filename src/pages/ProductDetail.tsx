import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ShoppingCart, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Layout from "@/components/Layout";
import StarRating from "@/components/StarRating";
import { getProductById, formatPrice } from "@/data/products";
import { useCartStore } from "@/stores/cartStore";
import { requestTossPayment } from "@/lib/tossPayments";
import toast from "react-hot-toast";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = getProductById(id || "");
  const addToCart = useCartStore((state) => state.addToCart);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            상품을 찾을 수 없습니다
          </h1>
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="w-5 h-5 mr-2" />
              홈으로 돌아가기
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    });
    toast.success("성공!");
  };

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      toast.success("주소가 복사되었습니다.");
    } catch (err) {
      toast.error("주소 복사에 실패했습니다.");
    }
  };

  const handlePurchase = async () => {
    await requestTossPayment({
      amount: product.price,
      orderName: product.name,
      items: [
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1,
        },
      ],
    });
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("별점을 선택해주세요.");
      return;
    }
    if (!reviewText.trim()) {
      toast.error("리뷰 내용을 입력해주세요.");
      return;
    }
    // 리뷰 제출 로직 (추후 구현)
    toast.success("리뷰가 등록되었습니다.");
    setRating(0);
    setReviewText("");
  };

  return (
    <>
      <Helmet>
        <title>{`${product.name} - Let's Go`}</title>
        <meta name="description" content={product.description} />
      </Helmet>
      <Layout>
        <div className="container mx-auto px-4 py-8 md:py-12">
          {/* 뒤로가기 */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 md:mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-base">돌아가기</span>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
            {/* 이미지 */}
            <div className="relative aspect-square bg-muted overflow-hidden shadow-soft animate-fade-in">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground">
                {product.category}
              </span>
            </div>

            {/* 정보 */}
            <div className="flex flex-col justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
                  상품 ID: {id}
                </h1>
                <Button
                  onClick={handleShare}
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  aria-label="공유하기"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-8">
                {product.description}
              </p>

              {/* 가격 */}
              <div className="mb-8 md:mb-10">
                <p className="text-sm text-muted-foreground mb-1">가격</p>
                <p className="text-3xl md:text-4xl font-bold text-foreground">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* 장바구니 버튼 */}
              <div className="flex flex-col gap-3 w-full md:w-auto">
                <Button
                  onClick={handlePurchase}
                  variant="hero"
                  size="xl"
                  className="w-full md:w-auto"
                >
                  구매하기
                </Button>
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  size="xl"
                  className="w-full md:w-auto"
                >
                  <ShoppingCart className="w-6 h-6" />
                  장바구니 담기
                </Button>
              </div>

              {/* 추가 정보 */}
              <div className="mt-8 md:mt-10 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                  <div>
                    <p className="text-muted-foreground">배송</p>
                    <p className="font-medium text-foreground">무료배송</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">배송 소요</p>
                    <p className="font-medium text-foreground">3-5일 이내</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 리뷰 작성 폼 */}
          <div className="mt-16 md:mt-20 pt-8 border-t border-border">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 md:mb-8">
              리뷰 작성
            </h2>
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rating" className="text-base font-medium">
                  별점
                </Label>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="review" className="text-base font-medium">
                  리뷰 내용
                </Label>
                <Textarea
                  id="review"
                  placeholder="상품에 대한 리뷰를 작성해주세요..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="min-h-32 resize-none"
                />
              </div>
              <Button type="submit" variant="hero" size="lg">
                리뷰 등록
              </Button>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default ProductDetail;
