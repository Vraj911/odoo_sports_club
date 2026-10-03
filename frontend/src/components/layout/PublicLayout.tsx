import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { AppLink } from "@/app/router/links";
import { Logo } from "@/components/brand/Logo";
import { useDisclosure } from "@/hooks/useDisclosure";
import { CLUB_NAME } from "@/lib/constants";
import type { RouteMeta } from "@/types/common";

const LINKS = [
  ["/facilities", "Facilities"],
  ["/plans", "Plans"],
  ["/availability", "This Week"],
  ["/shop", "Shop"],
  ["/contact", "Contact"],
] as const;

export function PublicLayout({ children }: { route: RouteMeta; children: ReactNode }) {
  const menu = useDisclosure();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <AppLink to="/" aria-label="Home"><Logo /></AppLink>
        <nav className="hidden gap-6 text-sm text-chalk/80 md:flex" aria-label="Main">
          {LINKS.map(([to, l]) => <AppLink key={to} to={to} className="hover:text-chalk">{l}</AppLink>)}
        </nav>
        <div className="flex items-center gap-3">
          <AppLink to="/login" className="hidden text-sm sm:inline">Login</AppLink>
          <AppLink to="/app/book" className="rounded-pill bg-volt-400 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-volt-500">Book a Court</AppLink>
          <button className="md:hidden" aria-label="Open menu" onClick={menu.toggle}><Menu className="size-5" /></button>
        </div>
      </header>
      {menu.isOpen && (
        <nav className="flex flex-col gap-3 px-6 pb-4 md:hidden" aria-label="Mobile">
          {LINKS.map(([to, l]) => <AppLink key={to} to={to} onClick={menu.close}>{l}</AppLink>)}
          <AppLink to="/login" onClick={menu.close}>Login</AppLink>
        </nav>
      )}
      <main className="flex-1">{children}</main>
      <footer className="mt-12 bg-court-700 px-6 py-8 text-center text-xs text-chalk/60">
        © {new Date().getFullYear()} {CLUB_NAME} · bookmycourt
      </footer>
    </div>
  );
}
