import { Home } from "lucide-react";
import { CourtLines } from "@/components/brand/CourtLines";
import { AppLink } from "@/app/router/links";

export default function NotFound() {
  return (
    <section className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center">
      <div className="relative w-full">
        <CourtLines opacity={0.35} className="w-full" />
        <span className="absolute right-[4%] top-[8%] size-4 rounded-pill bg-volt-400 shadow-volt" aria-hidden />
      </div>
      <p className="mt-8 text-sm font-medium uppercase tracking-widest text-volt-400">404 · Out of bounds</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">That shot landed outside the lines.</h1>
      <AppLink
        to="/"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-pill bg-volt-400 px-6 text-sm font-medium text-ink-900 hover:bg-volt-500"
      >
        <Home className="size-4" aria-hidden /> Back home
      </AppLink>
    </section>
  );
}
