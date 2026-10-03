import type { ReactNode } from "react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { CommandPalette } from "@/components/shared/CommandPalette";
import type { RouteMeta } from "@/types/common";

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

  return (
    <div className="flex min-h-screen flex-col bg-backdrop text-chalk">
      <CommandPalette />
      <PublicNavbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
