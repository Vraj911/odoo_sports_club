import logoAsset from "@/assets/logo/bookmycourt-logo.png.asset.json";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/cn";

/** Icon region inside the uploaded 1024×1024 logo (px). */
const ICON = { x: 372, y: 307, w: 280, h: 290 };

export interface LogoProps {
  variant?: "full" | "icon";
  size?: number;
  className?: string;
}

/** bookmycourt mark, cropped from the uploaded logo asset; "full" adds the lowercase wordmark. */
export function Logo({ variant = "full", size = 32, className }: LogoProps) {
  const scale = size / ICON.w;
  const icon = (
    <span
      className="relative block shrink-0 overflow-hidden rounded-[22%]"
      style={{ width: size, height: ICON.h * scale }}
      aria-hidden={variant === "full"}
    >
      <img
        src={logoAsset.url}
        alt={variant === "icon" ? APP_NAME : ""}
        className="absolute max-w-none"
        style={{ width: 1024 * scale, left: -ICON.x * scale, top: -ICON.y * scale }}
      />
    </span>
  );
  if (variant === "icon") return <span className={className}>{icon}</span>;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {icon}
      <span className="font-semibold tracking-tight text-chalk" style={{ fontSize: size * 0.62 }}>
        {APP_NAME}
      </span>
    </span>
  );
}
