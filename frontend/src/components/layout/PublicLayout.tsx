import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/shared/CommandPalette";
import type { RouteMeta } from "@/types/common";
import { cn } from "@/lib/cn";

export function PublicLayout({ route, children }: { route: RouteMeta; children: ReactNode }) {
  const isHome = route.path === "/";

  if (isHome) {
    return (
      <div className="flex min-h-screen flex-col bg-navy-950 text-chalk">
        <CommandPalette />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    );
  }

  const isFullBleed = [
    "/facilities",
    "/plans",
    "/availability",
    "/trial",
    "/contact",
  ].includes(route.path);

  return (
    <div className="flex min-h-screen flex-col bg-backdrop text-chalk">
      <CommandPalette />
      <PublicNavbar />
      <main className={cn("flex-1", !isFullBleed && "mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8")}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
