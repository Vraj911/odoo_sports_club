import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { Search, User, Phone, CheckCircle2, ChevronRight, X } from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { Money } from "@/components/shared/Money";
import { searchDeskMembers } from "@/features/desk/sampleData";
import type { DeskMember } from "@/features/desk/types";
import { cn } from "@/lib/cn";

export interface MemberSearchProps {
  onSelectMember?: (member: DeskMember) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function MemberSearch({
  onSelectMember,
  placeholder = "Search member by name, phone (+91), or CC-xxxxxx... (⌘K)",
  className,
  autoFocus = false,
}: MemberSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DeskMember[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce search by 200ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const hits = searchDeskMembers(query);
      setResults(hits);
      setIsOpen(hits.length > 0);
      setSelectedIndex(0);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const chosen = results[selectedIndex];
      if (chosen) {
        handleSelect(chosen);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelect = (member: DeskMember) => {
    setQuery("");
    setIsOpen(false);
    if (onSelectMember) {
      onSelectMember(member);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative flex items-center w-full">
        <Search className="absolute left-4 size-4.5 text-chalk/50 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="h-12 w-full rounded-pill border border-chalk/18 bg-white/8 pl-11 pr-12 text-sm text-chalk placeholder-chalk/50 focus:border-volt-400 focus:outline-none focus:ring-4 focus:ring-volt-400/25 transition-all"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3.5 p-1 rounded-full text-chalk/50 hover:bg-chalk/10 hover:text-chalk"
          >
            <X className="size-4" />
          </button>
        ) : (
          <span className="absolute right-3.5 rounded-pill bg-white/10 px-2 py-0.5 text-[10px] font-mono text-chalk/50 pointer-events-none">
            ⌘K
          </span>
        )}
      </div>

      {/* Results Dropdown Popover */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-[20px] border border-chalk/18 bg-navy-800 shadow-2xl backdrop-blur-xl">
          <div className="p-2 border-b border-chalk/10 text-[10px] font-semibold uppercase tracking-wider text-chalk/50 flex justify-between px-3">
            <span>Matching Members ({results.length})</span>
            <span>Use ↑ ↓ to navigate, Enter to select</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-chalk/8 p-1">
            {results.map((m, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m)}
                  className={cn(
                    "flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition-colors",
                    isSelected
                      ? "bg-volt-400/15 border border-volt-400/30 text-chalk"
                      : "hover:bg-chalk/8 text-chalk/90"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={m.avatar}
                      alt={m.name}
                      className="size-9 rounded-xl object-cover border border-chalk/14 shrink-0"
                    />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm truncate text-chalk">
                          {m.name}
                        </span>
                        <span className="font-mono text-xs text-volt-400 font-bold shrink-0">
                          {m.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-chalk/60 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="size-3 text-chalk/40" />
                          {m.phone}
                        </span>
                        <span>·</span>
                        <span>{m.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <StatusPill
                      variant={
                        m.tier === "Gold"
                          ? "volt"
                          : m.tier === "Silver"
                          ? "neutral"
                          : "info"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {m.tier}
                    </StatusPill>

                    <StatusPill
                      variant={
                        m.status === "ACTIVE"
                          ? "success"
                          : m.status === "EXPIRING_SOON"
                          ? "warning"
                          : "danger"
                      }
                      className="text-[10px]"
                    >
                      {m.status.replace("_", " ")}
                    </StatusPill>

                    {m.dues > 0 && (
                      <span className="rounded-md bg-danger/15 px-1.5 py-0.5 text-[10px] font-mono text-danger font-bold">
                        Dues: <Money amount={m.dues} />
                      </span>
                    )}

                    <ChevronRight className="size-4 text-chalk/40" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
