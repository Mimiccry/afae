import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroBanner = () => {
  return (
    <section className="relative w-full h-[60vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
      {/* 배경 이미지 */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="따뜻한 거실 인테리어"
          className="w-full h-full object-cover"
        />
        {/* 오버레이 */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent" />
      </div>

      {/* 콘텐츠 */}
      <div className="relative container mx-auto h-full flex items-center px-4">
        <div className="max-w-xl animate-slide-up">
          <p className="text-lg md:text-xl text-muted-foreground mb-2 md:mb-4">
            Welcome to Let's Go
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-tight mb-4 md:mb-6">
            따뜻한 집으로의
            <br />
            <span className="text-primary">출발, 레츠고</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 leading-relaxed">
            내 공간에 온기를 더하는 가구들,
            <br className="hidden md:block" />
            편안한 일상의 시작을 함께합니다.
          </p>
          <Button asChild variant="hero" size="lg">
            <Link to="/#products" className="group">
              상품 둘러보기
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
