import { cn } from "@/lib/cn";

export function NoiseOverlay({ opacity = 0.03, className }: { opacity?: number; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 z-10 select-none overflow-hidden", className)}
      style={{ opacity }}
    >
      <svg className="h-full w-full">
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noiseFilter)" />
      </svg>
    </div>
  );
}
