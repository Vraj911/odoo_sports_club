import { useState } from "react";
import type { Product, ProductVariant } from "../types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Money } from "@/components/shared/Money";
import { getVariantStockDetail } from "../shopStore";
import { Plus, Minus, AlertCircle, Check, ShoppingCart, Lock } from "lucide-react";
import { cn } from "@/lib/cn";

interface VariantPickerModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    variant: ProductVariant,
    qty: number
  ) => { ok: boolean; error?: string; message?: string; reservedOrderId?: string };
}

export function VariantPickerModal({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: VariantPickerModalProps) {
  if (!product) return null;

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ""
  );
  const [quantity, setQuantity] = useState(1);
  const [errorBanner, setErrorBanner] = useState<{ message: string; orderId?: string } | null>(
    null
  );

  const selectedVariant =
    product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];

  const detail = selectedVariant ? getVariantStockDetail(selectedVariant.id) : null;

  const handleVariantChange = (variantId: string) => {
    setSelectedVariantId(variantId);
    setQuantity(1);
    setErrorBanner(null);
  };

  const handleAdd = () => {
    if (!selectedVariant) return;
    const res = onAddToCart(product, selectedVariant, quantity);
    if (!res.ok) {
      setErrorBanner({
        message: res.message || "Cannot add item to cart.",
        orderId: res.reservedOrderId,
      });
    } else {
      onClose();
      setErrorBanner(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setErrorBanner(null);
        onClose();
      }}
      title={
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-5 text-volt-400" />
          <span>Select Variant</span>
        </div>
      }
      subtitle={`${product.brand} · ${product.name}`}
      maxWidth="max-w-xl"
    >
      <div className="flex flex-col gap-5 text-chalk">
        {/* Reservation Error Banner */}
        {errorBanner && (
          <div className="rounded-xl border border-danger/40 bg-danger/16 p-3.5 text-xs text-danger-fg flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="size-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-300">STOCK INSUFFICIENT</p>
              <p className="mt-0.5 text-white/90">{errorBanner.message}</p>
              {errorBanner.orderId && (
                <p className="mt-1 font-semibold text-volt-300">
                  Online Order #{errorBanner.orderId} is awaiting collection in the orders queue.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Product Summary Row */}
        <div className="flex items-center gap-4 rounded-[16px] bg-court-600/70 p-3.5 border border-chalk/10">
          <img
            src={product.images[0]}
            alt={product.name}
            className="size-16 rounded-xl object-contain bg-navy-950/60 p-1 border border-chalk/10 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm truncate">{product.name}</h4>
            <p className="text-xs text-chalk/60 truncate">{product.description}</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-bold text-volt-400">
                <Money amount={selectedVariant?.price ?? product.basePrice} />
              </span>
              {product.mrp > product.basePrice && (
                <span className="text-xs text-chalk/40 line-through">
                  <Money amount={product.mrp} />
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Variants List with Live Stock & Reserved Breakdown */}
        <div>
          <label className="text-xs font-semibold text-chalk/80 uppercase tracking-wider block mb-2">
            Available Variants ({product.variants.length})
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {product.variants.map((v) => {
              const vDetail = getVariantStockDetail(v.id);
              const isSelected = v.id === selectedVariantId;
              const isOut = vDetail.available <= 0;

              const label =
                Object.entries(v.axes)
                  .map(([k, val]) => `${k}: ${val}`)
                  .join(", ") || "Standard Spec";

              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleVariantChange(v.id)}
                  className={cn(
                    "flex flex-col justify-between rounded-[14px] border p-3 text-left transition-all relative",
                    isSelected
                      ? "border-volt-400 bg-volt-400/10 shadow-sm"
                      : "border-chalk/14 bg-court-700/50 hover:border-chalk/30",
                    isOut && !isSelected && "opacity-60"
                  )}
                >
                  <div className="flex items-center justify-between gap-1 w-full">
                    <span className="text-xs font-bold text-chalk">{label}</span>
                    {isSelected && <Check className="size-4 text-volt-400 shrink-0" />}
                  </div>

                  <div className="mt-2 text-[11px] text-chalk/60 flex items-center justify-between w-full">
                    <span className="font-mono text-[10px] text-chalk/50">{v.sku}</span>
                    <span className="font-bold text-chalk/90">
                      <Money amount={v.price} />
                    </span>
                  </div>

                  {/* Stock & Reserved Tag */}
                  <div className="mt-2 pt-2 border-t border-chalk/8 flex items-center justify-between text-[11px]">
                    <span
                      className={cn(
                        "font-semibold",
                        vDetail.available > 3
                          ? "text-emerald-400"
                          : vDetail.available > 0
                          ? "text-amber-400"
                          : "text-red-400"
                      )}
                    >
                      Available {vDetail.available}
                    </span>

                    {vDetail.reserved > 0 && (
                      <span className="flex items-center gap-1 text-[10px] text-volt-300 font-medium">
                        <Lock className="size-2.5" />
                        <span>({vDetail.reserved} reserved)</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quantity Stepper */}
        {detail && detail.available > 0 && (
          <div className="flex items-center justify-between rounded-[14px] bg-court-700/50 p-3 border border-chalk/10">
            <div>
              <span className="text-xs font-semibold text-chalk block">Select Quantity</span>
              <span className="text-[11px] text-chalk/60">
                Max {detail.available} unit{detail.available > 1 ? "s" : ""} available
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex size-9 items-center justify-center rounded-pill border border-chalk/20 bg-chalk/10 text-chalk hover:bg-chalk/18 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <span className="w-8 text-center text-sm font-bold text-volt-300">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(detail.available, q + 1))}
                disabled={quantity >= detail.available}
                className="flex size-9 items-center justify-center rounded-pill border border-chalk/20 bg-chalk/10 text-chalk hover:bg-chalk/18 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="mt-2 flex items-center justify-end gap-3 pt-2 border-t border-chalk/10">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleAdd}
            disabled={!detail || detail.available <= 0}
            className="px-6"
          >
            <ShoppingCart className="size-4 mr-2" />
            <span>Add to Cart ({quantity})</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
