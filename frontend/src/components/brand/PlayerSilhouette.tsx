import { cn } from "@/lib/cn";

interface PlayerSilhouetteProps {
  variant?: "left" | "right" | "single" | undefined;
  className?: string | undefined;
}

export function PlayerSilhouette({ variant = "left", className }: PlayerSilhouetteProps) {
  if (variant === "single") {
    return <PlayerGraphic className={className} flip={false} />;
  }

  return (
    <div className={cn("pointer-events-none relative", className)}>
      {variant === "left" && <PlayerGraphic className={className} flip={false} />}
      {variant === "right" && <PlayerGraphic className={className} flip={true} />}
    </div>
  );
}

function PlayerGraphic({ flip = false, className }: { flip?: boolean | undefined; className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={cn("size-28 sm:size-36 overflow-visible pointer-events-none drop-shadow-xl", className)}
      style={{ transform: flip ? "scaleX(-1) rotate(15deg)" : "rotate(-10deg)" }}
    >
      <defs>
        <filter id="shadow-skew" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
          <feOffset dx="16" dy="24" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#shadow-skew)">
        <g transform="translate(100, 30) rotate(35)">
          <ellipse cx="25" cy="0" rx="14" ry="19" fill="none" stroke="#d5f63a" strokeWidth="2.5" />
          <line x1="16" y1="-12" x2="34" y2="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="34" y1="-12" x2="16" y2="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <line x1="11" y1="0" x2="-8" y2="0" stroke="#ffffff" strokeWidth="3" />
          <rect x="-14" y="-2" width="8" height="4" rx="1" fill="#16233f" />
        </g>

        <path d="M 45 70 Q 75 45 92 38" fill="none" stroke="#fce7f3" strokeWidth="6" strokeLinecap="round" />
        <path d="M 45 70 Q 25 55 15 50" fill="none" stroke="#fce7f3" strokeWidth="5.5" strokeLinecap="round" />

        <circle cx="48" cy="65" r="11" fill="#3b0764" />
        <circle cx="48" cy="67" r="9" fill="#fce7f3" />

        <path
          d="M 32 75 C 32 70, 64 70, 64 75 L 68 105 C 68 110, 28 110, 28 105 Z"
          fill="#ffffff"
          stroke="#2c5aa6"
          strokeWidth="1.5"
        />
        <path d="M 32 75 Q 48 85 64 75" fill="none" stroke="#d5f63a" strokeWidth="3" />

        <path d="M 36 108 L 26 138" stroke="#fce7f3" strokeWidth="7" strokeLinecap="round" />
        <path d="M 60 108 L 74 140" stroke="#fce7f3" strokeWidth="7" strokeLinecap="round" />

        <rect x="30" y="104" width="36" height="16" rx="4" fill="#0f1a33" />

        <ellipse cx="23" cy="141" rx="5" ry="8" fill="#ffffff" transform="rotate(-15 23 141)" />
        <ellipse cx="77" cy="143" rx="5" ry="8" fill="#d5f63a" transform="rotate(20 77 143)" />
      </g>
    </svg>
  );
}
