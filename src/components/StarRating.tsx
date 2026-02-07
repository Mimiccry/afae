import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
}

const StarRating = ({ value, onChange, maxRating = 5 }: StarRatingProps) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= (hoveredRating || value);

        return (
          <button
            key={index}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoveredRating(starValue)}
            onMouseLeave={() => setHoveredRating(0)}
            className="focus:outline-none"
            aria-label={`${starValue}점`}
          >
            <Star
              className={cn(
                "w-6 h-6 transition-colors",
                isFilled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              )}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;


