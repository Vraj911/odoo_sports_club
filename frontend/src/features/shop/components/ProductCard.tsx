import { Star, ShoppingCart, Sparkles, Trophy } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { cn } from "@/lib/cn";
import { formatINR } from "@/components/shared/Money";
import { StockBadge } from "./StockBadge";
import { CATEGORY_EMOJI } from "../types";
import { getTotalStock } from "../sampleData";
import type { Product } from "../types";

interface ProductCardProps {
  product: Product;
  basePath?: string; // "/shop" or "/app/shop"
}

export function ProductCard({ product, basePath = "/shop" }: ProductCardProps) {
  const totalStock = getTotalStock(product);
  const savings = product.mrp - product.basePrice;
  const savingsPercent = Math.round((savings / product.mrp) * 100);

  return (
    <AppLink to={`${basePath}/${product.slug}`}>
      <div
        className={cn(
          "group relative rounded-[20px] border border-chalk/14 bg-court-500 overflow-hidden transition-all duration-300",
          "hover:-translate-y-1 hover:border-chalk/28 hover:shadow-card cursor-pointer",
          totalStock === 0 && "opacity-60"
        )}
      >
        {/* Image area */}
        <div className="relative aspect-square bg-navy-800 flex items-center justify-center overflow-hidden">
          <span className="text-6xl opacity-70 group-hover:scale-110 transition-transform duration-500">
            {CATEGORY_EMOJI[product.category]}
          </span>

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-bold bg-volt-400 text-ink-900">
                <Sparkles className="size-3" />
                NEW
              </span>
            )}
            {product.isBestseller && (
              <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-bold bg-court-300 text-ink-900">
                <Trophy className="size-3" />
                BESTSELLER
              </span>
            )}
          </div>

          {savingsPercent > 0 && (
            <span className="absolute top-3 right-3 rounded-pill px-2.5 py-1 text-[10px] font-bold bg-success/90 text-ink-900">
              {savingsPercent}% OFF
            </span>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-chalk/50 uppercase tracking-wider">
                {product.brand}
              </p>
              <h3 className="text-sm font-semibold text-chalk leading-snug line-clamp-2 mt-0.5">
                {product.name}
              </h3>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "size-3",
                    i < Math.round(product.rating)
                      ? "fill-volt-400 text-volt-400"
                      : "text-chalk/20"
                  )}
                />
              ))}
            </div>
            <span className="text-[10px] text-chalk/50 font-mono">
              ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-2">
            <span className="text-lg font-bold text-volt-400 font-mono leading-none">
              {formatINR(product.basePrice)}
            </span>
            {savings > 0 && (
              <span className="text-xs text-chalk/40 line-through font-mono leading-none">
                {formatINR(product.mrp)}
              </span>
            )}
          </div>

          {/* Stock */}
          <StockBadge stock={totalStock} />

          {/* Variants hint */}
          {product.variantAxes.length > 0 && (
            <p className="text-[10px] text-chalk/40">
              {product.variantAxes.map((a) => `${a.options.length} ${a.label}s`).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </AppLink>
  );
}
