import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type CourtLinesVariant = "full" | "corner" | "net-only" | "lines-faint";

interface CourtLinesProps {
  variant?: CourtLinesVariant | undefined;
  opacity?: number | undefined;
  animateDraw?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Top-down tennis court graphic drawn in 2px white strokes.
 */
export function CourtLines({
  variant = "full",
  opacity = 1,
  animateDraw = false,
  className,
}: CourtLinesProps) {
  const isFaint = variant === "lines-faint";
  const drawOpacity = isFaint ? 0.12 : opacity;

  const transitionConfig = { duration: 1.2, ease: [0.42, 0, 0.58, 1] as const };

  if (variant === "net-only") {
    return (
      <svg
        viewBox="0 0 1000 460"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden
        className={cn("pointer-events-none text-chalk", className)}
        style={{ opacity: drawOpacity }}
      >
        <defs>
          <pattern id="net-mesh-only" width="6" height="6" patternUnits="userSpaceOnUse">
            <path d="M 0 3 L 6 3 M 3 0 L 3 6" stroke="rgba(255,255,255,0.25)" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect x="495" y="10" width="10" height="440" fill="url(#net-mesh-only)" stroke="currentColor" strokeWidth="1" />
        <line x1="500" y1="0" x2="500" y2="460" stroke="currentColor" strokeWidth="2" />
        <line x1="250" y1="230" x2="750" y2="230" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (variant === "corner") {
    return (
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        fill="none"
        aria-hidden
        className={cn("pointer-events-none text-chalk", className)}
        style={{ opacity: drawOpacity }}
      >
        <g stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke">
          <line x1="20" y1="20" x2="380" y2="20" />
          <line x1="20" y1="20" x2="20" y2="380" />
          <line x1="20" y1="80" x2="380" y2="80" strokeDasharray="4 4" />
          <line x1="80" y1="20" x2="80" y2="380" />
          <line x1="200" y1="80" x2="200" y2="380" />
        </g>
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 1000 460"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      aria-hidden
      className={cn("pointer-events-none text-chalk", className)}
      style={{ opacity: drawOpacity }}
    >
      <defs>
        <pattern id="net-mesh" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M 0 4 L 8 4 M 4 0 L 4 8" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        </pattern>
      </defs>

      <g stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke">
        {animateDraw ? (
          <motion.rect
            x="10"
            y="10"
            width="980"
            height="440"
            rx="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={transitionConfig}
          />
        ) : (
          <rect x="10" y="10" width="980" height="440" rx="2" />
        )}

        <line x1="10" y1="65" x2="990" y2="65" />
        <line x1="10" y1="395" x2="990" y2="395" />
        <line x1="250" y1="65" x2="250" y2="395" />
        <line x1="750" y1="65" x2="750" y2="395" />
        <line x1="250" y1="230" x2="750" y2="230" />
        <line x1="10" y1="230" x2="26" y2="230" strokeWidth={2.5} />
        <line x1="974" y1="230" x2="990" y2="230" strokeWidth={2.5} />
        <rect x="494" y="8" width="12" height="444" fill="url(#net-mesh)" stroke="currentColor" strokeWidth="1.5" opacity={0.85} />
        <line x1="500" y1="2" x2="500" y2="458" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}
