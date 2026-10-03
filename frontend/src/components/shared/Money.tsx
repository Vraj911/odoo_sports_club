import { cn } from "@/lib/cn";

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function Money({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {formatINR(amount)}
    </span>
  );
}
