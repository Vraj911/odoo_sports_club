import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-chalk/80">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(
          "h-11 rounded-input border border-line bg-navy-900/50 px-4 text-sm text-chalk placeholder:text-chalk/40 transition-colors",
          "focus:border-volt-400 focus:outline-none focus:ring-2 focus:ring-volt-400/40",
          error && "border-danger focus:border-danger focus:ring-danger/40",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-chalk/60">{hint}</p>
      ) : null}
    </div>
  );
});
