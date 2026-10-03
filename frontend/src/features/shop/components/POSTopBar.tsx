import { useState } from "react";
import { AppLink, useGo } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import {
  Zap,
  Package,
  ArrowLeft,
  Boxes,
  Tags,
  Truck,
  Undo2,
  Wrench,
  BarChart3,
  PackagePlus,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useShopConsole } from "../shopStore";
import { cn } from "@/lib/cn";

interface POSTopBarProps {
  activeModule?:
    | "pos"
    | "quick"
    | "orders"
    | "inventory"
    | "restock"
    | "products"
    | "purchase-orders"
    | "returns"
    | "restring"
    | "reports";
  onQuickSaleToggle?: () => void;
}

export function POSTopBar({ activeModule = "pos" }: POSTopBarProps) {
  const { user } = useAuth();
  const go = useGo();
  const { pendingOrdersCount, lowStockCount } = useShopConsole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { key: "pos", label: "POS Register", href: "/shop-console", icon: Zap },
    { key: "quick", label: "Quick Sale", href: "/shop-console/quick", icon: Zap },
    { key: "inventory", label: "Inventory", href: "/shop-console/inventory", icon: Boxes },
    { key: "products", label: "Products", href: "/shop-console/products", icon: Tags },
    {
      key: "orders",
      label: "Orders",
      href: "/shop-console/orders",
      icon: Package,
      badge: pendingOrdersCount,
    },
    {
      key: "restock",
      label: "Restock",
      href: "/shop-console/restock",
      icon: PackagePlus,
      badge: lowStockCount,
      badgeDanger: true,
    },
    { key: "purchase-orders", label: "Purchase Orders", href: "/shop-console/purchase-orders", icon: Truck },
    { key: "returns", label: "Returns", href: "/shop-console/returns", icon: Undo2 },
    { key: "restring", label: "Restring", href: "/shop-console/restring", icon: Wrench },
    { key: "reports", label: "Reports", href: "/shop-console/reports", icon: BarChart3 },
  ];

  const handleExit = () => {
    if (user?.role === "ADMIN") {
      go("/owner");
    } else if (user?.groups?.includes("FRONT_DESK")) {
      go("/desk");
    } else {
      go("/staff");
    }
  };

  const exitLabel = user?.role === "ADMIN" ? "Admin" : user?.groups?.includes("FRONT_DESK") ? "Desk" : "Exit";
  const currentLink = navLinks.find((l) => l.key === activeModule) || navLinks[0];

  return (
    <header className="sticky top-0 z-30 flex h-[64px] w-full items-center justify-between border-b border-chalk/14 bg-navy-950/95 px-3 sm:px-5 backdrop-blur-md">
      {/* Left: Exit + Brand + Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={handleExit}
          className="flex items-center gap-1 rounded-lg border border-chalk/18 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-chalk/80 hover:bg-white/10 hover:text-white transition-colors"
          title={`Exit to ${exitLabel}`}
        >
          <ArrowLeft className="size-3.5" />
          <span className="hidden sm:inline">{exitLabel}</span>
        </button>

        <div className="h-5 w-px bg-chalk/14 hidden sm:block" />

        <div className="flex items-center gap-2">
          <Logo variant="icon" size={24} />
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">
              Pro Shop
            </span>
            <span className="hidden xl:inline-block text-[10px] uppercase font-bold text-volt-400 bg-volt-400/15 border border-volt-400/30 px-1.5 py-0.5 rounded-full">
              Console
            </span>
          </div>
        </div>
      </div>

      {/* Center: Evenly-spaced, clean horizontal navigation tabs */}
      <nav
        className="hidden md:flex items-center gap-1 px-2 overflow-x-auto scrollbar-none max-w-[calc(100vw-360px)]"
        aria-label="Shop Navigation"
      >
        {navLinks.map((link) => {
          const isActive = activeModule === link.key;
          const Icon = link.icon;
          return (
            <AppLink
              key={link.key}
              to={link.href}
              className={cn(
                "relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all whitespace-nowrap shrink-0",
                isActive
                  ? "bg-volt-400 text-ink-900 font-bold shadow-sm"
                  : "text-chalk/75 hover:bg-white/8 hover:text-white"
              )}
            >
              <Icon className={cn("size-3.5 shrink-0", isActive ? "text-ink-900" : "text-chalk/60")} />
              <span>{link.label}</span>
              {link.badge && link.badge > 0 ? (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none",
                    isActive
                      ? "bg-ink-900 text-volt-400"
                      : link.badgeDanger
                      ? "bg-danger text-white"
                      : "bg-volt-400 text-ink-900"
                  )}
                >
                  {link.badge}
                </span>
              ) : null}
            </AppLink>
          );
        })}
      </nav>

      {/* Mobile/Tablet Tab Selector Dropdown for smaller viewports */}
      <div className="relative md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-1.5 rounded-lg border border-chalk/18 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white"
        >
          <span>{currentLink.label}</span>
          <ChevronDown className="size-3.5 text-chalk/60" />
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-full mt-1.5 left-0 z-50 w-52 rounded-xl border border-chalk/14 bg-navy-900 p-1.5 shadow-xl">
            {navLinks.map((link) => {
              const isActive = activeModule === link.key;
              const Icon = link.icon;
              return (
                <AppLink
                  key={link.key}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-volt-400 text-ink-900 font-bold"
                      : "text-chalk/80 hover:bg-white/8 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 shrink-0" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && link.badge > 0 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none",
                        isActive
                          ? "bg-ink-900 text-volt-400"
                          : link.badgeDanger
                          ? "bg-danger text-white"
                          : "bg-volt-400 text-ink-900"
                      )}
                    >
                      {link.badge}
                    </span>
                  ) : null}
                </AppLink>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Staff Info + Live Status */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-chalk/12 bg-white/5 px-2.5 py-1.5 text-xs text-chalk/80">
          <User className="size-3.5 text-volt-400" />
          <span className="font-semibold text-white truncate max-w-[120px]">{user?.name || "Staff"}</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-400">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden xl:inline">Live</span>
        </div>
      </div>
    </header>
  );
}
