import { Link } from "react-router-dom";
import { Product, formatPrice } from "@/data/products";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block bg-card overflow-hidden shadow-card hover:shadow-hover hover:-translate-y-2 transition-all duration-300 animate-fade-in opacity-0`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* 이미지 */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* 뱃지 (SALE/NEW) */}
        {product.badge && (
          <span
            className={`absolute top-3 left-3 px-2.5 py-1 text-xs font-bold text-white ${
              product.badge === "SALE" ? "bg-red-500" : "bg-blue-500"
            }`}
          >
            {product.badge}
          </span>
        )}
        {/* 카테고리 태그 */}
        <span className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground">
          {product.category}
        </span>
      </div>

      {/* 정보 */}
      <div className="p-4 md:p-5">
        <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <p className="text-sm md:text-base text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {product.description}
        </p>
        <p className="text-lg md:text-xl font-bold text-foreground">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
};

export default ProductCard;
