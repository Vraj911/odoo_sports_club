import { useState, useMemo } from "react";
import type { Product, ProductCategory, ProductVariant } from "../types";
import { CATEGORY_LABELS } from "../types";
import { useShopConsole } from "../shopStore";
import { SAMPLE_PRODUCTS } from "../sampleData";
import { POSTopBar } from "../components/POSTopBar";
import { ProductTile } from "../components/ProductTile";
import { VariantPickerModal } from "../components/VariantPickerModal";
import { POSCart } from "../components/POSCart";
import { ReceiptModal } from "../components/ReceiptModal";
import { StockInsufficientModal } from "../components/StockInsufficientModal";
import { Search, Barcode, Filter, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export default function ShopPOSPage() {
  const {
    posAddToCart,
    lastReceipt,
    clearLastReceipt,
  } = useShopConsole();

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");
  const [selectedSport, setSelectedSport] = useState<string>("all");

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [insufficientStockData, setInsufficientStockData] = useState<{
    open: boolean;
    message: string;
    orderNumber?: string;
  }>({ open: false, message: "" });

  // Filtered catalog
  const filteredProducts = useMemo(() => {
    let prods = [...SAMPLE_PRODUCTS];

    if (selectedCategory !== "all") {
      prods = prods.filter((p) => p.category === selectedCategory);
    }

    if (selectedSport !== "all") {
      prods = prods.filter((p) => p.sport === selectedSport);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      prods = prods.filter((p) => {
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesSku = p.variants.some((v) => v.sku.toLowerCase().includes(q));
        return matchesName || matchesBrand || matchesSku;
      });
    }

    return prods;
  }, [selectedCategory, selectedSport, searchQuery]);

  // Click on product in grid
  const handleSelectProduct = (product: Product) => {
    // If only 1 variant, try to add directly
    if (product.variants.length === 1) {
      const v = product.variants[0];
      const res = posAddToCart(product, v, 1);
      if (!res.ok) {
        if (res.error === "STOCK_INSUFFICIENT") {
          setInsufficientStockData({
            open: true,
            message: res.message || "Unit is reserved for an online order.",
            orderNumber: res.reservedOrderId,
          });
        } else {
          toast.error(res.message || "Out of stock.");
        }
      } else {
        toast.success(`Added ${product.name} to cart.`);
      }
      return;
    }

    // Open variant sheet
    setSelectedProduct(product);
    setIsVariantModalOpen(true);
  };

  // Add from Variant Picker
  const handleAddToCartFromModal = (
    product: Product,
    variant: ProductVariant,
    qty: number
  ) => {
    const res = posAddToCart(product, variant, qty);
    if (!res.ok) {
      if (res.error === "STOCK_INSUFFICIENT") {
        setInsufficientStockData({
          open: true,
          message: res.message || "Unit is reserved for an online order.",
          orderNumber: res.reservedOrderId,
        });
      }
    } else {
      toast.success(`Added ${product.name} (${qty}) to cart.`);
    }
    return res;
  };

  // Barcode / SKU scan submit
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Search by SKU exact match
    const q = searchQuery.trim().toLowerCase();
    for (const prod of SAMPLE_PRODUCTS) {
      const matchedVariant = prod.variants.find((v) => v.sku.toLowerCase() === q);
      if (matchedVariant) {
        const res = posAddToCart(prod, matchedVariant, 1);
        if (!res.ok) {
          if (res.error === "STOCK_INSUFFICIENT") {
            setInsufficientStockData({
              open: true,
              message: res.message || "Unit is reserved for an online order.",
              orderNumber: res.reservedOrderId,
            });
          } else {
            toast.error(res.message || "Out of stock.");
          }
        } else {
          toast.success(`Scanned: ${prod.name} (${matchedVariant.sku})`);
          setSearchQuery("");
        }
        return;
      }
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      {/* ─── Slim Top Bar ─── */}
      <POSTopBar activeModule="pos" />

      {/* ─── Main 1280x800 Tablet POS Workspace ─── */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 gap-4 p-3 sm:p-5 overflow-hidden min-h-0">
        {/* ─── Catalog (8 cols) ─── */}
        <section className="flex flex-col lg:col-span-8 h-full overflow-hidden rounded-[22px] border border-chalk/14 bg-court-600/60 p-4 sm:p-5 backdrop-blur-md">
          {/* Search SKU + Barcode Scan */}
          <div className="mb-3.5 flex items-center gap-2 sm:gap-3">
            <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog or scan SKU barcode... (Enter to ring up)"
                className="h-11 w-full rounded-pill border border-chalk/18 bg-white/8 pl-10 pr-10 text-xs sm:text-sm text-chalk placeholder:text-chalk/45 focus:border-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400/20"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-chalk/50 hover:text-chalk"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <Barcode className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/40" />
              )}
            </form>

            {/* Quick Sport Selector */}
            <div className="hidden sm:flex items-center gap-1 rounded-pill bg-chalk/6 p-1 border border-chalk/10">
              {["all", "tennis", "padel", "badminton"].map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSelectedSport(sp)}
                  className={cn(
                    "rounded-pill px-2.5 py-1 text-[11px] font-semibold capitalize transition-all",
                    selectedSport === sp
                      ? "bg-volt-400 text-ink-900 font-bold"
                      : "text-chalk/60 hover:text-chalk"
                  )}
                >
                  {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Category Chips Horizontal Track */}
          <div className="mb-4 flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "rounded-pill px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === "all"
                  ? "bg-chalk text-ink-900 shadow-sm"
                  : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14 hover:text-chalk"
              )}
            >
              All Items ({SAMPLE_PRODUCTS.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-pill px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-volt-400 text-ink-900 shadow-sm font-bold"
                    : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14 hover:text-chalk"
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* ProductTile Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center text-center text-chalk/50">
                <Search className="size-10 stroke-[1.5] mb-2 opacity-50" />
                <p className="text-sm font-semibold text-chalk">No products match search</p>
                <p className="text-xs text-chalk/60 mt-1">Try another keyword or clear category filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((prod) => (
                  <ProductTile
                    key={prod.id}
                    product={prod}
                    onSelect={handleSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Cart (4 cols, court-600) ─── */}
        <section className="lg:col-span-4 h-full overflow-hidden">
          <POSCart onChargeSuccess={() => setIsReceiptOpen(true)} />
        </section>
      </div>

      {/* ─── Variant Picker Sheet Modal ─── */}
      <VariantPickerModal
        product={selectedProduct}
        isOpen={isVariantModalOpen}
        onClose={() => {
          setIsVariantModalOpen(false);
          setSelectedProduct(null);
        }}
        onAddToCart={handleAddToCartFromModal}
      />

      {/* ─── Stock Insufficient / Online Reserved Warning Modal ─── */}
      <StockInsufficientModal
        isOpen={insufficientStockData.open}
        onClose={() => setInsufficientStockData({ open: false, message: "" })}
        message={insufficientStockData.message}
        orderNumber={insufficientStockData.orderNumber}
      />

      {/* ─── Receipt Modal on White Paper ─── */}
      <ReceiptModal
        receipt={lastReceipt}
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          clearLastReceipt();
        }}
      />
    </div>
  );
}
