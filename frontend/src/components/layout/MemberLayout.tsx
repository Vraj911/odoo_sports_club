import type { ReactNode } from "react";
import { Bell, CalendarPlus, Home, ListChecks, ShoppingBag, User } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import type { RouteMeta } from "@/types/common";

const NAV = [
  ["/app", "Home", Home],
  ["/app/book", "Book", CalendarPlus],
  ["/app/shop", "Shop", ShoppingBag],
  ["/app/bookings", "Bookings", ListChecks],
  ["/app/profile", "Profile", User],
] as const;

export function MemberLayout({ children }: { route: RouteMeta; children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <AppLink to="/app" aria-label="Member home"><Logo size={28} /></AppLink>
        <nav className="hidden gap-5 text-sm text-chalk/80 md:flex" aria-label="Member">
          {NAV.map(([to, l]) => <AppLink key={to} to={to} className="hover:text-chalk">{l}</AppLink>)}
        </nav>
        <AppLink to="/app/notifications" aria-label="Notifications"><Bell className="size-5" /></AppLink>
      </header>
      <main>{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t border-line bg-navy-950 py-2 md:hidden" aria-label="Bottom">
        {NAV.map(([to, l, Icon]) => (
          <AppLink key={to} to={to} className="flex flex-col items-center text-xs text-chalk/70">
            <Icon className="size-5" aria-hidden />{l}
          </AppLink>
        ))}
      </nav>
    </div>
  );
}
