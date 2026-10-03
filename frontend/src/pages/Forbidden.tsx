import { ShieldX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { AppLink } from "@/app/router/links";

export default function Forbidden() {
  return (
    <section className="mx-auto max-w-xl px-4 py-24">
      <EmptyState
        icon={<ShieldX className="size-6" />}
        title="403 · Not your court"
        description="Your role doesn't have access to this area. Switch role or head back."
        action={
          <AppLink to="/" className="inline-flex h-10 items-center rounded-pill bg-volt-400 px-5 text-sm font-medium text-ink-900 hover:bg-volt-500">
            Back home
          </AppLink>
        }
      />
    </section>
  );
}
