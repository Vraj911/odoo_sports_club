import { CourtLines } from "@/components/brand/CourtLines";
import { Badge } from "@/components/ui/Badge";
import { CLUB_NAME } from "@/lib/constants";
import type { PageProps } from "@/types/common";

/** Temporary home (Phase 2 builds the real hero). */
export default function HomePlaceholder({ route }: PageProps) {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="relative mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center overflow-hidden rounded-frame border border-line bg-court-500 px-6 py-16 text-center shadow-card">
        <CourtLines opacity={0.5} className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)]" />
        <div className="relative flex flex-col items-center gap-4">
          <Badge>{CLUB_NAME} · Phase {route.phase}</Badge>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
            Serve. Dominate.
            <br />
            <span className="text-volt-400">Repeat.</span>
          </h1>
          <p className="max-w-md text-chalk/80">Placeholder home. The real hero arrives in Phase 2.</p>
        </div>
      </div>
    </section>
  );
}
