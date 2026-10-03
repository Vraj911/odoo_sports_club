import logoImg from "@/assets/logo/bookmycourt-logo.png";
import { APP_NAME } from "@/lib/constants";
import { cn } from "@/lib/cn";

export interface LogoProps {
  variant?: "full" | "icon";
  size?: number;
  className?: string;
  textClassName?: string;
}

/** bookmycourt mark with optional lowercase wordmark */
export function Logo({ variant = "full", size = 32, className, textClassName }: LogoProps) {
  const icon = (
    <span
      className="relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md"
      style={{ width: size, height: size }}
      aria-hidden={variant === "full"}
    >
      <img
        src={logoImg}
        alt={variant === "icon" ? APP_NAME : ""}
        className="h-full w-full object-contain"
        width={size}
        height={size}
      />
    </span>
  );

  if (variant === "icon") {
    return <span className={cn("inline-flex items-center justify-center shrink-0", className)}>{icon}</span>;
  }

  return (
    <span className={cn("inline-flex items-center gap-2.5 shrink-0", className)}>
      {icon}
      <span
        className={cn("font-semibold tracking-tight text-chalk whitespace-nowrap select-none", textClassName)}
        style={{ fontSize: size * 0.62 }}
      >
        {APP_NAME}
      </span>
    </span>
  );
}
