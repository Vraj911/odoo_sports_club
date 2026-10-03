import { useMemo } from "react";
import type { Product } from "../types";
import { Money } from "@/components/shared/Money";
import { getVariantStockDetail } from "../shopStore";
import { Check, AlertTriangle, X, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/cn";

interface ProductTileProps {
  product: Product;
  onSelect: (product: Product) => void;
  className?: string;
}

export function ProductTile({ product, onSelect, className }: ProductTileProps) {
  // Aggregate stock across all variants
  const stockSummary = useMemo(() => {
    let totalOnHand = 0;
    let totalReserved = 0;
    let totalAvailable = 0;

    product.variants.forEach((v) => {
      const detail = getVariantStockDetail(v.id);
      totalOnHand += detail.onHand;
      totalReserved += detail.reserved;
      totalAvailable += detail.available;
    });

    return {
      onHand: totalOnHand,
      reserved: totalReserved,
      available: totalAvailable,
    };
  }, [product]);

  const isOutOfStock = stockSummary.available <= 0;
  const isLowStock = stockSummary.available > 0 && stockSummary.available <= 3;

  return (
    <div
      onClick={() => onSelect(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(product);
        }
      }}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-[20px] border border-chalk/14 bg-court-500 p-3.5 text-left transition-all duration-200 hover:-translate-y-1 hover:border-volt-400/50 hover:shadow-lg active:scale-[0.98] cursor-pointer",
        isOutOfStock && "opacity-80",
        className
      )}
    >
      <div>
        {/* Large 120px image preview */}
        <div className="relative mb-3 flex h-[120px] w-full items-center justify-center overflow-hidden rounded-[14px] bg-navy-950/60 p-2">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />

          {/* Top-Right Stock Status Chip */}
          <div className="absolute top-2 right-2">
            {isOutOfStock ? (
              <span className="flex items-center gap-1 rounded-pill bg-danger/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <X className="size-3" />
                <span>0</span>
              </span>
            ) : isLowStock ? (
              <span className="flex items-center gap-1 rounded-pill bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-ink-900 shadow-sm">
                <AlertTriangle className="size-3" />
                <span>{stockSummary.available}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-pill bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                <Check className="size-3" />
                <span>{stockSummary.available}</span>
              </span>
            )}
          </div>

          {/* Reserved badge if online reservations exist */}
          {stockSummary.reserved > 0 && (
            <div className="absolute bottom-2 left-2 rounded-pill bg-volt-400/20 border border-volt-400/40 px-2 py-0.5 text-[9px] font-bold text-volt-300 backdrop-blur-md">
              {stockSummary.reserved} reserved online
            </div>
          )}
        </div>

        {/* Product Brand & Category */}
        <div className="flex items-center justify-between text-[11px] font-medium text-chalk/60 uppercase tracking-wider mb-1">
          <span className="truncate">{product.brand}</span>
          <span className="text-[10px] lowercase text-volt-300/80">
            {product.variants.length} {product.variants.length === 1 ? "var" : "vars"}
          </span>
        </div>

        {/* Product Name */}
        <h3 className="line-clamp-2 text-sm font-semibold text-chalk group-hover:text-volt-300 transition-colors">
          {product.name}
        </h3>
      </div>

      {/* Bottom Bar: Price & Available Breakdown */}
      <div className="mt-3 pt-2.5 border-t border-chalk/10 flex items-center justify-between">
        <div>
          <span className="text-base font-bold text-volt-400">
            <Money amount={product.basePrice} />
          </span>
          {product.mrp > product.basePrice && (
            <span className="ml-1.5 text-[11px] text-chalk/40 line-through">
              <Money amount={product.mrp} />
            </span>
          )}
        </div>

        <button
          type="button"
          tabIndex={-1}
          aria-label={`Select ${product.name}`}
          className="flex size-8 items-center justify-center rounded-pill bg-chalk/10 text-chalk group-hover:bg-volt-400 group-hover:text-ink-900 transition-colors"
        >
          <ShoppingCart className="size-4" />
        </button>
      </div>
    </div>
  );
}
