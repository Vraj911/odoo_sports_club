import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/cn";

export interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(
  { label, hint, error, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-chalk/80">
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        <CalendarIcon className="absolute left-3.5 size-4 pointer-events-none text-chalk/50" />
        <input
          ref={ref}
          id={inputId}
          type="date"
          className={cn(
            "h-12 w-full rounded-[14px] border border-chalk/18 bg-chalk/8 pl-11 pr-4 text-sm text-chalk transition-all duration-150 [color-scheme:dark]",
            "focus:border-volt-400 focus:outline-none focus:ring-4 focus:ring-volt-400/25",
            error && "border-danger focus:border-danger focus:ring-danger/25",
            className,
          )}
          {...props}
        />
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
