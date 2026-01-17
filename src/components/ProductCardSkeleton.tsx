/**
 * 상품 카드 로딩 중 표시되는 스켈레톤 컴포넌트
 * ProductCard와 동일한 구조의 회색 박스로 펄스 애니메이션 적용
 */
const ProductCardSkeleton = () => {
  return (
    <div className="block bg-card overflow-hidden shadow-card">
      {/* 이미지 스켈레톤 */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <div className="w-full h-full bg-gray-300 animate-pulse" />
      </div>

      {/* 정보 스켈레톤 */}
      <div className="p-4 md:p-5">
        {/* 제목 스켈레톤 */}
        <div className="h-6 md:h-7 bg-gray-300 rounded animate-pulse mb-2 w-3/4" />
        
        {/* 설명 스켈레톤 */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-300 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-300 rounded animate-pulse w-5/6" />
        </div>
        
        {/* 가격 스켈레톤 */}
        <div className="h-6 md:h-7 bg-gray-300 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
};

export default ProductCardSkeleton;


