import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { useShopConsole } from "../shopStore";
import { SAMPLE_PRODUCTS } from "../sampleData";
import { Money } from "@/components/shared/Money";
import { ReceiptModal } from "../components/ReceiptModal";
import { StockInsufficientModal } from "../components/StockInsufficientModal";
import {
  Zap,
  Banknote,
  QrCode,
  CreditCard,
  Plus,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { useAuth } from "@/app/providers/AuthProvider";

interface QuickItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  icon: string;
  color: string;
  sku: string;
  productId: string;
  variantId: string;
}

export default function ShopQuickSalePage() {
  const { user } = useAuth();
  const {
    products,
    inventoryList,
    posAddToCart,
    chargePOSCart,
    lastReceipt,
    clearLastReceipt,
  } = useShopConsole();

  const [activeItem, setActiveItem] = useState<QuickItem | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [insufficientData, setInsufficientData] = useState<{
    open: boolean;
    message: string;
    orderNumber?: string;
  }>({ open: false, message: "" });

  // Curated high-velocity pins derived from live inventory
  const quickPins: QuickItem[] = useMemo(() => {
    const candidates = inventoryList.filter(
      (i) =>
        i.category === "grips" ||
        i.category === "balls" ||
        i.category === "strings" ||
        i.category === "accessories"
    );

    if (candidates.length > 0) {
      const colors = [
        "from-blue-600/30 to-indigo-600/30 border-blue-500/40",
        "from-amber-600/30 to-yellow-600/30 border-amber-500/40",
        "from-emerald-600/30 to-teal-600/30 border-emerald-500/40",
        "from-red-600/30 to-rose-600/30 border-red-500/40",
        "from-cyan-600/30 to-blue-600/30 border-cyan-500/40",
        "from-purple-600/30 to-violet-600/30 border-purple-500/40",
        "from-lime-600/30 to-emerald-600/30 border-lime-500/40",
        "from-pink-600/30 to-rose-600/30 border-pink-500/40",
      ];
      const icons: Record<string, string> = {
        grips: "🤝",
        balls: "🎾",
        strings: "🧵",
        accessories: "🏅",
        rackets: "🏸",
      };

      return candidates.slice(0, 8).map((item, idx) => ({
        id: `QP-${idx + 1}`,
        name: `${item.productName} (${item.variantLabel})`,
        brand: item.brand,
        category: item.category.toUpperCase(),
        price: item.price,
        icon: icons[item.category] || "⚡",
        color: colors[idx % colors.length]!,
        sku: item.sku,
        productId: item.productId,
        variantId: item.variantId,
      }));
    }

    return [
      {
        id: "QP-1",
        name: "Yonex Super Grap (Pack of 3)",
        brand: "Yonex",
        category: "Grip",
        price: 399,
        icon: "🏸",
        color: "from-blue-600/30 to-indigo-600/30 border-blue-500/40",
        sku: "YNX-AC102-WHT",
        productId: "a0000001-0000-0000-0000-000000000030",
        variantId: "b0000001-0000-0000-0000-000000000040",
      },
    ];
  }, [inventoryList]);

  // Single tap opens quick checkout sheet
  const handleTapItem = (item: QuickItem) => {
    // Find corresponding product and variant from live products
    const prod = products.find((p) => p.id === item.productId) || products[0];
    if (!prod) return;
    const variant = prod.variants.find((v) => v.id === item.variantId) || prod.variants[0];
    if (!variant) return;

    const res = posAddToCart(prod, variant, 1);
    if (!res.ok) {
      if (res.error === "STOCK_INSUFFICIENT") {
        setInsufficientData({
          open: true,
          message: res.message || "Item reserved for online order.",
          orderNumber: res.reservedOrderId,
        });
      } else {
        toast.error(res.message || "Out of stock.");
      }
      return;
    }

    setActiveItem(item);
    setIsPaymentModalOpen(true);
  };

  // One-tap quick payment execution
  const handleQuickPay = (method: "CASH" | "UPI" | "CARD") => {
    if (!activeItem) return;

    const staffName = user?.name || "Vikram Staff";
    chargePOSCart({
      paymentMethod: method,
      staffName,
      upiRef: method === "UPI" ? `UPI-QUICK-${Date.now().toString().slice(-4)}` : undefined,
      cardRef: method === "CARD" ? `CARD-QUICK-${Date.now().toString().slice(-4)}` : undefined,
    });

    setIsPaymentModalOpen(false);
    setIsReceiptOpen(true);
    toast.success(`Quick Sale charged: ₹${activeItem.price} via ${method}`);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="quick" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Title & Info Banner */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-pill bg-volt-400 text-ink-900 font-black">
                <Zap className="size-4 fill-current" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Quick-Sale Express POS
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              One-tap sales for match essentials (strings, balls, grips, sweatbands). Designed for 10-second checkouts.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-pill bg-chalk/8 border border-chalk/14 px-3 py-1.5 text-xs text-chalk/70">
            <Clock className="size-3.5 text-volt-400" />
            <span>Target Checkout: &lt; 15 seconds</span>
          </div>
        </div>

        {/* 8 Giant 180px Quick-Sale Tiles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {quickPins.map((pin) => (
            <button
              key={pin.id}
              type="button"
              onClick={() => handleTapItem(pin)}
              className={cn(
                "group relative flex h-48 flex-col justify-between overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:scale-[0.97] bg-gradient-to-br",
                pin.color
              )}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl filter drop-shadow-md">{pin.icon}</span>
                <span className="rounded-pill bg-black/40 px-2 py-0.5 text-[10px] font-mono text-chalk/80">
                  {pin.category}
                </span>
              </div>

              <div>
                <p className="text-[11px] font-bold text-chalk/70 uppercase tracking-wider">
                  {pin.brand}
                </p>
                <h3 className="line-clamp-2 text-base font-bold text-chalk group-hover:text-volt-300 transition-colors">
                  {pin.name}
                </h3>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-chalk/10">
                <span className="text-xl font-black text-volt-400">
                  <Money amount={pin.price} />
                </span>
                <span className="flex size-9 items-center justify-center rounded-pill bg-volt-400 text-ink-900 font-bold group-hover:bg-volt-300 transition-colors shadow-md">
                  <Zap className="size-4 fill-current" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* ─── Instant Payment Sheet Modal ─── */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Zap className="size-5 text-volt-400" />
            <span>Instant One-Tap Charge</span>
          </div>
        }
        subtitle={activeItem ? `${activeItem.name} · ₹${activeItem.price}` : ""}
        maxWidth="max-w-md"
      >
        {activeItem && (
          <div className="space-y-4 text-chalk">
            <div className="rounded-xl border border-chalk/14 bg-court-700/60 p-4 text-center">
              <span className="text-3xl block mb-1">{activeItem.icon}</span>
              <p className="font-bold text-base text-chalk">{activeItem.name}</p>
              <p className="text-2xl font-black text-volt-400 mt-1">
                <Money amount={activeItem.price} />
              </p>
              <p className="text-[11px] text-chalk/50 mt-0.5">GST 18% inclusive · Walk-in customer</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-chalk/70 uppercase tracking-wider block">
                Tap Payment Method to Complete
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPay("CASH")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-emerald-500/40 bg-emerald-500/10 p-3 hover:bg-emerald-500/20 active:scale-95 transition-all text-emerald-300 font-bold"
                >
                  <Banknote className="size-6" />
                  <span className="text-xs">CASH</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPay("UPI")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-volt-400/40 bg-volt-400/10 p-3 hover:bg-volt-400/20 active:scale-95 transition-all text-volt-300 font-bold"
                >
                  <QrCode className="size-6" />
                  <span className="text-xs">UPI QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPay("CARD")}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-[16px] border border-blue-500/40 bg-blue-500/10 p-3 hover:bg-blue-500/20 active:scale-95 transition-all text-blue-300 font-bold"
                >
                  <CreditCard className="size-6" />
                  <span className="text-xs">CARD</span>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Receipt Modal ─── */}
      <ReceiptModal
        receipt={lastReceipt}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          clearLastReceipt();
        }}
      />

      {/* ─── Stock Insufficient Warning ─── */}
      <StockInsufficientModal
        isOpen={insufficientData.open}
        onClose={() => setInsufficientData({ open: false, message: "" })}
        message={insufficientData.message}
        orderNumber={insufficientData.orderNumber}
      />
    </div>
  );
}
