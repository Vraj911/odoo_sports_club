import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, LogOut, UserCog } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useGo } from "@/app/router/links";
import { useDisclosure } from "@/hooks/useDisclosure";
import { ROLE_HOME, ROLE_LABELS, ROLES } from "@/lib/constants";
import { cn } from "@/lib/cn";

/** Dev-only floating pill to preview each role/layout instantly. */
export function DevRoleSwitcher() {
  const { user, loginAs, logout } = useAuth();
  const { isOpen, toggle, close } = useDisclosure();
  const go = useGo();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [isOpen, close]);

  return (
    <div ref={ref} className="fixed bottom-20 left-4 z-40 md:bottom-4">
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-12 left-0 w-56 rounded-card border border-line bg-navy-800 p-1.5 shadow-card"
          >
            {ROLES.map((role) => (
              <li key={role}>
                <button
                  onClick={() => {
                    loginAs(role);
                    close();
                    go(ROLE_HOME[role]);
                  }}
                  className={cn(
                    "w-full rounded-pill px-3 py-1.5 text-left text-sm transition-colors hover:bg-chalk/10",
                    user?.role === role && "bg-volt-400 text-ink-900 hover:bg-volt-500",
                  )}
                >
                  {ROLE_LABELS[role]}
                </button>
              </li>
            ))}
            <li className="mt-1 border-t border-line pt-1">
              <button
                onClick={() => {
                  logout();
                  close();
                  go("/");
                }}
                className="flex w-full items-center gap-2 rounded-pill px-3 py-1.5 text-left text-sm text-danger hover:bg-chalk/10"
              >
                <LogOut className="size-3.5" aria-hidden /> Sign out
              </button>
            </li>
          </motion.ul>
        )}
      </AnimatePresence>
      <button
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Switch preview role"
        className="flex items-center gap-2 rounded-pill border border-line bg-navy-950/90 px-3.5 py-2 text-xs font-medium text-chalk shadow-card backdrop-blur"
      >
        <UserCog className="size-3.5 text-volt-400" aria-hidden />
        {user ? ROLE_LABELS[user.role] : "Signed out"}
        <ChevronUp className={cn("size-3.5 transition-transform", !isOpen && "rotate-180")} aria-hidden />
      </button>
    </div>
  );
}
