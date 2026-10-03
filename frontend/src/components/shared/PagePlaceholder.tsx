import { Construction } from "lucide-react";
import { CourtLines } from "@/components/brand/CourtLines";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusPill } from "@/components/ui/StatusPill";
import type { PageProps } from "@/types/common";

/** Labelled stub rendered by every route until its phase is built. */
export default function PagePlaceholder({ route, params }: PageProps) {
  const Icon = route.icon;
  const paramEntries = Object.entries(params);
  return (
    <section className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <CourtLines opacity={0.08} className="absolute inset-0 -z-0 h-full w-full" />
      <div className="relative flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Phase {route.phase}</Badge>
          <code className="rounded-pill border border-line px-2.5 py-0.5 text-xs text-chalk/70">{route.path}</code>
          {route.srsIds.map((id) => (
            <StatusPill key={id} tone="volt">{id}</StatusPill>
          ))}
        </div>
        <EmptyState
          icon={<Icon className="size-6" />}
          title={route.title}
          description={
            <div className="flex flex-col gap-3">
              <p>Coming in Phase {route.phase}.</p>
              <p className="text-xs text-chalk/60">
                Access: {route.access.length ? route.access.join(" · ") : "Public"}
              </p>
              {paramEntries.length > 0 && (
                <p className="text-xs text-chalk/60">
                  Params: {paramEntries.map(([k, v]) => `${k}=${v}`).join(", ")}
                </p>
              )}
            </div>
          }
          action={<StatusPill tone="warning"><Construction className="size-3" aria-hidden /> Placeholder</StatusPill>}
        />
      </div>
    </section>
  );
}
