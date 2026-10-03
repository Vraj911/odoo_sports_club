import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean | undefined;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, options, id, className, value, ...props },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="text-[13px] font-medium text-chalk/80">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <select
          ref={ref}
          id={selectId}
          value={value}
          className={cn(
            "h-12 w-full appearance-none rounded-[14px] border border-chalk/18 bg-chalk/8 px-4 pr-10 text-sm text-chalk transition-all duration-150 cursor-pointer",
            "focus:border-volt-400 focus:outline-none focus:ring-4 focus:ring-volt-400/25",
            error && "border-danger focus:border-danger focus:ring-danger/25",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled}
              className="bg-navy-800 text-chalk py-2"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 size-4 pointer-events-none text-chalk/60" />
      </div>
      {error ? (
        <p className="flex items-center gap-1 text-xs text-danger">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-chalk/60">{hint}</p>
      ) : null}
    </div>
  );
});
