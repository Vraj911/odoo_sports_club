import { cn } from "@/lib/cn";

/** Top-down tennis court, white 2px lines. Purely decorative. */
export function CourtLines({ opacity = 1, className }: { opacity?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 1000 460"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none text-chalk", className)}
      style={{ opacity }}
    >
      <g stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke">
        <rect x="10" y="10" width="980" height="440" vectorEffect="non-scaling-stroke" />
        <line x1="10" y1="65" x2="990" y2="65" vectorEffect="non-scaling-stroke" />
        <line x1="10" y1="395" x2="990" y2="395" vectorEffect="non-scaling-stroke" />
        <line x1="250" y1="65" x2="250" y2="395" vectorEffect="non-scaling-stroke" />
        <line x1="750" y1="65" x2="750" y2="395" vectorEffect="non-scaling-stroke" />
        <line x1="250" y1="230" x2="750" y2="230" vectorEffect="non-scaling-stroke" />
        <line x1="500" y1="0" x2="500" y2="460" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        <line x1="10" y1="230" x2="24" y2="230" vectorEffect="non-scaling-stroke" />
        <line x1="976" y1="230" x2="990" y2="230" vectorEffect="non-scaling-stroke" />
      </g>
    </svg>
  );
}
