import { useState } from "react";
import { Star, ShoppingCart, Sparkles, Trophy, Check, X, AlertTriangle } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { cn } from "@/lib/cn";
import { formatINR } from "@/components/shared/Money";
import { CATEGORY_EMOJI } from "../types";
import { getTotalStock } from "../sampleData";
import { useShop } from "../shopStore";
import { useToast } from "@/components/ui/Toast";
import { VariantPickerModal } from "./VariantPickerModal";
import type { Product, ProductVariant } from "../types";

interface ProductCardProps {
  product: Product;
  basePath?: string; // "/shop" or "/app/shop"
}

export function ProductCard({ product, basePath = "/shop" }: ProductCardProps) {
  const toast = useToast();
  const { addToCart } = useShop();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const totalStock = getTotalStock(product);
  const savings = product.mrp - product.basePrice;
  const savingsPercent = Math.round((savings / product.mrp) * 100);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (totalStock <= 0) {
      toast.error("Out of Stock", "This product is currently out of stock.");
      return;
    }

    // If multiple variants exist, open variant picker
    if (product.variants && product.variants.length > 1) {
      setIsModalOpen(true);
      return;
    }

    // Single variant quick add
    const defaultVariant = product.variants[0];
    if (!defaultVariant) {
      toast.error("Unavailable", "Product has no available variant.");
      return;
    }

    const ok = addToCart(product, defaultVariant, 1);
    if (ok) {
      setJustAdded(true);
      toast.success("Added to Cart", `${product.name} added to your member cart.`);
      setTimeout(() => setJustAdded(false), 1500);
    } else {
      toast.error("Stock Limit", "Cannot add more items than available in stock.");
    }
  };

  const handleModalAddToCart = (
    prod: Product,
    variant: ProductVariant,
    qty: number
  ) => {
    const ok = addToCart(prod, variant, qty);
    if (ok) {
      setJustAdded(true);
      const axesStr = Object.values(variant.axes).filter(Boolean).join(" / ");
      toast.success(
        "Added to Cart",
        `${qty}x ${prod.name}${axesStr ? ` (${axesStr})` : ""} added to your cart.`
      );
      setTimeout(() => setJustAdded(false), 1500);
      return { ok: true };
    }
    return { ok: false, message: "Out of stock or unavailable." };
  };

  return (
    <>
      <AppLink to={`${basePath}/${product.slug}`}>
        <div
          className={cn(
            "group relative rounded-[20px] border border-chalk/14 bg-court-500 overflow-hidden transition-all duration-300",
            "hover:-translate-y-1 hover:border-volt-400/50 hover:shadow-card cursor-pointer flex flex-col justify-between h-full",
            totalStock === 0 && "opacity-75"
          )}
        >
          {/* Image area */}
          <div className="relative aspect-square bg-navy-800 flex items-center justify-center overflow-hidden">
            <span className="text-6xl opacity-70 group-hover:scale-110 transition-transform duration-500 select-none">
              {CATEGORY_EMOJI[product.category] || "🏸"}
            </span>

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              {product.isNew && (
                <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-bold bg-volt-400 text-ink-900 shadow-sm">
                  <Sparkles className="size-3" />
                  NEW
                </span>
              )}
              {product.isBestseller && (
                <span className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[10px] font-bold bg-court-300 text-ink-900 shadow-sm">
                  <Trophy className="size-3" />
                  BESTSELLER
                </span>
              )}
            </div>

            {/* Top-Right Stock Badge (Like POS Card) */}
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {savingsPercent > 0 && (
                <span className="rounded-pill px-2 py-0.5 text-[10px] font-bold bg-success/90 text-ink-900 shadow-sm">
                  {savingsPercent}% OFF
                </span>
              )}
              {totalStock === 0 ? (
                <span className="flex items-center gap-1 rounded-pill bg-danger/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <X className="size-3" />
                  <span>0</span>
                </span>
              ) : totalStock <= 3 ? (
                <span className="flex items-center gap-1 rounded-pill bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-ink-900 shadow-sm">
                  <AlertTriangle className="size-3" />
                  <span>{totalStock}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-pill bg-emerald-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  <Check className="size-3" />
                  <span>{totalStock}</span>
                </span>
              )}
            </div>
          </div>

          {/* Info area */}
          <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-medium text-chalk/50 uppercase tracking-wider">
                <span className="truncate">{product.brand}</span>
                <span className="text-[10px] lowercase text-volt-300/80 font-mono">
                  {product.variants.length} {product.variants.length === 1 ? "var" : "vars"}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-chalk group-hover:text-volt-300 transition-colors line-clamp-2">
                {product.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1.5 pt-0.5">
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
            </div>

            {/* Bottom Bar: Price & Add to Cart button */}
            <div className="pt-2.5 border-t border-chalk/10 flex items-center justify-between">
              <div>
                <span className="text-base font-bold text-volt-400 font-mono">
                  {formatINR(product.basePrice)}
                </span>
                {savings > 0 && (
                  <span className="ml-1.5 text-[11px] text-chalk/40 line-through font-mono">
                    {formatINR(product.mrp)}
                  </span>
                )}
              </div>

              {/* Quick Add to Cart button (like POS register) */}
              <button
                type="button"
                onClick={handleQuickAdd}
                aria-label={`Add ${product.name} to cart`}
                disabled={totalStock === 0}
                className={cn(
                  "flex size-9 items-center justify-center rounded-pill transition-all duration-200 z-10 shrink-0",
                  justAdded
                    ? "bg-emerald-500 text-white shadow-md scale-105"
                    : totalStock === 0
                    ? "bg-chalk/5 text-chalk/20 cursor-not-allowed"
                    : "bg-chalk/10 text-chalk hover:bg-volt-400 hover:text-ink-900 active:scale-90 shadow-sm"
                )}
                title={totalStock === 0 ? "Out of stock" : "Add to cart"}
              >
                {justAdded ? (
                  <Check className="size-4 stroke-[2.5]" />
                ) : (
                  <ShoppingCart className="size-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </AppLink>

      {/* Variant Picker Modal for items with multiple options */}
      <VariantPickerModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddToCart={handleModalAddToCart}
      />
    </>
  );
}
