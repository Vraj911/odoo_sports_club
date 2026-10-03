import { forwardRef, type InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SearchBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  onShortcutClick?: () => void;
}

export const SearchBox = forwardRef<HTMLInputElement, SearchBoxProps>(function SearchBox(
  { className, placeholder = "Search members, bookings, products (⌘K)...", onShortcutClick, ...props },
  ref,
) {
  return (
    <div className="relative flex items-center w-full max-w-md">
      <Search className="absolute left-4 size-4 pointer-events-none text-chalk/50 shrink-0" />
      <input
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-pill border border-chalk/18 bg-chalk/8 pl-11 pr-14 text-sm text-chalk placeholder:text-chalk/50 transition-all duration-150",
          "focus:border-volt-400 focus:outline-none focus:ring-4 focus:ring-volt-400/25",
          className,
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onShortcutClick}
        tabIndex={-1}
        className="absolute right-3 inline-flex items-center gap-0.5 rounded-pill bg-chalk/10 px-2 py-1 text-[11px] font-medium text-chalk/60 hover:bg-chalk/20"
      >
        <span>⌘K</span>
      </button>
    </div>
  );
});
