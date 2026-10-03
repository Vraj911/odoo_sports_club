import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  ShoppingCart,
  Zap,
  Check,
  ShieldCheck,
  RotateCcw,
  Truck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { AppLink, useAppNavigate } from "@/app/router/links";
import { Button } from "@/components/ui/Button";
import { Money, formatINR } from "@/components/shared/Money";
import { StockBadge } from "../components/StockBadge";
import { MemberDiscountBanner } from "../components/MemberDiscountBanner";
import { useShop } from "../shopStore";
import { useAuth } from "@/app/providers/AuthProvider";
import { useMember } from "@/features/member/memberStore";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_EMOJI, CATEGORY_LABELS, TIER_DISCOUNTS } from "../types";
import type { MemberTier, ProductVariant } from "../types";
import { cn } from "@/lib/cn";

export default function ProductDetailPage({
  params,
}: {
  params?: Record<string, string> | undefined;
}) {
  const navigate = useAppNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { profile } = useMember();
  const { getProductBySlug, addToCart, getVariantStock } = useShop();

  const isMemberApp = typeof window !== "undefined" && window.location.pathname.startsWith("/app");
  const backShopPath = isMemberApp ? "/app/shop" : "/shop";
  const cartPath = isMemberApp ? "/app/cart" : "/cart";
  const checkoutPath = isMemberApp ? "/app/checkout" : "/checkout";

  const slug =
    params?.["slug"] ??
    (typeof window !== "undefined" ? window.location.pathname.split("/").pop() ?? "" : "");

  const product = getProductBySlug(slug);

  // Active image index
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Selected variant state: axisKey -> selectedValue
  const [selectedAxes, setSelectedAxes] = useState<Record<string, string>>(() => {
    if (!product || product.variants.length === 0) return {};
    return { ...product.variants[0]!.axes };
  });

  const [quantity, setQuantity] = useState<number>(1);
  const [showSpecsAccordion, setShowSpecsAccordion] = useState(true);
  const [showShippingAccordion, setShowShippingAccordion] = useState(false);

  // Match selected variant
  const currentVariant: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    return (
      product.variants.find((v) =>
        Object.entries(selectedAxes).every(([axis, val]) => v.axes[axis] === val)
      ) ?? product.variants[0]
    );
  }, [product, selectedAxes]);

  if (!product || !currentVariant) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-2xl font-bold text-chalk">Product Not Found</h2>
        <p className="text-sm text-chalk/60">
          The item "{slug}" may have been moved or is no longer listed in our Pro Shop catalog.
        </p>
        <AppLink to={backShopPath}>
          <Button variant="secondary" leftIcon={<ArrowLeft className="size-4" />}>
            Back to Pro Shop
          </Button>
        </AppLink>
      </div>
    );
  }

  // Stock for the selected variant
  const availableStock = getVariantStock(currentVariant.id, currentVariant.stock);

  // Pricing calculations
  const effectivePrice = currentVariant.price;
  const savings = Math.max(0, product.mrp - effectivePrice);
  const savingsPercent = Math.round((savings / product.mrp) * 100);

  // Member Tier discount preview
  const isMember = user?.primaryRole === "MEMBER";
  const memberTier: MemberTier = isMember ? (profile.tier as MemberTier) || "Gold" : "Gold";
  const tierDiscountPercent = TIER_DISCOUNTS[memberTier].percent;
  const memberDiscountAmount = Math.round(effectivePrice * (tierDiscountPercent / 100));
  const memberNetPrice = effectivePrice - memberDiscountAmount;

  const handleAxisSelect = (axisKey: string, optionValue: string) => {
    const next = { ...selectedAxes, [axisKey]: optionValue };
    setSelectedAxes(next);
    setQuantity(1); // reset quantity when variant changes
  };

  const handleAddToCart = () => {
    if (availableStock <= 0) {
      toast.error("Out of Stock", "This variant is currently out of stock.");
      return;
    }
    const success = addToCart(product, currentVariant, quantity);
    if (success) {
      toast.success(
        "Added to Cart",
        `${quantity}x ${product.name} (${Object.values(currentVariant.axes).join(" / ")}) reserved for 10:00 mins.`
      );
    } else {
      toast.error("Stock Limit Exceeded", "Cannot reserve more items than current stock on hand.");
    }
  };

  const handleBuyNow = () => {
    if (availableStock <= 0) return;
    const success = addToCart(product, currentVariant, quantity);
    if (success) {
      navigate(checkoutPath);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4 sm:px-6 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-chalk/60 pt-2">
        <AppLink to={backShopPath} className="hover:text-volt-400 flex items-center gap-1">
          <ArrowLeft className="size-3.5" />
          <span>Pro Shop</span>
        </AppLink>
        <span>/</span>
        <span className="capitalize">{CATEGORY_LABELS[product.category]}</span>
        <span>/</span>
        <span className="text-chalk truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery & Badges (5 cols) */}
        <div className="md:col-span-5 space-y-4">
          {/* Main Visual Display */}
          <div className="relative aspect-square rounded-[28px] border border-chalk/14 bg-navy-900 flex items-center justify-center overflow-hidden shadow-card">
            <span className="text-8xl select-none transform hover:scale-105 transition-transform duration-500">
              {CATEGORY_EMOJI[product.category]}
            </span>

            {/* Overlay Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isNew && (
                <span className="rounded-pill bg-volt-400 px-3 py-1 text-xs font-bold text-ink-900 flex items-center gap-1 shadow-sm">
                  <Sparkles className="size-3.5" /> NEW
                </span>
              )}
              {product.isBestseller && (
                <span className="rounded-pill bg-court-400 px-3 py-1 text-xs font-bold text-ink-900">
                  TOP PICK
                </span>
              )}
            </div>

            {savingsPercent > 0 && (
              <span className="absolute top-4 right-4 rounded-pill bg-success px-3 py-1 text-xs font-bold text-ink-900">
                {savingsPercent}% OFF
              </span>
            )}

            <div className="absolute bottom-3 left-4 text-[11px] text-chalk/40 font-mono">
              SKU: {currentVariant.sku}
            </div>
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIdx(idx)}
                  className={cn(
                    "size-18 rounded-2xl border flex items-center justify-center bg-navy-800 transition-all",
                    activeImageIdx === idx
                      ? "border-volt-400 ring-2 ring-volt-400/30"
                      : "border-chalk/10 opacity-70 hover:opacity-100"
                  )}
                >
                  <span className="text-2xl">{CATEGORY_EMOJI[product.category]}</span>
                </button>
              ))}
            </div>
          )}

          {/* Guarantee Badges */}
          <div className="rounded-2xl border border-chalk/10 bg-court-600/40 p-4 grid grid-cols-2 gap-3 text-xs text-chalk/70">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-volt-400" />
              <span>100% Genuine Gear</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="size-4 text-volt-400" />
              <span>Free Club Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="size-4 text-volt-400" />
              <span>7-Day Return Policy</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-volt-400" />
              <span>Same-Day Stringing</span>
            </div>
          </div>
        </div>

        {/* Right Column: Details, Variants & Actions (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          {/* Brand & Title */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-chalk/50 font-mono">
              {product.brand} · {product.sport.toUpperCase()}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-chalk mt-1 leading-tight">
              {product.name}
            </h1>

            {/* Ratings Bar */}
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "size-4",
                      i < Math.round(product.rating)
                        ? "fill-volt-400 text-volt-400"
                        : "text-chalk/20"
                    )}
                  />
                ))}
                <span className="text-xs font-bold text-chalk ml-1">{product.rating}</span>
              </div>
              <span className="text-chalk/30">|</span>
              <span className="text-xs text-chalk/60 font-mono">
                {product.reviewCount} customer reviews
              </span>
              <span className="text-chalk/30">|</span>
              <StockBadge stock={availableStock} />
            </div>
          </div>

          {/* Pricing Box */}
          <div className="rounded-2xl border border-chalk/14 bg-court-500/80 p-5 space-y-3">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-volt-400 font-mono">
                {formatINR(effectivePrice)}
              </span>
              {savings > 0 && (
                <>
                  <span className="text-base text-chalk/40 line-through font-mono">
                    {formatINR(product.mrp)}
                  </span>
                  <span className="text-xs font-bold text-success bg-success/15 px-2 py-0.5 rounded-pill border border-success/30">
                    Save {formatINR(savings)} ({savingsPercent}%)
                  </span>
                </>
              )}
            </div>
            <p className="text-[11px] text-chalk/50">
              *Inclusive of all GST taxes (18% HSN Code 9506). Invoiced with club serial numbers.
            </p>

            {/* Member price showcase */}
            <div className="pt-3 border-t border-chalk/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-volt-400" />
                <span className="text-xs font-semibold text-chalk">
                  {isMember ? `${memberTier} Member Price:` : "Club Member Price:"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-base font-bold text-volt-400 font-mono">
                  {formatINR(memberNetPrice)}
                </span>
                <span className="text-[10px] text-chalk/60 ml-1.5 font-medium">
                  ({tierDiscountPercent}% discount applied)
                </span>
              </div>
            </div>
          </div>

          {/* Variant Selectors */}
          {product.variantAxes.map((axis) => {
            const axisKey = axis.label.toLowerCase().includes("size")
              ? "size"
              : axis.label.toLowerCase().includes("color")
              ? "color"
              : axis.label.toLowerCase().includes("grip")
              ? "grip"
              : axis.label.toLowerCase().includes("tension")
              ? "tension"
              : axis.label.toLowerCase();

            const selectedValue = selectedAxes[axisKey];

            return (
              <div key={axis.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider">
                    {axis.label}:{" "}
                    <span className="text-volt-400 font-mono normal-case">{selectedValue}</span>
                  </label>
                  {axis.label.toLowerCase().includes("grip") && (
                    <span className="text-[11px] text-chalk/40 hover:text-chalk cursor-pointer underline flex items-center gap-1">
                      <Info className="size-3" /> Grip Guide
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {axis.options.map((opt) => {
                    const isSelected = selectedValue === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAxisSelect(axisKey, opt)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-medium border transition-all",
                          isSelected
                            ? "bg-volt-400 text-ink-900 border-volt-400 font-bold shadow-sm"
                            : "bg-white/6 text-chalk/80 border-chalk/14 hover:border-chalk/30 hover:bg-white/10"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Quantity & CTA Action Buttons */}
          <div className="pt-2 space-y-4">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-xs text-chalk/60 font-medium">Quantity</label>
                <div className="flex items-center rounded-xl border border-chalk/20 bg-white/5 p-1 h-11">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="size-8 rounded-lg flex items-center justify-center text-chalk/80 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-chalk text-sm">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= availableStock}
                    onClick={() => setQuantity((q) => Math.min(availableStock, q + 1))}
                    className="size-8 rounded-lg flex items-center justify-center text-chalk/80 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-xs text-chalk/50 pt-5">
                {availableStock > 0 ? (
                  <span>
                    Max <strong className="text-chalk font-mono">{availableStock}</strong> units available
                  </span>
                ) : (
                  <span className="text-danger">Currently out of stock</span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                size="lg"
                disabled={availableStock <= 0}
                onClick={handleAddToCart}
                className="w-full shadow-volt"
                leftIcon={<ShoppingCart className="size-4" />}
              >
                {availableStock <= 0 ? "Out of Stock" : "Add to Cart"}
              </Button>

              <Button
                variant="secondary"
                size="lg"
                disabled={availableStock <= 0}
                onClick={handleBuyNow}
                className="w-full"
                leftIcon={<Zap className="size-4 text-volt-400" />}
              >
                Buy Now
              </Button>
            </div>

            <p className="text-[11px] text-chalk/50 text-center sm:text-left">
              ⏱ Stock is automatically reserved for 10 minutes upon adding to cart to prevent sell-outs.
            </p>
          </div>

          {/* Description & Accordions */}
          <div className="pt-4 border-t border-chalk/10 space-y-3">
            {/* Description */}
            <div className="rounded-2xl border border-chalk/10 bg-court-600/30 p-4 space-y-2">
              <h4 className="text-xs font-bold text-chalk uppercase tracking-wider">Overview</h4>
              <p className="text-xs sm:text-sm text-chalk/80 leading-relaxed">
                {product.description}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {product.features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-chalk/70">
                    <Check className="size-3.5 text-volt-400 shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specifications Accordion */}
            <div className="rounded-2xl border border-chalk/10 bg-court-600/30 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSpecsAccordion((v) => !v)}
                className="w-full p-4 flex items-center justify-between text-xs font-bold text-chalk uppercase tracking-wider hover:bg-white/5"
              >
                <span>Technical Specifications</span>
                {showSpecsAccordion ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              {showSpecsAccordion && (
                <div className="p-4 pt-0 border-t border-chalk/10">
                  <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                    <span className="text-chalk/50">Brand</span>
                    <span className="text-chalk font-semibold">{product.brand}</span>

                    <span className="text-chalk/50">Sport Category</span>
                    <span className="text-chalk font-semibold capitalize">{product.sport}</span>

                    <span className="text-chalk/50">Item Category</span>
                    <span className="text-chalk font-semibold">{CATEGORY_LABELS[product.category]}</span>

                    <span className="text-chalk/50">Variant SKU</span>
                    <span className="text-chalk font-mono">{currentVariant.sku}</span>

                    <span className="text-chalk/50">HSN Code</span>
                    <span className="text-chalk font-mono">9506.99.90</span>

                    <span className="text-chalk/50">Warranty</span>
                    <span className="text-chalk">1 Year Manufacturer Warranty</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
