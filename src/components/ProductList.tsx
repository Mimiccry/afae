import { useState, useEffect, useMemo } from "react";
import { products } from "@/data/products";
import ProductCard from "./ProductCard";
import ProductCardSkeleton from "./ProductCardSkeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryFilter = "전체" | "소파" | "테이블" | "전등";
type SortOption = "latest" | "price-low" | "price-high";

const ProductList = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedProducts, setLoadedProducts] = useState<typeof products>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("전체");
  const [sortOption, setSortOption] = useState<SortOption>("latest");

  useEffect(() => {
    // 로딩 시뮬레이션 (1초 후 데이터 로드)
    const timer = setTimeout(() => {
      setLoadedProducts(products);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 카테고리, 검색어, 정렬 옵션에 따라 상품 필터링 및 정렬
  const filteredProducts = useMemo(() => {
    let filtered = loadedProducts;

    // 카테고리 필터링
    if (selectedCategory !== "전체") {
      filtered = loadedProducts.filter((product) => {
        const categoryMap: Record<CategoryFilter, (p: typeof products[0]) => boolean> = {
          전체: () => true,
          소파: (p) => p.name.includes("소파") || p.category === "거실",
          테이블: (p) => p.name.includes("테이블") || p.category === "테이블" || p.category === "다이닝",
          전등: (p) => p.name.includes("조명") || p.name.includes("전등") || p.category === "조명",
        };
        return categoryMap[selectedCategory](product);
      });
    }

    // 검색어 필터링
    if (searchQuery.trim()) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 정렬
    const sorted = [...filtered].sort((a, b) => {
      switch (sortOption) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "latest":
        default:
          // ID 순서대로 (원본 배열 순서)
          return parseInt(a.id) - parseInt(b.id);
      }
    });

    return sorted;
  }, [loadedProducts, searchQuery, selectedCategory, sortOption]);

  const categories: CategoryFilter[] = ["전체", "소파", "테이블", "전등"];

  return (
    <section id="products" className="py-12 md:py-20 gradient-warm">
      <div className="container mx-auto px-4">
        {/* 섹션 헤더 */}
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 md:mb-4">
            오늘의 추천 상품
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            당신의 공간에 따뜻함을 더해줄 특별한 가구들
          </p>
        </div>

        {/* 검색창 */}
        <div className="mb-6 md:mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="상품 이름으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* 정렬 드롭다운 */}
        <div className="mb-6 md:mb-8 flex justify-center">
          <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">최신순</SelectItem>
              <SelectItem value="price-low">낮은 가격순</SelectItem>
              <SelectItem value="price-high">높은 가격순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 카테고리 필터 버튼 */}
        <div className="mb-8 md:mb-10 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "min-w-20",
                selectedCategory === category && "bg-primary text-primary-foreground"
              )}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {isLoading
            ? // 로딩 중: 스켈레톤 카드 표시
              Array.from({ length: 5 }).map((_, index) => (
                <ProductCardSkeleton key={`skeleton-${index}`} />
              ))
            : // 로딩 완료: 필터링된 상품 카드 표시
              filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
        </div>

        {/* 검색 결과 없음 */}
        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              "{searchQuery}"에 해당하는 상품을 찾을 수 없습니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductList;
