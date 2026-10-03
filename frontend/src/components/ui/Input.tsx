import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  leftIcon?: ReactNode | undefined;
  rightElement?: ReactNode | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightElement, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-chalk/80">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 pointer-events-none text-chalk/50 flex items-center justify-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-[14px] border border-chalk/18 bg-chalk/8 px-4 text-sm text-chalk placeholder:text-chalk/50 transition-all duration-150",
            "focus:border-volt-400 focus:outline-none focus:ring-4 focus:ring-volt-400/25",
            leftIcon && "pl-11",
            rightElement && "pr-11",
            error && "border-danger focus:border-danger focus:ring-danger/25",
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3.5 flex items-center justify-center text-chalk/60">
            {rightElement}
          </div>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-chalk/60">{hint}</p>
      ) : null}
    </div>
  );
});
