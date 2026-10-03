import { AppLink, useGo } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import { Zap, Package, Radio, ArrowLeft, Boxes, Tags, Truck, Undo2, Wrench, BarChart3, PackagePlus } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useShopConsole } from "../shopStore";
import { cn } from "@/lib/cn";

interface POSTopBarProps {
  activeModule?: "pos" | "quick" | "orders" | "inventory" | "restock" | "products" | "purchase-orders" | "returns" | "restring" | "reports";
  onQuickSaleToggle?: () => void;
}

export function POSTopBar({ activeModule = "pos" }: POSTopBarProps) {
  const { user } = useAuth();
  const go = useGo();
  const { pendingOrdersCount, lowStockCount } = useShopConsole();

  const navLinks = [
    { key: "pos", label: "Counter POS", href: "/shop-console", icon: Zap },
    { key: "quick", label: "Quick Sale ⚡", href: "/shop-console/quick", icon: Zap },
    { key: "orders", label: `Orders (${pendingOrdersCount})`, href: "/shop-console/orders", icon: Package, badge: pendingOrdersCount },
    { key: "inventory", label: "Inventory", href: "/shop-console/inventory", icon: Boxes },
    { key: "restock", label: "Restock", href: "/shop-console/restock", icon: PackagePlus, badge: lowStockCount, badgeDanger: true },
    { key: "products", label: "Products", href: "/shop-console/products", icon: Tags },
    { key: "purchase-orders", label: "POs", href: "/shop-console/purchase-orders", icon: Truck },
    { key: "returns", label: "Returns", href: "/shop-console/returns", icon: Undo2 },
    { key: "restring", label: "Restring", href: "/shop-console/restring", icon: Wrench },
    { key: "reports", label: "Reports", href: "/shop-console/reports", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-chalk/14 bg-navy-950/95 px-4 sm:px-6 backdrop-blur-md">
      {/* Left: Brand + Title + Shift Staff */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        <button
          onClick={() => go("/desk/overview")}
          className="flex items-center gap-1.5 rounded-pill border border-chalk/14 bg-chalk/6 px-2.5 py-1 text-xs font-medium text-chalk/80 hover:bg-chalk/12 hover:text-chalk transition-colors"
          title="Exit to Front Desk Console"
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden md:inline">Exit POS</span>
        </button>

        <div className="flex items-center gap-2">
          <Logo variant="icon" size={24} />
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-wide text-chalk uppercase">Pro Shop POS</h1>
            <p className="text-[10px] text-chalk/60">
              Shift: Morning · Staff: <span className="text-volt-300 font-semibold">{user?.name || "Vikram Cashier"}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Center: Module Navigation Pills */}
      <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 px-2 rounded-pill bg-chalk/6 border border-chalk/10">
        {navLinks.map((link) => {
          const isActive = activeModule === link.key;
          return (
            <AppLink
              key={link.key}
              to={link.href}
              className={cn(
                "relative flex h-8 items-center gap-1.5 rounded-pill px-3 text-xs font-medium transition-all",
                isActive
                  ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                  : "text-chalk/75 hover:bg-chalk/10 hover:text-chalk"
              )}
            >
              <span>{link.label}</span>
              {link.badge && link.badge > 0 && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.2 text-[9px] font-extrabold",
                    isActive
                      ? "bg-ink-900 text-volt-400"
                      : link.badgeDanger
                      ? "bg-danger text-white"
                      : "bg-volt-400 text-ink-900"
                  )}
                >
                  {link.badge}
                </span>
              )}
            </AppLink>
          );
        })}
      </nav>

      {/* Right: Quick Sale CTA + Live Pulse + Orders Shortcut (for smaller screens) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <AppLink
          to="/shop-console/quick"
          className="flex h-9 items-center gap-1.5 rounded-pill bg-volt-400 px-3 text-xs font-bold text-ink-900 shadow-md hover:bg-volt-500 active:scale-95 transition-all"
        >
          <Zap className="size-3.5 fill-current" />
          <span>Quick Sale ⚡</span>
        </AppLink>

        <AppLink
          to="/shop-console/orders"
          className="relative flex h-9 items-center gap-1.5 rounded-pill border border-chalk/18 bg-chalk/8 px-3 text-xs font-semibold text-chalk hover:bg-chalk/14 transition-colors"
        >
          <Package className="size-3.5" />
          <span className="hidden sm:inline">Orders</span>
          {pendingOrdersCount > 0 && (
            <span className="rounded-full bg-volt-400 px-1.5 py-0.5 text-[10px] font-black text-ink-900">
              {pendingOrdersCount}
            </span>
          )}
        </AppLink>

        {/* Live Indicator */}
        <div className="flex items-center gap-1.5 rounded-pill border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden xl:inline">Live Sync</span>
        </div>
      </div>
    </header>
  );
}
