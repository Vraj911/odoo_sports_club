import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, ArrowRight, CornerDownLeft } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { routeConfig, hasParams } from "@/app/router/routeConfig";
import { canAccessRoute } from "@/lib/permissions";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { user } = useAuth();
  const go = useGo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const filteredRoutes = routeConfig
    .filter((r) => !hasParams(r.path))
    .filter((r) => r.access.length === 0 || canAccessRoute(user, r.access))
    .filter((r) =>
      r.title.toLowerCase().includes(query.toLowerCase()) ||
      r.path.toLowerCase().includes(query.toLowerCase())
    );

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery("");
    go(path);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDownMenu = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredRoutes.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredRoutes.length) % Math.max(1, filteredRoutes.length));
    } else if (e.key === "Enter" && filteredRoutes[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredRoutes[selectedIndex].path);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-[20px] border border-chalk/18 bg-court-600 shadow-2xl text-chalk"
          >
            <div className="flex items-center border-b border-chalk/14 px-4 py-3">
              <Search className="size-5 text-chalk/50 mr-3 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDownMenu}
                placeholder="Type a page name or command..."
                autoFocus
                className="w-full bg-transparent text-base text-chalk placeholder:text-chalk/40 focus:outline-none"
              />
              <span className="rounded-md bg-chalk/10 px-2 py-0.5 text-xs text-chalk/60 font-mono">
                ESC
              </span>
            </div>

            <div className="max-h-[360px] overflow-y-auto p-2">
              {filteredRoutes.length === 0 ? (
                <div className="p-8 text-center text-sm text-chalk/60">
                  No matching pages found for "{query}"
                </div>
              ) : (
                filteredRoutes.map((route, idx) => {
                  const Icon = route.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={route.path}
                      onClick={() => handleSelect(route.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-center justify-between rounded-input px-3 py-2.5 text-sm transition-colors ${
                        isSelected ? "bg-volt-400 text-ink-900 font-medium" : "text-chalk/80 hover:bg-chalk/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`size-4 ${isSelected ? "text-ink-900" : "text-chalk/60"}`} />
                        <span>{route.title}</span>
                        <span className={`text-xs ${isSelected ? "text-ink-900/70" : "text-chalk/40"}`}>
                          {route.path}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-xs">
                          <span>Jump</span>
                          <CornerDownLeft className="size-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex items-center justify-between border-t border-chalk/14 bg-court-700/60 px-4 py-2 text-xs text-chalk/50">
              <span>Navigate with ↑ ↓ · Press Enter to jump</span>
              <span>bookmycourt</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
